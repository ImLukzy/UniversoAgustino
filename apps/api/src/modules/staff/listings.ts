import type { Prisma } from "@prisma/client";
import { ListQuerySchema, RemoveListingSchema } from "@hub/shared";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { notify } from "../../lib/notify.js";
import { moderateListing } from "../../lib/moderationListing.js";
import { asyncHandler } from "../../middleware/errors.js";
import type { AuthedRequest } from "../../middleware/auth.js";

const Type = z.enum(["document", "bazar"]);
const State = z.enum(["active", "paused", "removed", "pending"]);
const owner = { select: { id: true, email: true, profile: { select: { fullName: true } } } } as const;
const fail = (status: number, code: string, message: string): never => { throw Object.assign(new Error(message), { status, code }); };

function documentWhere(state: z.infer<typeof State> | undefined, search?: { contains: string; mode: "insensitive" }): Prisma.DocumentWhereInput {
  const clauses: Prisma.DocumentWhereInput[] = [];
  if (state === "removed") clauses.push({ OR: [{ removedAt: { not: null } }, { status: "TAKEDOWN" }] });
  if (state === "paused") clauses.push({ removedAt: null, pausedAt: { not: null } });
  if (state === "pending") clauses.push({ removedAt: null, reviewStatus: "PENDING" });
  if (state === "active") clauses.push({ removedAt: null, pausedAt: null, reviewStatus: "APPROVED", status: "PUBLISHED" });
  if (search) clauses.push({ title: search });
  return clauses.length ? { AND: clauses } : {};
}
function bazarWhere(state: z.infer<typeof State> | undefined, search?: { contains: string; mode: "insensitive" }): Prisma.BazarItemWhereInput {
  const clauses: Prisma.BazarItemWhereInput[] = [];
  if (state === "removed") clauses.push({ removedAt: { not: null } });
  if (state === "paused") clauses.push({ removedAt: null, pausedAt: { not: null } });
  if (state === "pending") clauses.push({ removedAt: null, reviewStatus: "PENDING" });
  if (state === "active") clauses.push({ removedAt: null, pausedAt: null, reviewStatus: "APPROVED", status: "AVAILABLE" });
  if (search) clauses.push({ title: search });
  return clauses.length ? { AND: clauses } : {};
}

export const getListings = asyncHandler(async (req, res) => {
  const q = ListQuerySchema.pick({ q: true, page: true, pageSize: true }).extend({ type: Type.optional(), state: State.optional() }).parse(req.query);
  const search = q.q ? { contains: q.q, mode: "insensitive" as const } : undefined;
  const whereD = documentWhere(q.state, search); const whereB = bazarWhere(q.state, search);
  const [dc, bc] = await Promise.all([
    q.type === "bazar" ? 0 : prisma.document.count({ where: whereD }),
    q.type === "document" ? 0 : prisma.bazarItem.count({ where: whereB }),
  ]);
  const total = dc + bc; const skip = (q.page - 1) * q.pageSize; const take = skip + q.pageSize;
  const [docs, bazar] = await Promise.all([
    q.type === "bazar" ? [] : prisma.document.findMany({ where: whereD, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take, select: { id: true, title: true, priceCents: true, status: true, reviewStatus: true, pausedAt: true, removedAt: true, createdAt: true, author: owner } }),
    q.type === "document" ? [] : prisma.bazarItem.findMany({ where: whereB, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take, select: { id: true, title: true, priceCents: true, status: true, reviewStatus: true, pausedAt: true, removedAt: true, createdAt: true, seller: owner } }),
  ]);
  const merged = [...docs.map((r) => ({ ...r, type: "document" as const, owner: r.author, legacy: r.status === "TAKEDOWN" })), ...bazar.map((r) => ({ ...r, type: "bazar" as const, owner: r.seller, legacy: false }))]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id)).slice(skip, skip + q.pageSize);
  const ids = merged.map((r) => r.id);
  const [dr, br] = await Promise.all([
    prisma.report.groupBy({ by: ["targetId"], where: { targetType: "document", status: "OPEN", targetId: { in: ids } }, _count: { _all: true } }),
    prisma.report.groupBy({ by: ["targetId"], where: { targetType: "bazar", status: "OPEN", targetId: { in: ids } }, _count: { _all: true } }),
  ]);
  const documentReportCounts = new Map(dr.map((r) => [r.targetId, r._count._all]));
  const bazarReportCounts = new Map(br.map((r) => [r.targetId, r._count._all]));
  res.json({ data: merged.map((r) => ({ id: r.id, type: r.type, title: r.title, priceCents: r.priceCents,
    state: r.removedAt || r.legacy ? "removed" : r.reviewStatus === "PENDING" ? "pending" : r.pausedAt ? "paused" : "active",
    owner: { id: r.owner.id, nombre: r.owner.profile?.fullName ?? "", correo: r.owner.email },
    openReports: (r.type === "document" ? documentReportCounts : bazarReportCounts).get(r.id) ?? 0, createdAt: r.createdAt })), page: q.page, pageSize: q.pageSize, total });
});

async function change(req: AuthedRequest, restore: boolean) {
  const type = Type.parse(req.params.type); const id = req.params.id;
  const reason = restore ? undefined : RemoveListingSchema.parse(req.body).reason;
  const isDoc = type === "document";
  const row = isDoc ? await prisma.document.findUnique({ where: { id } }) : await prisma.bazarItem.findUnique({ where: { id } });
  if (!row) return fail(404, "NOT_FOUND", "Publicación no encontrada");
  const ownerId = isDoc ? (row as { authorId: string }).authorId : (row as { sellerId: string }).sellerId;
  const result = await moderateListing({ id, kind: type, actorId: req.user!.sub, ownerId,
    removedAt: row.removedAt, legacyTakedown: isDoc && (row as { status: string }).status === "TAKEDOWN", restore, reason,
    update: (data) => isDoc ? prisma.document.update({ where: { id }, data }) : prisma.bazarItem.update({ where: { id }, data }),
    audit: (action) => prisma.auditLog.create({ data: { actorId: req.user!.sub, action, entity: type, entityId: id } }), notify });
  if (result.status === 409) fail(409, result.code, "La publicación no está retirada");
  return result.data;
}
export const removeListingRoute = asyncHandler(async (req: AuthedRequest, res) => { res.json({ data: await change(req, false) }); });
export const restoreListingRoute = asyncHandler(async (req: AuthedRequest, res) => { res.json({ data: await change(req, true) }); });
