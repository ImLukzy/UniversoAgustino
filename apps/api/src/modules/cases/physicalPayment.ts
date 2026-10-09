import type { Order, Prisma } from "@prisma/client";
import type { PickupInput } from "@hub/shared";
import { ownPhoto } from "./evidence.js";
import { accountRole } from "../staff/accountPermissions.js";
import { orderTransition } from "./fulfillmentGuard.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
export async function recordPhysicalPayment(tx: Prisma.TransactionClient, order: Order, actorId: string, input: PickupInput, now: Date) {
  if (order.itemType !== "bazar" || order.verifiedAt) scheduleFail("BAD_STATE", "No hay cobro físico pendiente");
  orderTransition(order.status, "PAID"); orderTransition("PAID", "ESCROW");
  const role = await accountRole(tx, actorId);
  const account = input.paymentMethod === "OPERATION" ? await tx.paymentAccount.findUnique({ where: { id: input.paymentAccountId! }, include: { user: { select: { role: true } } } }) : null;
  if (input.paymentMethod === "OPERATION") {
    if (!account?.active || !["moderator", "admin"].includes(account.user.role)) scheduleFail("ACCOUNT_UNAVAILABLE", "Selecciona una cuenta activa del equipo", 400);
    if (role !== "admin" && account.userId !== actorId) scheduleFail("FORBIDDEN", "El cobro debe ingresar a tu cuenta del equipo", 403);
    await ownPhoto(tx, input.paymentProofUrl!, actorId);
    await tx.upload.update({ where: { storedName: input.paymentProofUrl!.slice(9) }, data: { private: true } });
  }
  const collectorId = account?.userId ?? actorId;
  await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paymentAccountId: account?.id ?? null,
    payMethod: account?.method ?? "CASH", payHolder: account?.holder ?? null, payDetail: account?.number ?? null,
    payPhotoUrl: account?.photoUrl ?? null, payQrUrl: account?.qrUrl ?? null,
    payProofUrl: input.paymentProofUrl ?? null, payProof: input.paymentRef ?? (account ? null : "efectivo"), proofSubmittedAt: now } });
  await tx.order.update({ where: { id: order.id }, data: { status: "ESCROW", physicalClosedAt: order.rentalEnd ? null : now, verifiedAt: now, paymentReviewedAt: now,
    paymentReviewedById: actorId, escrow: { create: {} } } });
  await tx.payout.create({ data: { orderId: order.id, sellerId: order.sellerId, collectorId, amountCents: order.amountCents,
    feeCents: order.feeCents, netCents: order.netCents, payMethod: order.sellerPayMethod, payDetail: order.sellerPayDetail,
    payQrUrl: order.sellerPayQrUrl, status: "PENDING", dueAt: new Date(now.getTime() + 48 * 3600000) } });
  return collectorId;
}
