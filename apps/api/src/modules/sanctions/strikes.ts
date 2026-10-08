import type { Prisma, Sanction } from "@prisma/client";
import { AUTO_SUSPENSION_DAYS, STRIKE_WINDOW_DAYS, shouldAutoSuspend } from "@hub/shared";
import { notify } from "../../lib/notify.js";

const DAY_MS = 86_400_000;
export type AutoSanction = Sanction | null;
export const sanctionEnd = (s: { endsAt: Date | null }) => (s.endsAt ? s.endsAt.toLocaleDateString("es-PE", { timeZone: "America/Lima" }) : "sin fecha de fin");

// Corre dentro de la transacción de markNoShow (lock 300030): una falta por cita (única) y,
// con 3 vigentes en 90 días y sin suspensión/ban activo, la suspensión automática de 14 días.
export async function recordStrike(tx: Prisma.TransactionClient, userId: string, appointmentId: string, now = new Date()): Promise<AutoSanction> {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role === "admin" || user.role === "moderator") return null;
  if (await tx.strike.findUnique({ where: { appointmentId }, select: { id: true } })) return null;
  await tx.strike.create({ data: { userId, appointmentId } });
  await tx.auditLog.create({ data: { actorId: userId, action: "strike.create", entity: "Appointment", entityId: appointmentId } });
  const active = await tx.strike.count({ where: { userId, forgivenAt: null, createdAt: { gte: new Date(now.getTime() - STRIKE_WINDOW_DAYS * DAY_MS) } } });
  if (!shouldAutoSuspend(active)) return null;
  const blocking = await tx.sanction.count({ where: { userId, kind: { in: ["SUSPENSION", "BAN"] }, liftedAt: null, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } });
  if (blocking) return null;
  const sanction = await tx.sanction.create({ data: { userId, kind: "SUSPENSION", auto: true, startsAt: now,
    endsAt: new Date(now.getTime() + AUTO_SUSPENSION_DAYS * DAY_MS), reason: `${active} faltas en ${STRIKE_WINDOW_DAYS} días` } });
  await tx.auditLog.create({ data: { actorId: userId, action: "sanction.auto", entity: "Sanction", entityId: sanction.id } });
  return sanction;
}
// Después del commit; nunca lanza (notify ya es best-effort).
export async function announceSanction(s: AutoSanction): Promise<void> {
  if (!s) return;
  await notify({ userId: s.userId, type: "SANCTION_APPLIED", title: "Tu cuenta fue suspendida",
    body: `Motivo: ${s.reason}. No podrás solicitar ni publicar hasta el ${sanctionEnd(s)}.`, link: "/panel" });
}
