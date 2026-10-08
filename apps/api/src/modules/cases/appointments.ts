import type { AppointmentKind } from "@hub/shared";
import { bookingWindow } from "./bookingWindow.js";
import type { Prisma } from "@prisma/client";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { managedCase, caseTransition, type Actor } from "./caseGuard.js";
import { validSlot } from "./calendar.js";
import { notify } from "../../lib/notify.js";
import { remindIfDue } from "./reminders.js";
import { announceSanction, recordStrike, type AutoSanction } from "../sanctions/strikes.js";

export type Booking = { kind: AppointmentKind; sedeId: string; startsAt: string };
export async function bookInside(tx: Prisma.TransactionClient, id: string, actor: Actor, input: Booking, previousId?: string) {
  const row = await managedCase(tx, id, actor), now = new Date();
  const target = ({ DROP_OFF: "DROP_SCHEDULED", PICKUP: "PICKUP_SCHEDULED", RETURN: "RETURN_SCHEDULED", BACK_TO_SELLER: "BACK_TO_SELLER" } as const)[input.kind];
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
  if (input.kind === "BACK_TO_SELLER" && !previousId) await tx.appointment.updateMany({ where: { caseId: id, kind: "PICKUP", status: "SCHEDULED" }, data: { status: "CANCELLED" } });
  if (!row.assigneeId) scheduleFail("BAD_STATE", "Asigna un custodio primero");
  const data = await bookingWindow(tx, row, input.kind, now), startsAt = new Date(input.startsAt);
  if (data.minimum && startsAt < data.minimum) scheduleFail("BEFORE_RETURN_DATE", "La devolución debe ser desde la fecha final del alquiler");
  const part = validSlot(startsAt, now, data.limit, data.hours, data.holidays);
  const sede = await tx.sede.findUnique({ where: { id: input.sedeId } });
  if (!sede?.active) scheduleFail("SEDE_INACTIVE", "La sede no está activa");
  if (input.kind !== "DROP_OFF" && row.sedeId !== sede.id) scheduleFail("BAD_STATE", "La cita debe realizarse en la sede de custodia");
  const shift = await tx.staffShift.findFirst({ where: { userId: row.assigneeId, sedeId: sede.id,
    weekday: part.weekday, startsMin: { lte: part.minute }, endsMin: { gte: part.minute + 15 } } });
  if (!shift) scheduleFail("OUTSIDE_SHIFT", "El custodio no tiene turno en esa franja");
  if (await tx.appointment.count({ where: { staffId: row.assigneeId, status: "SCHEDULED", startsAt: { lt: part.endsAt }, endsAt: { gt: startsAt } } }))
    scheduleFail("SLOT_TAKEN", "El custodio ya tiene una cita");
  if (await tx.appointment.count({ where: { caseId: id, kind: input.kind, status: "SCHEDULED" } })) scheduleFail("BAD_STATE", "Ya hay una cita programada");
  const appointment = await tx.appointment.create({ data: { caseId: id, kind: input.kind, partyId: ["DROP_OFF", "BACK_TO_SELLER"].includes(input.kind) ? row.order.sellerId : row.order.buyerId,
    staffId: row.assigneeId, sedeId: sede.id, shiftId: shift.id, startsAt, endsAt: part.endsAt, rescheduledFromId: previousId } });
  await tx.handoverCase.update({ where: { id }, data: { status: target, sedeId: sede.id, ...(input.kind === "RETURN" ? { returnWindowStart: data.minimum, returnDeadlineAt: data.limit } : {}),
    ...(input.kind === "BACK_TO_SELLER" ? { backToSellerRequestedAt: row.backToSellerRequestedAt ?? row.returnedAt ?? now } : {}) } });
  return { appointment, row, sede };
}
export async function bookCase(id: string, actor: Actor, input: Booking, previousId?: string) {
  const result = await scheduleChange(actor.sub, previousId ? "appointment.reschedule" : "appointment.create", "HandoverCase", id,
    (tx) => bookInside(tx, id, actor, input, previousId));
  await appointmentNotice(result);
  return result.appointment;
}
export async function appointmentNotice(result: Awaited<ReturnType<typeof bookInside>>) {
  const { appointment, row, sede } = result;
  const when = appointment.startsAt.toLocaleString("es-PE", { timeZone: "America/Lima" });
  const title = { DROP_OFF: "Entrega programada", PICKUP: "Recojo programado", RETURN: "Devolución programada", BACK_TO_SELLER: "Retorno al vendedor programado" }[appointment.kind];
  await notify({ userId: appointment.partyId, type: "ORDER_APPOINTMENT_SCHEDULED", title,
    body: `${row.order.itemTitle} — ${row.assignee?.profile?.fullName ?? "Equipo"}; ${sede.name}, ${sede.address}; ${sede.meetingPoint}; ${when}; S/ ${(row.order.amountCents / 100).toFixed(2)}.`,
    link: ["PICKUP", "RETURN"].includes(appointment.kind) ? "/pedidos" : "/ventas" });
  await remindIfDue(appointment.id);
}

export async function markNoShow(id: string, appointmentId: string, actor: Actor) {
  let sanction: AutoSanction = null;
  const result = await scheduleChange(actor.sub, "appointment.no_show", "Appointment", appointmentId, async (tx) => {
    await managedCase(tx, id, actor);
    const row = await tx.appointment.findUnique({ where: { id: appointmentId } });
    if (!row || row.caseId !== id) scheduleFail("NOT_FOUND", "Cita no encontrada", 404);
    if (row.status !== "SCHEDULED" || row.endsAt >= new Date()) scheduleFail("BAD_STATE", "Solo se marca ausencia después de terminar la cita");
    if (row.kind === "PICKUP" && row.rescheduledFromId) {
      await tx.handoverCase.update({ where: { id }, data: { backToSellerRequestedAt: row.endsAt } });
    }
    const updated = await tx.appointment.update({ where: { id: appointmentId }, data: { status: "NO_SHOW" } });
    sanction = await recordStrike(tx, updated.partyId, appointmentId);
    return updated;
  });
  await notify({ userId: result.partyId, type: "ORDER_APPOINTMENT_NO_SHOW", title: "Ausencia registrada", body: "Contacta al equipo para revisar la reprogramación disponible.", link: ["PICKUP", "RETURN"].includes(result.kind) ? "/pedidos" : "/ventas" });
  await announceSanction(sanction);
  return result;
}
