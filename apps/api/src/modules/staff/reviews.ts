import { Router } from "express";
import { z } from "zod";
import { ListQuerySchema, RejectReviewSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { approvedCounts } from "../../lib/moderation.js";
import { notify } from "../../lib/notify.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";

export const reviewsRouter = Router();
const Type = z.enum(["document", "bazar"]);
const ownerSelect = { select: { id: true, email: true, profile: { select: { fullName: true } } } } as const;
const fields = { id: true, title: true, priceCents: true, description: true, createdAt: true } as const;
function fail(status: number, code: string, message: string): never {
  throw Object.assign(new Error(message), { status, code });
}

reviewsRouter.get("/", asyncHandler(async (req, res) => {
  const q = ListQuerySchema.pick({ page: true, pageSize: true }).extend({ type: Type.default("document") }).parse(req.query);
  const options = { where: { reviewStatus: "PENDING" as const }, orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }],
    skip: (q.page - 1) * q.pageSize, take: q.pageSize };
  const [documents, bazar] = await Promise.all([
    prisma.document.count({ where: { reviewStatus: "PENDING" } }),
    prisma.bazarItem.count({ where: { reviewStatus: "PENDING" } }),
  ]);
  const rows = q.type === "document" ?
    (await prisma.document.findMany({ ...options, select: { ...fields, author: ownerSelect } })).map((r) => ({ ...r, owner: r.author })) :
    (await prisma.bazarItem.findMany({ ...options, select: { ...fields, seller: ownerSelect } })).map((r) => ({ ...r, owner: r.seller }));
  const counts = await approvedCounts([...new Set(rows.map((r) => r.owner.id))]);
  const data = rows.map((r) => ({ id: r.id, title: r.title, priceCents: r.priceCents, description: r.description, createdAt: r.createdAt,
    type: q.type, previewUrl: q.type === "document" ? `/v/${encodeURIComponent(r.id)}` : `/p/bazar/${encodeURIComponent(r.id)}`,
    author: { id: r.owner.id, email: r.owner.email, fullName: r.owner.profile?.fullName ?? "", approvedCount: counts.get(r.owner.id) ?? 0 } }));
  res.json({ data, page: q.page, pageSize: q.pageSize, total: q.type === "document" ? documents : bazar, pendingTotal: documents + bazar });
}));

async function decide(req: AuthedRequest, approve: boolean) {
  const type = Type.parse(req.params.type);
  const reason = approve ? null : RejectReviewSchema.parse(req.body).reason;
  const id = req.params.id;
  const reviewedAt = new Date();
  const data = { reviewStatus: approve ? "APPROVED" as const : "REJECTED" as const, reviewNote: reason, reviewedAt, reviewedById: req.user!.sub };
  const ownerId = await prisma.$transaction(async (tx) => {
    const item = type === "document" ?
      await tx.document.findUnique({ where: { id }, select: { authorId: true } }).then((r) => r && { ownerId: r.authorId }) :
      await tx.bazarItem.findUnique({ where: { id }, select: { sellerId: true } }).then((r) => r && { ownerId: r.sellerId });
    if (!item) fail(404, "NOT_FOUND", "Publicación no encontrada");
    const where = { id, reviewStatus: "PENDING" as const };
    const changed = type === "document" ? await tx.document.updateMany({ where, data }) : await tx.bazarItem.updateMany({ where, data });
    if (!changed.count) fail(409, "BAD_STATE", "Solo se revisan publicaciones pendientes");
    await tx.auditLog.create({ data: { actorId: req.user!.sub, action: approve ? "review.approve" : "review.reject", entity: type, entityId: id, meta: reason } });
    return item.ownerId;
  });
  await notify({ userId: ownerId, type: approve ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
    title: approve ? "Publicación aprobada" : "Publicación rechazada", body: reason ?? "Tu publicación ya aparece en el catálogo.", link: "/publicaciones" });
  return { id, ...data };
}
reviewsRouter.post("/:type/:id/approve", asyncHandler(async (req: AuthedRequest, res) => { res.json({ data: await decide(req, true) }); }));
reviewsRouter.post("/:type/:id/reject", asyncHandler(async (req: AuthedRequest, res) => { res.json({ data: await decide(req, false) }); }));
