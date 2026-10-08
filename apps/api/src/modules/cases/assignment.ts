import { beforeCustody } from "@hub/shared";
import { scheduleChange, scheduleFail } from "../staff/scheduleGuard.js";
import { currentActor, type Actor } from "./caseGuard.js";
import { notify } from "../../lib/notify.js";

export async function assignCase(id: string, assigneeId: string, actor: Actor, take = false) {
  const row = await scheduleChange(actor.sub, take ? "case.take" : "case.assign", "HandoverCase", id, async (tx) => {
    const current = await currentActor(tx, actor);
    const existing = await tx.handoverCase.findUnique({ where: { id } });
    if (!existing) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
    if (take && existing.assigneeId) scheduleFail("ALREADY_ASSIGNED", "Otro miembro ya tomó el caso");
    if (!take && current.role !== "admin") scheduleFail("FORBIDDEN", "Solo el Técnico asigna casos", 403);
    if (!beforeCustody(existing.status)) scheduleFail("BAD_STATE", "No se reasigna un objeto en custodia");
    const staff = await tx.user.findUnique({ where: { id: assigneeId }, select: { role: true } });
    if (!staff || !["admin", "moderator"].includes(staff.role)) scheduleFail("NOT_STAFF", "Selecciona un miembro actual del equipo");
    await tx.appointment.updateMany({ where: { caseId: id, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    return tx.handoverCase.update({ where: { id }, data: { assigneeId, status: "ASSIGNED", sedeId: null }, include: { order: true } });
  });
  await Promise.all([notify({ userId: assigneeId, type: "ORDER_CASE_ASSIGNED", title: "Caso asignado", body: row.order.itemTitle, link: "/equipo" }),
    ...[row.order.buyerId, row.order.sellerId].map((userId) => notify({ userId, type: "ORDER_CASE_ASSIGNED", title: "Custodio asignado",
      body: `${row.order.itemTitle}: el equipo programará la entrega.`, link: userId === row.order.buyerId ? "/pedidos" : "/ventas" }))]);
  return row;
}
