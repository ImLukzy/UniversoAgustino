import type { Prisma } from "@prisma/client";
import { canTransitionCase, type CaseStatus } from "@hub/shared";
import { scheduleFail } from "../staff/scheduleGuard.js";

export type Actor = { sub: string; role: string };
export const caseInclude = { order: true, assignee: { select: { id: true, profile: { select: { fullName: true } } } },
  sede: true, appointments: { orderBy: { startsAt: "asc" as const }, include: { sede: true } } };
export async function currentActor(tx: Prisma.TransactionClient, actor: Actor) {
  const user = await tx.user.findUnique({ where: { id: actor.sub }, select: { role: true } });
  if (!user || !["admin", "moderator"].includes(user.role)) scheduleFail("FORBIDDEN", "Solo el equipo gestiona casos", 403);
  return { ...actor, role: user.role };
}
export async function managedCase(tx: Prisma.TransactionClient, id: string, actor: Actor) {
  const current = await currentActor(tx, actor);
  const row = await tx.handoverCase.findUnique({ where: { id }, include: caseInclude });
  if (!row) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
  if (current.role !== "admin" && row.assigneeId !== actor.sub) scheduleFail("FORBIDDEN", "Solo el custodio gestiona este caso", 403);
  return row;
}
export function caseTransition(from: CaseStatus, to: CaseStatus) {
  if (!canTransitionCase(from, to)) scheduleFail("BAD_STATE", `El caso está en ${from}`);
}
export async function calendarData(tx: Prisma.TransactionClient) {
  const [hours, holidays] = await Promise.all([tx.openingHours.findMany(), tx.holiday.findMany()]);
  return { hours, holidays: holidays.map((h) => h.date.toISOString().slice(0, 10)) };
}
