import { ReportActionSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { moderateListing } from "../../lib/moderationListing.js";
import { notify } from "../../lib/notify.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";

const fail = (status: number, code: string, message: string): never => { throw Object.assign(new Error(message), { status, code }); };
type RemovalNotice = { userId: string; type: "PUBLICATION_REMOVED"; title: string; body: string; link: string };

export const actionReport = asyncHandler(async (req: AuthedRequest, res) => {
  const input = ReportActionSchema.parse(req.body); const id = String(req.params.id); const notices: RemovalNotice[] = [];
  const result = await prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({ where: { id } });
    if (!report) return fail(404, "NOT_FOUND", "Reporte no encontrado");
    if (report.status !== "OPEN") return fail(409, "REPORT_RESOLVED", "Este reporte ya fue resuelto");
    if (input.decision === "ACTIONED" && report.targetType !== "user" && !input.reason)
      return fail(400, "VALIDATION", "Indica el motivo para retirar la publicación");
    if (input.decision === "ACTIONED" && report.targetType !== "user") {
      let kind: "document" | "bazar" = report.targetType === "bazar" ? "bazar" : "document";
      let listingId = report.targetId;
      if (report.targetType === "order") {
        const order = await tx.order.findUnique({ where: { id: report.targetId }, select: { itemType: true, itemId: true } });
        if (!order || !["document", "bazar"].includes(order.itemType)) return fail(404, "NOT_FOUND", "Publicación del pedido no encontrada");
        kind = order.itemType as "document" | "bazar"; listingId = order.itemId;
      }
      const listing = kind === "document"
        ? await tx.document.findUnique({ where: { id: listingId }, select: { id: true, authorId: true, removedAt: true, status: true } })
        : await tx.bazarItem.findUnique({ where: { id: listingId }, select: { id: true, sellerId: true, removedAt: true } });
      if (!listing) return fail(404, "NOT_FOUND", "Publicación no encontrada");
      const ownerId = kind === "document" ? (listing as { authorId: string }).authorId : (listing as { sellerId: string }).sellerId;
      await moderateListing({ id: listingId, kind, actorId: req.user!.sub, ownerId, removedAt: listing.removedAt,
        legacyTakedown: kind === "document" && (listing as { status: string }).status === "TAKEDOWN", reason: input.reason,
        update: (data) => kind === "document" ? tx.document.update({ where: { id: listingId }, data }) : tx.bazarItem.update({ where: { id: listingId }, data }),
        audit: (action) => tx.auditLog.create({ data: { actorId: req.user!.sub, action, entity: kind, entityId: listingId } }),
        notify: (notice) => { notices.push(notice as RemovalNotice); return Promise.resolve(); } });
    }
    const changed = await tx.report.updateMany({ where: { id, status: "OPEN" }, data: { status: input.decision } });
    if (!changed.count) return fail(409, "REPORT_RESOLVED", "Este reporte ya fue resuelto");
    await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "report.action", entity: "report", entityId: id, meta: input.decision } });
    return { report: { ...report, status: input.decision }, reporterId: report.reporterId };
  });
  for (const notice of notices) await notify(notice);
  if (result.reporterId) await notify({ userId: result.reporterId, type: "REPORT_RESOLVED", title: "Tu reporte fue revisado",
    body: input.decision === "ACTIONED" ? "El equipo atendió tu reporte." : "El equipo revisó y desestimó tu reporte.", link: "/pedidos" });
  res.json({ data: result.report });
});
