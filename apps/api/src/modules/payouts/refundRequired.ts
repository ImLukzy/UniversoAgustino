import { ResumePayoutSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { accountRole } from "../staff/accountPermissions.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { notify, buyerOrderLink } from "../../lib/notify.js";
import { payoutNotice } from "./notices.js";
export const REFUND_REQUIRED = "Requiere reembolso";
export async function markRefundRequired(id: string, actorId: string, body: unknown) {
  const input = ResumePayoutSchema.parse(body);
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    if (await accountRole(tx, actorId) !== "admin") scheduleFail("FORBIDDEN", "Solo el Técnico decide el reembolso", 403);
    const p = await tx.payout.findUniqueOrThrow({ where: { id }, include: { order: true } });
    if (p.status !== "FROZEN" || p.order.status !== "ESCROW" || p.refundRequired) scheduleFail("BAD_STATE", "No hay reclamo congelado pendiente de decisión");
    const payout = await tx.payout.update({ where: { id }, data: { refundRequired: true, frozenReason: `${REFUND_REQUIRED}: ${input.reason}. Reclamo: ${p.frozenReason ?? ""}` } });
    await tx.auditLog.create({ data: { actorId, action: "payout.refund_required", entity: "payout", entityId: id, meta: JSON.stringify(input) } });
    return { payout, buyerId: p.order.buyerId };
  });
  await payoutNotice(result.payout, "PAYOUT_FROZEN");
  await notify({ userId: result.buyerId, type: "PAYOUT_FROZEN", title: "Reembolso pendiente", body: REFUND_REQUIRED,
    link: buyerOrderLink(result.payout.orderId) });
  return result.payout;
}
