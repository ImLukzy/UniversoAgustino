import type { OrderStatus, Prisma } from "@prisma/client";
import { canTransition } from "@hub/shared";
import { managedCase, type Actor } from "./caseGuard.js";
import { scheduleFail } from "../staff/scheduleGuard.js";

export function orderTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) scheduleFail("BAD_STATE", `No se puede pasar el pedido de ${from} a ${to}`);
}
export async function currentAppointment(tx: Prisma.TransactionClient, id: string, actor: Actor, kind: string) {
  const row = await managedCase(tx, id, actor), now = new Date();
  const appointment = row.appointments.find((a) => a.kind === kind && a.status === "SCHEDULED");
  if (!appointment || now < appointment.startsAt || now > appointment.endsAt) scheduleFail("BAD_STATE", "Esta acción requiere una cita vigente");
  return { row, appointment, now };
}
