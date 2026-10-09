import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { refundPayout } from "./refund.js";
const db = vi.hoisted(() => ({
  $queryRaw: vi.fn(), user: { findUnique: vi.fn() }, payout: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
  upload: { findUnique: vi.fn(), update: vi.fn() }, documentAccessGrant: { updateMany: vi.fn() },
  order: { update: vi.fn() }, report: { updateMany: vi.fn() }, auditLog: { create: vi.fn() },
  handoverCase: { findUnique: vi.fn(), update: vi.fn() }, appointment: { updateMany: vi.fn() },
  notify: vi.fn(), hasObject: vi.fn(),
}));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (f: (tx: typeof db) => Promise<unknown>) => f(db) } }));
vi.mock("../../lib/storage.js", () => ({ hasObject: db.hasObject }));
vi.mock("../../lib/notify.js", () => ({ notify: db.notify }));
const initial = { id: "p", orderId: "o", collectorId: "worker", sellerId: "seller", status: "FROZEN", refundRequired: true,
  amountCents: 1500, feeCents: 195, netCents: 1305, order: { status: "ESCROW", itemType: "document", buyerId: "buyer" } };
let p = { ...initial };
const input = { proofUrl: "/uploads/refund.png" };
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-09T05:00:00Z")); p = { ...initial, order: { ...initial.order } };
  db.user.findUnique.mockResolvedValue({ role: "admin" }); db.payout.findUniqueOrThrow.mockImplementation(async () => p);
  db.payout.update.mockImplementation(async ({ data }) => (p = { ...p, ...data }));
  db.upload.findUnique.mockResolvedValue({ ownerId: "admin", detectedMime: "image/png" }); db.hasObject.mockResolvedValue(true);
  db.handoverCase.findUnique.mockResolvedValue({ id: "case", status: "RETURNED" });
});
afterEach(() => vi.useRealTimers());
it("devuelve precio completo congelado, nunca neto, y revoca solo grant del pedido", async () => {
  const r = await refundPayout("p", "admin", input);
  expect(r).toMatchObject({ status: "REFUNDED", amountCents: 1500, feeCents: 195, netCents: 1305 });
  expect(db.documentAccessGrant.updateMany).toHaveBeenCalledWith({ where: { orderId: "o", revokedAt: null }, data: { revokedAt: new Date("2026-10-09T05:00:00Z") } });
  expect(db.order.update).toHaveBeenCalledWith({ where: { id: "o" }, data: { status: "REFUNDED", expiresAt: null } });
  expect(db.auditLog.create.mock.calls[0][0].data.meta).toContain('"amountCents":1500');
});
it("protege foto y guarda autor/fecha separados del comprobante de liquidación", async () => {
  await refundPayout("p", "admin", input);
  expect(db.upload.update).toHaveBeenCalledWith({ where: { storedName: "refund.png" }, data: { private: true } });
  expect(db.payout.update.mock.calls[0][0].data).toMatchObject({ refundedById: "admin", refundedAt: new Date("2026-10-09T05:00:00Z"), refundProofUrl: input.proofUrl, refundPaymentRef: null });
  expect(db.payout.update.mock.calls[0][0].data).not.toHaveProperty("proofUrl");
});
it("operación opcional se normaliza", async () => { await refundPayout("p", "admin", { ...input, paymentRef: " OP123 " }); expect(p).toHaveProperty("refundPaymentRef", "OP123"); });
it("avisos tres destinatarios posteriores al commit con importe íntegro comprador", async () => {
  await refundPayout("p", "admin", input);
  expect(db.notify.mock.calls.map(([v]) => v.userId).sort()).toEqual(["buyer", "seller", "worker"]);
  expect(db.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "buyer", type: "ORDER_REFUNDED", link: "/pedidos", body: expect.stringContaining("15.00") }));
  expect(db.auditLog.create.mock.invocationCallOrder[0]).toBeLessThan(db.notify.mock.invocationCallOrder[0]);
});
it("cierra reportes abiertos del pedido", async () => { await refundPayout("p", "admin", input); expect(db.report.updateMany).toHaveBeenCalledWith({ where: { targetType: "order", targetId: "o", status: "OPEN" }, data: { status: "ACTIONED" } }); });
it.each(["moderator", "student", "creator"])("rol real %s no reembolsa aunque token fuera admin", async (role) => {
  db.user.findUnique.mockResolvedValue({ role }); await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ status: 403 }); expect(db.payout.update).not.toHaveBeenCalled();
});
it("refundRequired false no puede devolver", async () => { p.refundRequired = false; await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_STATE" }); });
it.each(["PENDING", "COMPLETED", "REFUNDED"])("payout %s no reembolsa", async (status) => { p.status = status; await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_STATE" }); });
it("pedido liquidado no salta transición", async () => { p.order.status = "RELEASED"; await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_STATE" }); });
it("repetido no avisa ni devuelve dos veces", async () => { await refundPayout("p", "admin", input); await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(db.order.update).toHaveBeenCalledTimes(1); expect(db.notify).toHaveBeenCalledTimes(3); });
it("foto obligatoria", async () => { await expect(refundPayout("p", "admin", {})).rejects.toThrow(); expect(db.$queryRaw).not.toHaveBeenCalled(); });
it("foto ajena", async () => { db.upload.findUnique.mockResolvedValue({ ownerId: "other", detectedMime: "image/png" }); await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_PHOTO" }); });
it.each(["application/pdf", "text/plain"])("mime %s no es comprobante", async (detectedMime) => { db.upload.findUnique.mockResolvedValue({ ownerId: "admin", detectedMime }); await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_PHOTO" }); });
it("foto sin objeto almacenado", async () => { db.hasObject.mockResolvedValue(false); await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "BAD_PHOTO" }); expect(db.order.update).not.toHaveBeenCalled(); });
it("fallo transaccional no emite avisos de éxito", async () => { db.order.update.mockRejectedValueOnce(new Error("db")); await expect(refundPayout("p", "admin", input)).rejects.toThrow("db"); expect(db.notify).not.toHaveBeenCalled(); expect(db.auditLog.create).not.toHaveBeenCalled(); });
it("no acepta alteración de montos", async () => { await expect(refundPayout("p", "admin", { ...input, amountCents: 1 })).rejects.toThrow(); expect(db.payout.update).not.toHaveBeenCalled(); });
it("físico recibido va a BACK_TO_SELLER sin revocar grant ni liberar stock", async () => {
  p.order.itemType = "bazar"; await refundPayout("p", "admin", input);
  expect(db.handoverCase.update).toHaveBeenCalledWith({ where: { id: "case" }, data: { status: "BACK_TO_SELLER", backToSellerRequestedAt: new Date("2026-10-09T05:00:00Z") } });
  expect(db.documentAccessGrant.updateMany).not.toHaveBeenCalled();
});
it.each(["CLOSED", "DELIVERED", "RENTED_OUT", "RETURN_SCHEDULED"])("físico %s espera recepción en sede", async (status) => {
  p.order.itemType = "bazar"; db.handoverCase.findUnique.mockResolvedValue({ id: "case", status });
  await expect(refundPayout("p", "admin", input)).rejects.toMatchObject({ code: "RETURN_REQUIRED" });
  expect(db.payout.update).not.toHaveBeenCalled(); expect(db.notify).not.toHaveBeenCalled();
});
