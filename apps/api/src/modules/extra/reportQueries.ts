import { z } from "zod";
import { ListQuerySchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";

const Query = ListQuerySchema.pick({ page: true, pageSize: true }).extend({ status: z.enum(["OPEN", "ACTIONED", "DISMISSED"]).optional() });
type Publication = { type: string; id: string; title: string };

export const listReports = asyncHandler(async (req, res) => {
  const q = Query.parse(req.query); const where = q.status ? { status: q.status } : {};
  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (q.page - 1) * q.pageSize, take: q.pageSize,
      include: { reporter: { select: { id: true, profile: { select: { fullName: true } } } } } }),
  ]);
  const ids = (kind: string) => reports.filter((r) => r.targetType === kind).map((r) => r.targetId);
  const orders = await prisma.order.findMany({ where: { id: { in: ids("order") } }, select: { id: true, sellerId: true, itemType: true, itemId: true, itemTitle: true } });
  const [documents, bazar] = await Promise.all([
    prisma.document.findMany({ where: { id: { in: [...ids("document"), ...orders.filter((o) => o.itemType === "document").map((o) => o.itemId)] } }, select: { id: true, authorId: true, title: true } }),
    prisma.bazarItem.findMany({ where: { id: { in: [...ids("bazar"), ...orders.filter((o) => o.itemType === "bazar").map((o) => o.itemId)] } }, select: { id: true, sellerId: true, title: true } }),
  ]);
  const docMap = new Map(documents.map((d) => [d.id, d])); const bazarMap = new Map(bazar.map((b) => [b.id, b]));
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const ownerIds = reports.flatMap((r) => {
    if (r.targetType === "document") return docMap.has(r.targetId) ? [docMap.get(r.targetId)!.authorId] : [];
    if (r.targetType === "bazar") return bazarMap.has(r.targetId) ? [bazarMap.get(r.targetId)!.sellerId] : [];
    if (r.targetType === "order") return orderMap.has(r.targetId) ? [orderMap.get(r.targetId)!.sellerId] : [];
    return [r.targetId];
  });
  const users = await prisma.user.findMany({ where: { id: { in: ownerIds } }, select: { id: true, email: true, profile: { select: { fullName: true } } } });
  const userMap = new Map(users.map((u) => [u.id, { id: u.id, nombre: u.profile?.fullName ?? "", correo: u.email }]));
  const publicationFor = (r: typeof reports[number]): Publication | undefined => {
    if (r.targetType === "document") { const d = docMap.get(r.targetId); return d && { type: "document", id: d.id, title: d.title }; }
    if (r.targetType === "bazar") { const b = bazarMap.get(r.targetId); return b && { type: "bazar", id: b.id, title: b.title }; }
    if (r.targetType === "order") {
      const o = orderMap.get(r.targetId); if (!o) return undefined;
      const p = o.itemType === "document" ? docMap.get(o.itemId) : bazarMap.get(o.itemId);
      return { type: o.itemType, id: o.itemId, title: p?.title ?? o.itemTitle };
    }
    return undefined;
  };
  res.json({ data: reports.map((r) => {
    const order = r.targetType === "order" ? orderMap.get(r.targetId) : null;
    const ownerId = r.targetType === "document" ? docMap.get(r.targetId)?.authorId : r.targetType === "bazar" ? bazarMap.get(r.targetId)?.sellerId : r.targetType === "order" ? order?.sellerId : r.targetId;
    return { id: r.id, targetType: r.targetType, targetId: r.targetId, category: r.category, reason: r.reason, status: r.status, createdAt: r.createdAt,
      reporter: r.reporter ? { id: r.reporter.id, nombre: r.reporter.profile?.fullName ?? "" } : null,
      owner: ownerId ? userMap.get(ownerId) ?? null : null, ...(publicationFor(r) ? { publication: publicationFor(r) } : {}) };
  }), page: q.page, pageSize: q.pageSize, total });
});
