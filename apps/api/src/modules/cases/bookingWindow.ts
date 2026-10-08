import type { Prisma } from "@prisma/client";
import { calendarData, caseInclude } from "./caseGuard.js";
import { deadline, localInstant, localParts } from "./calendar.js";
import { scheduleFail } from "../staff/scheduleGuard.js";

export type CaseRow = Prisma.HandoverCaseGetPayload<{ include: typeof caseInclude }>;
export async function bookingWindow(tx: Prisma.TransactionClient, row: CaseRow, kind: string, now: Date) {
  const data = await calendarData(tx);
  if (kind === "RETURN") {
    if (!row.order.rentalEnd || !row.assigneeId) scheduleFail("BAD_STATE", "Este caso no tiene fecha de devolución");
    if (row.returnWindowStart && row.returnDeadlineAt) return { ...data, minimum: row.returnWindowStart, limit: row.returnDeadlineAt };
    const first = localInstant(localParts(row.order.rentalEnd).day, 0);
    const shifts = await tx.staffShift.findMany({ where: { userId: row.assigneeId, sedeId: row.sedeId ?? "" } });
    for (let offset = 0; offset < 90; offset++) {
      const day = new Date(first.getTime() + offset * 86_400_000), part = localParts(day);
      const hours = data.hours.find((h) => h.weekday === part.weekday);
      if (!hours || part.weekday === 0 || data.holidays.includes(part.day)) continue;
      if (!shifts.some((s) => s.weekday === part.weekday && Math.ceil(Math.max(s.startsMin, hours.opens) / 15) * 15 + 15 <= Math.min(s.endsMin, hours.closes))) continue;
      return { ...data, minimum: day, limit: deadline(day, data.hours, data.holidays) };
    }
    scheduleFail("NO_AVAILABILITY", "No hay turno hábil para devolver; solicita revisión al Técnico");
  }
  const anchor = kind === "DROP_OFF" ? row.order.acceptedAt : kind === "PICKUP" ? row.receivedAt
    : row.backToSellerRequestedAt ?? row.returnedAt ?? now;
  if (!anchor) scheduleFail("BAD_STATE", "Falta el evento de inicio del plazo");
  return { ...data, minimum: undefined, limit: deadline(anchor, data.hours, data.holidays) };
}
