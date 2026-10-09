import { notify, buyerOrderLink } from "../../lib/notify.js";
import type { CreateReportInput } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { payoutNotice } from "./notices.js";
export async function createPaymentReport(input: CreateReportInput, reporterId: string) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const order = input.targetType === "order" ? await tx.order.findUnique({ where: { id: input.targetId } }) : null;
    if (input.targetType === "order" && (!order || ![order.buyerId, order.sellerId].includes(reporterId))) scheduleFail("FORBIDDEN", "Solo los participantes reclaman un pedido", 403);
    const report = await tx.report.create({ data: { ...input, reporterId } });
    const pending = order ? await tx.payout.findUnique({ where: { orderId: order.id } }) : null;
    const payout = pending?.status === "PENDING" ? await tx.payout.update({ where: { id: pending.id }, data: { status: "FROZEN", frozenReason: input.reason } }) : null;
    if (payout) await tx.auditLog.create({ data: { actorId: reporterId, action: "payout.freeze", entity: "payout", entityId: payout.id, meta: JSON.stringify({ reportId: report.id }) } });
    return { report, payout, buyerId: order?.buyerId };
  });
  if (result.payout) {
    await payoutNotice(result.payout, "PAYOUT_FROZEN");
    await notify({ userId: result.buyerId!, type: "PAYOUT_FROZEN", title: "Reclamo en revisión", body: "La liquidación quedó congelada. El Técnico revisará el caso; la entrega y el estado de tu pedido se conservan.", link: buyerOrderLink(result.payout.orderId) });
  }
  return result.report;
}
