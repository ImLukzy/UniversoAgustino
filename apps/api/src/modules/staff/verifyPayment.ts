import { RejectOrderSchema, canTransition } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { storedNameOf } from "../documents/access.js";
import { hasObject } from "../../lib/storage.js";
import { ownPhoto } from "../cases/evidence.js";
import { accountRole } from "./accountPermissions.js";
import { scheduleFail } from "./scheduleGuard.js";
import { paymentReviewedNotices } from "../orders/paymentNotices.js";

export async function reviewDigitalPayment(id: string, actorId: string, accepted: boolean, reason?: string) {
  const denialReason = accepted ? undefined : RejectOrderSchema.parse({ reason }).reason;
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
    const role = await accountRole(tx, actorId);
    const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { paymentAccount: true } });
    if (!order.paymentAccount || (role !== "admin" && order.paymentAccount.userId !== actorId)) scheduleFail("FORBIDDEN", "Solo el trabajador de la cuenta destino o el Técnico verifica", 403);
    if (order.itemType !== "document" || order.status !== "PAID" || order.verifiedAt || order.paymentRejectedReason || !order.payProofUrl) {
      scheduleFail("BAD_STATE", "El pago no está pendiente de revisión");
    }
    const now = new Date();
    if (accepted) {
      await ownPhoto(tx, order.payProofUrl, order.buyerId);
      const doc = await tx.document.findUnique({ where: { id: order.itemId } });
      const name = storedNameOf(doc?.fileUrl ?? null);
      if (!doc || doc.reviewStatus !== "APPROVED" || !name || !await hasObject(name)) scheduleFail("DOCUMENT_UNAVAILABLE", "El archivo no está disponible; revisa antes de atribuir");
      if (!canTransition(order.status, "ESCROW")) scheduleFail("BAD_STATE", "Transición no permitida");
      await tx.documentAccessGrant.create({ data: { buyerId: order.buyerId, documentId: doc.id, orderId: id,
        fileUrl: doc.fileUrl!, authorId: doc.authorId, grantedAt: now } });
      await tx.payout.create({ data: { orderId: id, sellerId: order.sellerId, collectorId: order.paymentAccount.userId,
        amountCents: order.amountCents, feeCents: order.feeCents, netCents: order.netCents,
        payMethod: order.sellerPayMethod, payDetail: order.sellerPayDetail, payQrUrl: order.sellerPayQrUrl,
        dueAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), status: "PENDING" } });
    }
    const updated = await tx.order.update({ where: { id }, data: {
      ...(accepted ? { status: "ESCROW", verifiedAt: now, escrow: { connectOrCreate: { where: { orderId: id }, create: {} } } } : {}),
      paymentRejectedReason: accepted ? null : denialReason, paymentReviewedAt: now, paymentReviewedById: actorId,
    }, include: { escrow: true } });
    await tx.auditLog.create({ data: { actorId, action: accepted ? "payment.accept" : "payment.deny", entity: "order", entityId: id,
      meta: accepted ? undefined : JSON.stringify({ reason: denialReason }) } });
    return { order: updated, collectorId: order.paymentAccount.userId };
  });
  await paymentReviewedNotices(result.order, result.collectorId, accepted);
  return result.order;
}
