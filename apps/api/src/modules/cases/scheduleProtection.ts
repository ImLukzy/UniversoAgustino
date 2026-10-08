import type { Prisma } from "@prisma/client";
import { localParts, localInstant } from "./calendar.js";
import { scheduleFail } from "../staff/scheduleGuard.js";

type Shift = { userId: string; sedeId: string; weekday: number; startsMin: number; endsMin: number };
export async function protectShift(tx: Prisma.TransactionClient, id: string, replacement?: Shift) {
  const appointments = await tx.appointment.findMany({ where: { shiftId: id, status: "SCHEDULED", endsAt: { gt: new Date() } } });
  if (appointments.some((a) => {
    const part = localParts(a.startsAt);
    return !replacement || replacement.userId !== a.staffId || replacement.sedeId !== a.sedeId || replacement.weekday !== part.weekday
      || replacement.startsMin > part.minute || replacement.endsMin < part.minute + 15;
  })) scheduleFail("HAS_APPOINTMENTS", "Este cambio dejaría citas sin turno; reasigna o cancela primero");
}
export async function protectHoliday(tx: Prisma.TransactionClient, day: string) {
  const start = localInstant(day, 0), end = localInstant(day, 1440);
  if (await tx.appointment.count({ where: { status: "SCHEDULED", startsAt: { gte: start, lt: end }, endsAt: { gt: new Date() } } }))
    scheduleFail("HAS_APPOINTMENTS", "Ese día tiene citas; reprograma o cancela primero");
}
