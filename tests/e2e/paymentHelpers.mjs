import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { api, check, login } from "./helper.mjs";

export const proofFile = resolve("tests/e2e/fixtures/payment-proof.png");
export async function createOrder(documentId) {
  const result = await api("/orders", { token: await login("est"), method: "POST", body: { itemType: "document", itemId: documentId } });
  check(result.status === 201, `crear pedido de pago: ${result.status} ${result.error?.message ?? ""}`);
  return result.data;
}
export async function waitOrder(db, id, predicate) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const row = await db.order.findUnique({ where: { id } });
    if (row && predicate(row)) return row;
    await delay(200);
  }
  throw new Error(`pedido ${id} no llegó al estado esperado`);
}
export async function cleanupOrder(db, id) {
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return;
  const payout = await db.payout.findUnique({ where: { orderId: id } });
  const paths = [order.payProofUrl, payout?.proofUrl, payout?.refundProofUrl].filter(Boolean);
  const names = paths.map((path) => path.slice("/uploads/".length));
  await db.report.deleteMany({ where: { targetType: "order", targetId: id } });
  await db.documentAccessGrant.deleteMany({ where: { orderId: id } });
  await db.escrow.deleteMany({ where: { orderId: id } });
  if (payout) await db.payout.delete({ where: { id: payout.id } });
  await db.notification.deleteMany({ where: { OR: [
    { link: { contains: id } },
    { userId: { in: [order.buyerId, order.sellerId, ...(payout ? [payout.collectorId] : [])] }, createdAt: { gte: order.createdAt }, type: { in: ["ORDER_PAID", "PAYMENT_VERIFIED", "PAYMENT_REJECTED", "ORDER_RELEASED", "PAYOUT_PENDING", "PAYOUT_COMPLETED", "PAYOUT_FROZEN", "PAYOUT_RESUMED", "ORDER_REFUNDED"] } },
    { body: { contains: order.itemTitle } },
  ] } });
  await db.auditLog.deleteMany({ where: { entityId: { in: [id, ...(payout ? [payout.id] : [])] } } });
  await db.order.delete({ where: { id } });
  if (names.length) {
    await db.upload.deleteMany({ where: { storedName: { in: names } } });
    await Promise.all(names.map((name) => rm(resolve("apps/api/uploads", name), { force: true })));
  }
}
