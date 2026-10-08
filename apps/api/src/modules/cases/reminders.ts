import { prisma } from "../../lib/prisma.js";
import { notify } from "../../lib/notify.js";
import { localInstant, localParts, type Hours } from "./calendar.js";

const DAY_MS = 86_400_000, SEND_MINUTE = 8 * 60, DAY_BEFORE_MS = DAY_MS;
// 08:00 (Lima) del último día hábil anterior al de la cita; domingos y feriados no cuentan.
export function reminderInstant(startsAt: Date, hours: readonly Hours[], holidays: readonly string[]): Date {
  const first = localInstant(localParts(startsAt).day, 0);
  for (let back = 1; back <= 14; back++) {
    const part = localParts(new Date(first.getTime() - back * DAY_MS));
    if (part.weekday !== 0 && !holidays.includes(part.day) && hours.some((h) => h.weekday === part.weekday)) return localInstant(part.day, SEND_MINUTE);
  }
  return new Date(startsAt.getTime() - DAY_BEFORE_MS);
}
// Con menos de 24 h de margen el recordatorio ya vence al agendar.
export const reminderDue = (startsAt: Date, now: Date, hours: readonly Hours[], holidays: readonly string[]) =>
  startsAt > now && (startsAt.getTime() - now.getTime() < DAY_BEFORE_MS || now >= reminderInstant(startsAt, hours, holidays));

type Reminded = { id: string; kind: string; partyId: string; staffId: string; startsAt: Date; case: { order: { itemTitle: string } }; sede: { name: string; address: string; meetingPoint: string } };
// Una sola instancia gana la marca; solo entonces avisa (idempotente aunque corran dos).
export async function remind(appointment: Reminded): Promise<boolean> {
  const claimed = await prisma.appointment.updateMany({ where: { id: appointment.id, status: "SCHEDULED", reminderSentAt: null }, data: { reminderSentAt: new Date() } });
  if (!claimed.count) return false;
  const when = appointment.startsAt.toLocaleString("es-PE", { timeZone: "America/Lima" });
  const body = `${appointment.case.order.itemTitle}: ${when} (Lima) en ${appointment.sede.name}, ${appointment.sede.address}; ${appointment.sede.meetingPoint}.`;
  await Promise.all([appointment.partyId, appointment.staffId].map((userId) => notify({ userId, type: "ORDER_APPOINTMENT_REMINDER",
    title: "Recordatorio de tu cita", body, link: userId === appointment.staffId ? "/equipo" : appointment.kind === "DROP_OFF" ? "/ventas" : "/pedidos" })));
  return true;
}
const include = { case: { select: { order: { select: { itemTitle: true } } } }, sede: true } as const;
export async function sendDueReminders(now = new Date()): Promise<number> {
  const [hours, holidays, pending] = await Promise.all([
    prisma.openingHours.findMany(), prisma.holiday.findMany(),
    prisma.appointment.findMany({ where: { status: "SCHEDULED", reminderSentAt: null, startsAt: { gt: now } }, include, orderBy: { startsAt: "asc" }, take: 500 }),
  ]);
  const days = holidays.map((h) => h.date.toISOString().slice(0, 10));
  let sent = 0;
  for (const a of pending) if (reminderDue(a.startsAt, now, hours, days) && await remind(a)) sent++;
  return sent;
}
// Gancho al agendar: si la cita está a menos de 24 h el recordatorio sale ya.
export async function remindIfDue(appointmentId: string, now = new Date()): Promise<void> {
  try {
    const a = await prisma.appointment.findUnique({ where: { id: appointmentId }, include });
    if (!a || a.status !== "SCHEDULED") return;
    const [hours, holidays] = await Promise.all([prisma.openingHours.findMany(), prisma.holiday.findMany()]);
    if (reminderDue(a.startsAt, now, hours, holidays.map((h) => h.date.toISOString().slice(0, 10)))) await remind(a);
  } catch (e) { console.error("[reminder] failed", e instanceof Error ? e.message : e); }
}
