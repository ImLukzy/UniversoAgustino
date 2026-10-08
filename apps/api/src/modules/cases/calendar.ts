import { scheduleFail } from "../staff/scheduleGuard.js";

export const SLOT_MS = 15 * 60_000;
const DAY_MS = 86_400_000;
export type Hours = { weekday: number; opens: number; closes: number };
export function localParts(date: Date) {
  const local = new Date(date.getTime() - 5 * 3_600_000);
  return { day: local.toISOString().slice(0, 10), weekday: local.getUTCDay(), minute: local.getUTCHours() * 60 + local.getUTCMinutes() };
}
export function localInstant(day: string, minute: number) {
  return new Date(new Date(`${day}T05:00:00Z`).getTime() + minute * 60_000);
}
export function deadline(anchor: Date, hours: readonly Hours[], holidays: readonly string[]) {
  const first = localInstant(localParts(anchor).day, 0);
  let count = 0;
  for (let offset = 1; offset <= 90; offset++) {
    const date = new Date(first.getTime() + offset * DAY_MS);
    const part = localParts(date), open = hours.find((h) => h.weekday === part.weekday);
    if (part.weekday === 0 || !open || holidays.includes(part.day)) continue;
    if (++count === 3) return localInstant(part.day, open.closes);
  }
  return scheduleFail("NO_AVAILABILITY", "No hay tres días hábiles disponibles");
}
export function validSlot(startsAt: Date, now: Date, limit: Date, hours: readonly Hours[], holidays: readonly string[]) {
  const part = localParts(startsAt), open = hours.find((h) => h.weekday === part.weekday);
  if (!Number.isFinite(startsAt.getTime()) || startsAt <= now || startsAt.getUTCSeconds() || startsAt.getUTCMilliseconds() || part.minute % 15)
    scheduleFail("BAD_SLOT", "Selecciona una franja futura de 15 minutos", 400);
  const endsAt = new Date(startsAt.getTime() + SLOT_MS);
  if (endsAt > limit) scheduleFail("DEADLINE_EXCEEDED", "La cita supera los tres días hábiles");
  if (part.weekday === 0 || holidays.includes(part.day) || !open) scheduleFail("DAY_CLOSED", "Ese día no es hábil");
  if (part.minute < open.opens || part.minute + 15 > open.closes) scheduleFail("OUTSIDE_HOURS", "La cita queda fuera del horario hábil");
  return { ...part, endsAt };
}
