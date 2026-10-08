import { isCaseOpen } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { notify } from "../../lib/notify.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import type { Actor } from "./caseGuard.js";

const WINDOW_MS = 10 * 60_000, MAX_PER_WINDOW = 30;
// Lectura/escritura: comprador y vendedor del pedido, custodio asignado y Técnico.
export async function chatCase(caseId: string, actor: Actor) {
  const [row, user] = await Promise.all([
    prisma.handoverCase.findUnique({ where: { id: caseId }, include: { order: true } }),
    prisma.user.findUnique({ where: { id: actor.sub }, select: { role: true } }),
  ]);
  const party = row && [row.order.buyerId, row.order.sellerId].includes(actor.sub);
  const staff = row && user && (user.role === "admin" || (user.role === "moderator" && row.assigneeId === actor.sub));
  if (!row || !user || !(party || staff)) scheduleFail("NOT_FOUND", "Caso no encontrado", 404);
  return { row, role: user.role };
}
export async function listMessages(caseId: string, actor: Actor) {
  await chatCase(caseId, actor);
  const rows = await prisma.caseMessage.findMany({ where: { caseId }, orderBy: { createdAt: "asc" }, take: 200,
    include: { author: { select: { id: true, role: true, profile: { select: { fullName: true } } } } } });
  return rows.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, authorId: m.authorId,
    authorName: m.author.profile?.fullName ?? "Participante", staff: m.author.role === "admin" || m.author.role === "moderator" }));
}
function target(userId: string, order: { buyerId: string; sellerId: string }, caseId: string) {
  return `${userId === order.buyerId ? "/pedidos" : userId === order.sellerId ? "/ventas" : "/equipo"}?case=${caseId}`;
}
export async function postMessage(caseId: string, actor: Actor, body: string) {
  const { row } = await chatCase(caseId, actor);
  if (!isCaseOpen(row.status)) scheduleFail("CASE_CLOSED", "El caso está cerrado");
  const recent = await prisma.caseMessage.count({ where: { caseId, authorId: actor.sub, createdAt: { gt: new Date(Date.now() - WINDOW_MS) } } });
  if (recent >= MAX_PER_WINDOW) scheduleFail("RATE_LIMITED", "Demasiados mensajes seguidos; espera unos minutos", 429);
  const message = await prisma.caseMessage.create({ data: { caseId, authorId: actor.sub, body } });
  await prisma.auditLog.create({ data: { actorId: actor.sub, action: "case.message", entity: "HandoverCase", entityId: caseId } });
  const others = [row.order.buyerId, row.order.sellerId, row.assigneeId].filter((id): id is string => !!id && id !== actor.sub);
  for (const userId of new Set(others)) {
    const link = target(userId, row.order, caseId);
    // Agrupado: un solo aviso sin leer por caso y persona.
    if (await prisma.notification.findFirst({ where: { userId, type: "CASE_MESSAGE", readAt: null, link }, select: { id: true } })) continue;
    await notify({ userId, type: "CASE_MESSAGE", title: "Mensaje nuevo en tu trato", body: row.order.itemTitle, link });
  }
  return message;
}
