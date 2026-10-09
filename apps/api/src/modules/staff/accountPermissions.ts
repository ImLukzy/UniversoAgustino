import type { Prisma } from "@prisma/client";
import { scheduleFail } from "./scheduleGuard.js";
export async function accountRole(tx: Prisma.TransactionClient, actorId: string) {
  const actor = await tx.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (!actor || !["moderator", "admin"].includes(actor.role)) scheduleFail("FORBIDDEN", "Tu acceso al equipo terminó", 403);
  return actor.role;
}
