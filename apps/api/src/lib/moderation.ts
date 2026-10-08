import { prisma } from "./prisma.js";
import { env } from "../env.js";

export async function approvedCount(authorId: string): Promise<number> {
  const counts = await Promise.all([
    prisma.document.count({ where: { authorId, reviewStatus: "APPROVED" } }),
    prisma.bazarItem.count({ where: { sellerId: authorId, reviewStatus: "APPROVED" } }),
  ]);
  return counts[0] + counts[1];
}

export async function initialReview(authorId: string): Promise<"PENDING" | "APPROVED"> {
  const user = await prisma.user.findUnique({ where: { id: authorId }, select: { role: true } });
  if (user?.role === "moderator" || user?.role === "admin") return "APPROVED";
  if (env.MODERATION_TRUST_AFTER === 0) return "PENDING";
  return await approvedCount(authorId) >= env.MODERATION_TRUST_AFTER ? "APPROVED" : "PENDING";
}

export function canViewReview(item: { reviewStatus: string }, ownerId: string, user?: { sub: string; role: string }): boolean {
  return item.reviewStatus === "APPROVED" || !!user && (user.sub === ownerId || user.role === "admin" || user.role === "moderator");
}

export function resubmitReview(status: string) {
  return status === "REJECTED" ? { reviewStatus: "PENDING" as const, reviewNote: null, reviewedAt: null, reviewedById: null } : {};
}

// Dos consultas agrupadas para toda la página, sin consultas por cada fila.
export async function approvedCounts(authorIds: string[]): Promise<Map<string, number>> {
  if (!authorIds.length) return new Map();
  const [docs, bazar] = await Promise.all([
    prisma.document.groupBy({ by: ["authorId"], where: { authorId: { in: authorIds }, reviewStatus: "APPROVED" }, _count: { _all: true } }),
    prisma.bazarItem.groupBy({ by: ["sellerId"], where: { sellerId: { in: authorIds }, reviewStatus: "APPROVED" }, _count: { _all: true } }),
  ]);
  const counts = new Map<string, number>();
  for (const row of docs) counts.set(row.authorId, row._count._all);
  for (const row of bazar) counts.set(row.sellerId, (counts.get(row.sellerId) ?? 0) + row._count._all);
  return counts;
}
