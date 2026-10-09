import { beforeEach, expect, it, vi } from "vitest";
import { reviewDigitalPayment } from "./verifyPayment.js";
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), user: { findUnique: vi.fn() }, order: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
  document: { findUnique: vi.fn() }, upload: { findUnique: vi.fn() }, documentAccessGrant: { create: vi.fn(), count: vi.fn().mockResolvedValue(0) }, payout: { create: vi.fn() },
  auditLog: { create: vi.fn() }, notify: vi.fn(), hasObject: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => work(db) } }));
vi.mock("../../lib/storage.js", () => ({ hasObject: db.hasObject }));
vi.mock("../../lib/notify.js", () => ({ notify: db.notify, buyerOrderLink: () => "/checkout/order", orderLink: () => "/ventas" }));
const original = { id: "order", buyerId: "buyer", sellerId: "seller", itemId: "doc", itemTitle: "Apunte", itemType: "document", status: "PAID", verifiedAt: null as Date | null,
  paymentRejectedReason: null as string | null, payProofUrl: "/uploads/proof.png", paymentAccount: { userId: "worker" },
  amountCents: 1000, feeCents: 130, netCents: 870, sellerPayMethod: "PLIN", sellerPayDetail: "SELLER-ACCOUNT", sellerPayQrUrl: "/uploads/seller-qr.png" };
let order = { ...original };
beforeEach(() => {
  vi.clearAllMocks(); order = { ...original };
  db.user.findUnique.mockResolvedValue({ role: "moderator" }); db.order.findUniqueOrThrow.mockImplementation(async () => order);
  db.order.update.mockImplementation(async ({ data }) => { order = { ...order, ...data }; return order; });
  db.document.findUnique.mockResolvedValue({ id: "doc", authorId: "seller", fileUrl: "/uploads/document.pdf", reviewStatus: "APPROVED" });
  db.upload.findUnique.mockResolvedValue({ ownerId: "buyer", detectedMime: "image/png" }); db.hasObject.mockResolvedValue(true);
});
it("aceptar crea acceso y Payout87% con vencimiento48h en la transacción", async () => {
  await reviewDigitalPayment("order", "worker", true);
  expect(order.status).toBe("ESCROW"); expect(order.verifiedAt).toBeInstanceOf(Date);
  expect(db.documentAccessGrant.create).toHaveBeenCalledWith({ data: expect.objectContaining({ buyerId: "buyer", documentId: "doc", orderId: "order", fileUrl: "/uploads/document.pdf" }) });
  const payout = db.payout.create.mock.calls[0][0].data;
  expect(payout.netCents).toBe(870); expect(payout.feeCents).toBe(130); expect(payout.status).toBe("PENDING");
  expect(payout.collectorId).toBe("worker"); expect(payout.payDetail).toBe("SELLER-ACCOUNT");
  expect(payout.dueAt.getTime() - order.verifiedAt!.getTime()).toBe(48 * 3_600_000);
  expect(db.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "payment.accept", actorId: "worker" }) });
  expect(db.notify.mock.calls.map(([n]) => [n.userId, n.type])).toEqual([["buyer", "PAYMENT_VERIFIED"], ["seller", "PAYMENT_VERIFIED"], ["seller", "PAYOUT_PENDING"], ["worker", "PAYOUT_PENDING"]]);
});
it("denegar conserva PAID, guarda motivo, no crea acceso ni payout y avisa ambos", async () => {
  await reviewDigitalPayment("order", "worker", false, "Foto ilegible");
  expect(order.status).toBe("PAID"); expect(order.paymentRejectedReason).toBe("Foto ilegible");
  expect(db.payout.create).not.toHaveBeenCalled(); expect(db.documentAccessGrant.create).not.toHaveBeenCalled();
  expect(db.notify.mock.calls.map(([n]) => [n.userId, n.type])).toEqual([["buyer", "PAYMENT_REJECTED"], ["seller", "PAYMENT_REJECTED"]]);
});
it("otro trabajador no verifica cuenta ajena", async () => {
  await expect(reviewDigitalPayment("order", "other", true)).rejects.toMatchObject({ status: 403 }); expect(db.payout.create).not.toHaveBeenCalled();
});
it("técnico verifica cuenta de otro trabajador", async () => { db.user.findUnique.mockResolvedValue({ role: "admin" }); await reviewDigitalPayment("order", "admin", true); expect(db.payout.create).toHaveBeenCalledTimes(1); });
it("exmiembro con token antiguo no verifica", async () => {
  db.user.findUnique.mockResolvedValue({ role: "creator" }); await expect(reviewDigitalPayment("order", "worker", true)).rejects.toMatchObject({ status: 403 });
});
it("aceptar repetido no duplica acceso, liquidación ni avisos", async () => {
  await reviewDigitalPayment("order", "worker", true); await expect(reviewDigitalPayment("order", "worker", true)).rejects.toMatchObject({ code: "BAD_STATE" });
  expect(db.payout.create).toHaveBeenCalledTimes(1); expect(db.documentAccessGrant.create).toHaveBeenCalledTimes(1); expect(db.notify).toHaveBeenCalledTimes(4);
});
it("pago ya denegado no se acepta antes de reenvío", async () => {
  order.paymentRejectedReason = "Foto ilegible"; await expect(reviewDigitalPayment("order", "worker", true)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(db.payout.create).not.toHaveBeenCalled();
});
it("archivo faltante no atribuye", async () => {
  db.document.findUnique.mockResolvedValue(null); await expect(reviewDigitalPayment("order", "worker", true)).rejects.toMatchObject({ code: "DOCUMENT_UNAVAILABLE" });
  expect(db.order.update).not.toHaveBeenCalled(); expect(db.documentAccessGrant.create).not.toHaveBeenCalled();
});
it("error de Payout aborta antes de estado/auditoría/avisos", async () => {
  db.payout.create.mockRejectedValueOnce(new Error("database failure")); await expect(reviewDigitalPayment("order", "worker", true)).rejects.toThrow("database failure");
  expect(db.order.update).not.toHaveBeenCalled(); expect(db.auditLog.create).not.toHaveBeenCalled(); expect(db.notify).not.toHaveBeenCalled();
});

it("no crea dos accesos activos para comprador/documento bajo lock", async () => { db.documentAccessGrant.count.mockResolvedValueOnce(1); await expect(reviewDigitalPayment("order", "worker", true)).rejects.toMatchObject({ code: "ALREADY_OWNED" }); expect(db.documentAccessGrant.create).not.toHaveBeenCalled(); expect(db.payout.create).not.toHaveBeenCalled(); });
