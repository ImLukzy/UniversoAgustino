import { Router } from "express";
import { beforeEach, expect, it, vi } from "vitest";
import { registerDigitalPay } from "./digitalPay.js";
import { accountRequest } from "../staff/accountFixture.js";
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), order: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
  paymentAccount: { findFirst: vi.fn() }, upload: { findUnique: vi.fn(), update: vi.fn() }, auditLog: { create: vi.fn() }, notify: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => work(db) } }));
vi.mock("../../lib/storage.js", () => ({ hasObject: vi.fn().mockResolvedValue(true) }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (sub: string) => ({ sub, role: "student" }) }));
vi.mock("../../lib/notify.js", () => ({ notify: db.notify, buyerOrderLink: () => "/checkout/order", orderLink: () => "/ventas" }));
const router = Router(); registerDigitalPay(router);
const original = { id: "order", buyerId: "buyer", sellerId: "seller", itemType: "document", itemTitle: "Apunte", status: "PENDING", expiresAt: new Date(Date.now() + 60_000) as Date | null,
  verifiedAt: null, paymentAccountId: null as string | null, paymentRejectedReason: null as string | null, amountCents: 1000, feeCents: 130, netCents: 870,
  sellerPayDetail: "SELLER-PRIVATE", proofSubmittedAt: null as Date | null };
let order = { ...original };
const body = { paymentAccountId: "account", payProofUrl: "/uploads/proof.png" };
const request = (input: unknown = body, sub = "buyer") => accountRequest(router, "POST", "/order/pay", sub, input);
beforeEach(() => {
  vi.clearAllMocks(); order = { ...original };
  db.order.findUniqueOrThrow.mockImplementation(async () => order);
  db.order.update.mockImplementation(async ({ data }) => { order = { ...order, ...data }; return order; });
  db.paymentAccount.findFirst.mockResolvedValue({ id: "account", userId: "staff", method: "PLIN", number: "TEAM-PRIVATE", qrUrl: "/uploads/qr.png", photoUrl: "/uploads/profile.png", holder: "Titular" });
  db.upload.findUnique.mockResolvedValue({ ownerId: "buyer", detectedMime: "image/png" });
});
it("foto obligatoria aunque haya operación", async () => {
  expect((await request({ paymentAccountId: "account", payProof: "123456" })).status).toBe(400);
  expect(db.order.update).not.toHaveBeenCalled(); expect(db.notify).not.toHaveBeenCalled();
});
it("cuenta obligatoria", async () => { expect((await request({ payProofUrl: "/uploads/proof.png" })).status).toBe(400); });
it("tercero no declara pago", async () => { expect((await request(body, "third")).status).toBe(403); expect(db.upload.update).not.toHaveBeenCalled(); });
it("cuenta desactivada no acepta comprobante", async () => {
  db.paymentAccount.findFirst.mockResolvedValue(null); expect((await request()).body.error?.code).toBe("ACCOUNT_INACTIVE"); expect(db.order.update).not.toHaveBeenCalled();
});
it.each([null, { ownerId: "third", detectedMime: "image/png" }, { ownerId: "buyer", detectedMime: "application/pdf" }])("foto debe existir, ser propia y ser imagen %j", async (photo) => {
  db.upload.findUnique.mockResolvedValue(photo); expect((await request()).status).toBe(400); expect(db.order.update).not.toHaveBeenCalled();
});
it("pago PENDING recorre ACCEPTED y PAID, congela destino y protege foto", async () => {
  const r = await request(); expect(r.status).toBe(200);
  expect(db.order.update.mock.calls.map(([args]) => args.data.status)).toEqual(["ACCEPTED", "PAID"]);
  expect(order.expiresAt).toBeNull(); expect(order.paymentAccountId).toBe("account"); expect(order.proofSubmittedAt).toBeInstanceOf(Date);
  expect(db.upload.update).toHaveBeenCalledWith({ where: { storedName: "proof.png" }, data: { private: true } });
  expect(r.body.data).not.toHaveProperty("sellerPayDetail"); expect(order.feeCents).toBe(130); expect(order.netCents).toBe(870);
  expect(db.notify.mock.calls.map(([n]) => [n.userId, n.type])).toEqual([["buyer", "ORDER_PAID"], ["seller", "ORDER_PAID"], ["staff", "ORDER_PAID"]]);
});
it("repetición no muta ni duplica avisos", async () => {
  await request(); const count = db.notify.mock.calls.length;
  expect((await request()).status).toBe(409); expect(db.notify).toHaveBeenCalledTimes(count);
});
it("denegado se reenvía sin retroceder la máquina", async () => {
  order = { ...original, status: "PAID", expiresAt: null, paymentAccountId: "account", paymentRejectedReason: "Foto ilegible" };
  expect((await request()).status).toBe(200); expect(db.order.update).toHaveBeenCalledTimes(1);
  expect(order.status).toBe("PAID"); expect(order.paymentRejectedReason).toBeNull();
});
it("reserva vencida no registra cobro", async () => {
  order.expiresAt = new Date(0); expect((await request()).body.error?.code).toBe("RESERVATION_EXPIRED"); expect(db.order.update).not.toHaveBeenCalled();
});
it.each(["ESCROW", "RELEASED", "CANCELLED"])("estado %s no recibe otro comprobante", async (status) => {
  order.status = status; expect((await request()).status).toBe(409); expect(db.order.update).not.toHaveBeenCalled();
});
it("físico sigue pagando en sede", async () => { order.itemType = "bazar"; expect((await request()).body.error?.code).toBe("PHYSICAL_PAYMENT"); });
