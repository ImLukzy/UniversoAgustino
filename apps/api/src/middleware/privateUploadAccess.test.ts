import { beforeEach, expect, it, vi } from "vitest";
import { privateUploadAllowed } from "./privateUploadAccess.js";
const db = vi.hoisted(() => ({ payout: { count: vi.fn().mockResolvedValue(0) }, user: { findUnique: vi.fn() }, paymentAccount: { findFirst: vi.fn() }, order: { findFirst: vi.fn().mockResolvedValue(null), count: vi.fn() } }));
vi.mock("../lib/prisma.js", () => ({ prisma: db }));
beforeEach(() => { vi.clearAllMocks(); db.order.findFirst.mockResolvedValue(null); db.payout.count.mockResolvedValue(0); db.user.findUnique.mockResolvedValue({ role: "moderator" }); db.paymentAccount.findFirst.mockResolvedValue({ id: "account" }); db.order.count.mockResolvedValue(1); });
it("anónimo no obtiene imágenes privadas", async () => { expect(await privateUploadAllowed("qr.png")).toBe(false); });
it.each(["admin", "moderator"])("%s puede revisar imágenes", async (role) => { expect(await privateUploadAllowed("qr.png", { sub: "staff", role })).toBe(true); });
it("comprador con pedido activo obtiene imagen de cuenta activa", async () => {
  expect(await privateUploadAllowed("qr.png", { sub: "buyer", role: "student" })).toBe(true);
  expect(db.paymentAccount.findFirst.mock.calls[0][0].where.OR).toEqual([{ photoUrl: "/uploads/qr.png" }, { qrUrl: "/uploads/qr.png" }]);
  expect(db.order.count.mock.calls[0][0].where.buyerId).toBe("buyer");
});
it("tercero sin pedido no obtiene QR", async () => { db.order.count.mockResolvedValue(0); expect(await privateUploadAllowed("qr.png", { sub: "third", role: "student" })).toBe(false); });
it("cuenta desactivada no expone imagen al comprador", async () => { db.paymentAccount.findFirst.mockResolvedValue(null); expect(await privateUploadAllowed("qr.png", { sub: "buyer", role: "student" })).toBe(false); });
it("token de exmiembro no permite leer QR sin pedido", async () => {
  db.user.findUnique.mockResolvedValue({ role: "creator" }); db.order.count.mockResolvedValue(0);
  expect(await privateUploadAllowed("qr.png", { sub: "former-staff", role: "admin" })).toBe(false);
});

it("vendedor ve foto de liquidación completada propia", async () => {
  db.payout.count.mockResolvedValue(1); expect(await privateUploadAllowed("paid.png", { sub: "seller", role: "creator" })).toBe(true);
  expect(db.payout.count).toHaveBeenCalledWith({ where: { sellerId: "seller", status: "COMPLETED", proofUrl: "/uploads/paid.png" } });
});
it("comprador sin relación no ve comprobante del vendedor", async () => { db.paymentAccount.findFirst.mockResolvedValue(null); expect(await privateUploadAllowed("paid.png", { sub: "buyer", role: "student" })).toBe(false); });

it("comprador del físico verificado puede leer su comprobante subido por trabajador", async () => { db.order.findFirst.mockResolvedValue({ id: "order" }); expect(await privateUploadAllowed("physical.png", { sub: "buyer", role: "student" })).toBe(true); expect(db.order.findFirst.mock.calls[0][0].where).toEqual({ buyerId: "buyer", itemType: "bazar", payProofUrl: "/uploads/physical.png", verifiedAt: { not: null } }); });
it("comprobante físico no se concede al vendedor por participar", async () => { db.paymentAccount.findFirst.mockResolvedValue(null); expect(await privateUploadAllowed("physical.png", { sub: "seller", role: "creator" })).toBe(false); });
