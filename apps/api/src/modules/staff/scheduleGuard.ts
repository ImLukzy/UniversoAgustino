import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export function scheduleFail(code: string, message: string, status = 409): never {
  throw Object.assign(new Error(message), { status, code });
}
export async function scheduleChange<T>(actorId: string, action: string, entity: string, id: string | undefined,
  work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // El lock dura la transacción, también con pooler en modo transaction.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const result = await work(tx);
    const row = result as { id?: string } | null;
    await tx.auditLog.create({ data: { actorId, action, entity, entityId: id ?? row?.id } });
    return result;
  }, { timeout: 20_000 });
}
export async function guardShift(tx: Prisma.TransactionClient, shift: { userId: string; sedeId: string; weekday: number; startsMin: number; endsMin: number }, id?: string) {
  const user = await tx.user.findUnique({ where: { id: shift.userId }, select: { role: true } });
  if (!user || !["admin", "moderator"].includes(user.role)) scheduleFail("NOT_STAFF", "Selecciona un miembro actual del equipo");
  const sede = await tx.sede.findUnique({ where: { id: shift.sedeId } });
  if (!sede?.active) scheduleFail("SEDE_INACTIVE", "La sede no está activa");
  const hours = await tx.openingHours.findUnique({ where: { weekday: shift.weekday } });
  if (!hours) scheduleFail("DAY_CLOSED", "Ese día está cerrado");
  if (shift.startsMin < hours.opens || shift.endsMin > hours.closes) scheduleFail("OUTSIDE_HOURS", "El turno debe estar dentro del horario hábil");
  const overlap = await tx.staffShift.count({ where: { userId: shift.userId, weekday: shift.weekday,
    startsMin: { lt: shift.endsMin }, endsMin: { gt: shift.startsMin }, ...(id ? { id: { not: id } } : {}) } });
  if (overlap) scheduleFail("SHIFT_OVERLAP", "El trabajador ya tiene un turno en esa franja");
}
