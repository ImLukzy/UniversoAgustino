import type { Prisma } from "@prisma/client";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { calendarData, managedCase, caseTransition, type Actor } from "./caseGuard.js";
import { deadline, validSlot } from "./calendar.js";
import { notify } from "../../lib/notify.js";

export type Booking = { kind: "DROP_OFF" | "PICKUP"; sedeId: string; startsAt: string };
export async function bookInside(tx: Prisma.TransactionClient, id: string, actor: Actor, input: Booking, previousId?: string) {
  const row = await managedCase(tx, id, actor), now = new Date();
  const target = input.kind === "DROP_OFF" ? "DROP_SCHEDULED" : "PICKUP_SCHEDULED";
  if (previousId) {
    const previous = await tx.appointment.findUnique({ where: { id: previousId } });
    if (!previous || previous.caseId !== id || previous.kind !== input.kind || previous.status !== "NO_SHOW") scheduleFail("BAD_STATE", "Solo se reprograma una ausencia");
    if (await tx.appointment.count({ where: { caseId: id, kind: input.kind, rescheduledFromId: { not: null } } })) scheduleFail("RESCHEDULE_LIMIT", "Ya se usó la reprogramación de este tipo");
    if (row.status !== target && !(input.kind === "DROP_OFF" && row.status === "ASSIGNED")) scheduleFail("BAD_STATE", "El caso ya cambió");
  } else {
    caseTransition(row.status, target);
    if (await tx.appointment.findFirst({ where: { caseId: id, kind: input.kind, status: "NO_SHOW" } }))
      scheduleFail("RESCHEDULE_REQUIRED", "Selecciona la ausencia que vas a reprogramar");
  }
  if (!row.assigneeId) scheduleFail("BAD_STATE", "Asigna un custodio primero");
  const anchor = input.kind === "DROP_OFF" ? row.order.acceptedAt : row.receivedAt;
  if (!anchor) scheduleFail("BAD_STATE", "Falta el evento de inicio del plazo");
  const data = await calendarData(tx), startsAt = new Date(input.startsAt);
  const part = validSlot(startsAt, now, deadline(anchor, data.hours, data.holidays), data.hours, data.holidays);
  const sede = await tx.sede.findUnique({ where: { id: input.sedeId } });
  if (!sede?.active) scheduleFail("SEDE_INACTIVE", "La sede no está activa");
  if (input.kind === "PICKUP" && row.sedeId !== sede.id) scheduleFail("BAD_STATE", "El objeto debe recogerse en su sede de custodia");
  const shift = await tx.staffShift.findFirst({ where: { userId: row.assigneeId, sedeId: sede.id,
    weekday: part.weekday, startsMin: { lte: part.minute }, endsMin: { gte: part.minute + 15 } } });
  if (!shift) scheduleFail("OUTSIDE_SHIFT", "El custodio no tiene turno en esa franja");
  if (await tx.appointment.count({ where: { staffId: row.assigneeId, status: "SCHEDULED", startsAt: { lt: part.endsAt }, endsAt: { gt: startsAt } } }))
    scheduleFail("SLOT_TAKEN", "El custodio ya tiene una cita");
  if (await tx.appointment.count({ where: { caseId: id, kind: input.kind, status: "SCHEDULED" } })) scheduleFail("BAD_STATE", "Ya hay una cita programada");
  const appointment = await tx.appointment.create({ data: { caseId: id, kind: input.kind, partyId: input.kind === "DROP_OFF" ? row.order.sellerId : row.order.buyerId,
    staffId: row.assigneeId, sedeId: sede.id, shiftId: shift.id, startsAt, endsAt: part.endsAt, rescheduledFromId: previousId } });
  await tx.handoverCase.update({ where: { id }, data: { status: target, sedeId: sede.id } });
  return { appointment, row, sede };
}
export async function bookCase(id: string, actor: Actor, input: Booking, previousId?: string) {
  const result = await scheduleChange(actor.sub, previousId ? "appointment.reschedule" : "appointment.create", "HandoverCase", id,
    (tx) => bookInside(tx, id, actor, input, previousId));
  const { appointment, row, sede } = result;
  const when = appointment.startsAt.toLocaleString("es-PE", { timeZone: "America/Lima" });
  await notify({ userId: appointment.partyId, type: "ORDER_APPOINTMENT_SCHEDULED", title: input.kind === "PICKUP" ? "Recojo programado" : "Entrega programada",
    body: `${row.order.itemTitle} — ${row.assignee?.profile?.fullName ?? "Equipo"}; ${sede.name}, ${sede.address}; ${sede.meetingPoint}; ${when}; S/ ${(row.order.amountCents / 100).toFixed(2)}.`,
    link: input.kind === "PICKUP" ? "/pedidos" : "/ventas" });
  return appointment;
}
export async function markNoShow(id: string, appointmentId: string, actor: Actor) {
  const result = await scheduleChange(actor.sub, "appointment.no_show", "Appointment", appointmentId, async (tx) => {
    await managedCase(tx, id, actor);
    const row = await tx.appointment.findUnique({ where: { id: appointmentId } });
    if (!row || row.caseId !== id) scheduleFail("NOT_FOUND", "Cita no encontrada", 404);
    if (row.status !== "SCHEDULED" || row.endsAt > new Date()) scheduleFail("BAD_STATE", "Solo se marca ausencia después de terminar la cita");
    return tx.appointment.update({ where: { id: appointmentId }, data: { status: "NO_SHOW" } });
  });
  await notify({ userId: result.partyId, type: "ORDER_APPOINTMENT_NO_SHOW", title: "Ausencia registrada", body: "Contacta al equipo para revisar la reprogramación disponible.", link: result.kind === "PICKUP" ? "/pedidos" : "/ventas" });
  return result;
}
