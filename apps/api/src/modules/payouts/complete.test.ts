import { beforeEach, expect, it, vi } from "vitest";
import { REFUND_REQUIRED, markRefundRequired } from "./refundRequired.js";
import { completePayout, resumePayout } from "./complete.js";
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), user: { findUnique: vi.fn() }, payout: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
  report: { updateMany: vi.fn() }, upload: { findUnique: vi.fn(), update: vi.fn() }, order: { update: vi.fn() }, auditLog: { create: vi.fn() }, notice: vi.fn(), notify: vi.fn(), hasObject: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (fn: (tx: typeof db) => Promise<unknown>) => fn(db) } }));
vi.mock("../../lib/storage.js", () => ({ hasObject: db.hasObject }));
vi.mock("./notices.js", () => ({ payoutNotice: db.notice }));
vi.mock("../../lib/notify.js", () => ({ notify: db.notify, buyerOrderLink: () => "/checkout/order" }));
const initial = { id: "payout", orderId: "order", collectorId: "worker", sellerId: "seller", status: "PENDING", refundRequired: false, frozenReason: null as string | null, netCents: 1305, feeCents: 195,
  order: { status: "ESCROW", buyerId: "buyer" } };
let p = { ...initial };
const body = { proofUrl: "/uploads/proof.png" };
beforeEach(() => {
  vi.clearAllMocks(); p = { ...initial }; db.user.findUnique.mockResolvedValue({ role: "moderator" });
  db.payout.findUniqueOrThrow.mockImplementation(async () => p); db.payout.update.mockImplementation(async ({ data }) => { p = { ...p, ...data }; return p; });
  db.upload.findUnique.mockResolvedValue({ ownerId: "worker", detectedMime: "image/png" }); db.hasObject.mockResolvedValue(true);
});
it("completa neto congelado, protege foto y libera pedido una sola vez", async () => {
  const completed = await completePayout("payout", "worker", body);
  expect(completed.status).toBe("COMPLETED"); expect(completed.netCents).toBe(1305); expect(completed.feeCents).toBe(195);
  expect(db.upload.update).toHaveBeenCalledWith({ where: { storedName: "proof.png" }, data: { private: true } });
  expect(db.order.update.mock.calls[0][0].data.status).toBe("RELEASED"); expect(db.order.update.mock.calls[0][0].data.escrow.update.releasedAt).toBeInstanceOf(Date);
  expect(db.notice).toHaveBeenCalledWith(completed, "PAYOUT_COMPLETED"); expect(db.notify.mock.calls[0][0]).toMatchObject({ userId: "buyer", type: "ORDER_RELEASED" });
  await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(db.order.update).toHaveBeenCalledTimes(1);
});
it("otro trabajador no liquida", async () => { await expect(completePayout("payout", "other", body)).rejects.toMatchObject({ status: 403 }); expect(db.payout.update).not.toHaveBeenCalled(); });
it("Técnico liquida cuenta ajena con su propia foto", async () => { db.user.findUnique.mockResolvedValue({ role: "admin" }); db.upload.findUnique.mockResolvedValue({ ownerId: "admin", detectedMime: "image/png" }); expect((await completePayout("payout", "admin", body)).status).toBe("COMPLETED"); });
it("exmiembro no liquida", async () => { db.user.findUnique.mockResolvedValue({ role: "creator" }); await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ status: 403 }); });
it("foto obligatoria", async () => { await expect(completePayout("payout", "worker", {})).rejects.toThrow(); expect(db.payout.update).not.toHaveBeenCalled(); });
it("foto ajena prohibida", async () => { db.upload.findUnique.mockResolvedValue({ ownerId: "other", detectedMime: "image/png" }); await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ code: "BAD_PHOTO" }); });
it.each(["application/pdf", "text/plain"])("rechaza foto %s", async (detectedMime) => { db.upload.findUnique.mockResolvedValue({ ownerId: "worker", detectedMime }); await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ code: "BAD_PHOTO" }); });
it("foto ausente en storage no completa", async () => { db.hasObject.mockResolvedValue(false); await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ code: "BAD_PHOTO" }); expect(db.order.update).not.toHaveBeenCalled(); });
it("congelada no completa ni avisa", async () => { p.status = "FROZEN"; await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(db.notice).not.toHaveBeenCalled(); });
it("no libera estado diferente a ESCROW", async () => { p.order = { status: "PAID", buyerId: "buyer" }; await expect(completePayout("payout", "worker", body)).rejects.toMatchObject({ code: "BAD_STATE" }); });
it("fallo de pedido no emite avisos fuera de transacción", async () => { db.order.update.mockRejectedValueOnce(new Error("db")); await expect(completePayout("payout", "worker", body)).rejects.toThrow("db"); expect(db.notice).not.toHaveBeenCalled(); expect(db.auditLog.create).not.toHaveBeenCalled(); });
it("trabajador no reanuda reclamo", async () => { p.status = "FROZEN"; await expect(resumePayout("payout", "worker", { reason: "Revisado el caso" })).rejects.toMatchObject({ status: 403 }); });
it("Técnico reanuda con motivo, auditoría y aviso", async () => { p.status = "FROZEN"; db.user.findUnique.mockResolvedValue({ role: "admin" }); expect((await resumePayout("payout", "admin", { reason: "Revisado el caso" })).status).toBe("PENDING"); expect(db.auditLog.create.mock.calls[0][0].data).toMatchObject({ action: "payout.resume", meta: '{"reason":"Revisado el caso"}' }); expect(db.notice).toHaveBeenCalledWith(p, "PAYOUT_RESUMED"); });
it("reanudar exige motivo antes de transacción", async () => { await expect(resumePayout("payout", "admin", { reason: " " })).rejects.toThrow(); expect(db.payout.update).not.toHaveBeenCalled(); });
it("reanudar repetido no muta", async () => { db.user.findUnique.mockResolvedValue({ role: "admin" }); await expect(resumePayout("payout", "admin", { reason: "Revisado el caso" })).rejects.toMatchObject({ code: "BAD_STATE" }); });

it("Técnico marca reembolso manteniendo FROZEN sin liberar ni revocar grant", async () => {
  p.status = "FROZEN"; db.user.findUnique.mockResolvedValue({ role: "admin" });
  const r = await markRefundRequired("payout", "admin", { reason: "Apunte no corresponde" });
  expect(r.status).toBe("FROZEN"); expect(r.frozenReason).toContain(REFUND_REQUIRED); expect(db.order.update).not.toHaveBeenCalled(); expect(db.auditLog.create.mock.calls[0][0].data.action).toBe("payout.refund_required");
});
it("trabajador no decide reembolso", async () => { p.status = "FROZEN"; await expect(markRefundRequired("payout", "worker", { reason: "Devolver al comprador" })).rejects.toMatchObject({ status: 403 }); });
it("no marca reembolso de pago completado", async () => { p.status = "COMPLETED"; db.user.findUnique.mockResolvedValue({ role: "admin" }); await expect(markRefundRequired("payout", "admin", { reason: "Devolver al comprador" })).rejects.toMatchObject({ code: "BAD_STATE" }); });
it("decisión reembolso no se repite ni reanuda", async () => { p.status = "FROZEN"; p.refundRequired = true; p.frozenReason = REFUND_REQUIRED; db.user.findUnique.mockResolvedValue({ role: "admin" }); await expect(markRefundRequired("payout", "admin", { reason: "Devolver al comprador" })).rejects.toMatchObject({ code: "BAD_STATE" }); await expect(resumePayout("payout", "admin", { reason: "Revisado el caso" })).rejects.toMatchObject({ code: "REFUND_REQUIRED" }); expect(db.payout.update).not.toHaveBeenCalled(); });

it("texto del reclamante no suplanta decisión de reembolso del Técnico", async () => { p.status = "FROZEN"; p.frozenReason = REFUND_REQUIRED; db.user.findUnique.mockResolvedValue({ role: "admin" }); expect((await resumePayout("payout", "admin", { reason: "Revisado por Técnico" })).status).toBe("PENDING"); });
