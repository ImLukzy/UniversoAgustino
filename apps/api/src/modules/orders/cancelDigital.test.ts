import { beforeEach, expect, it, vi } from "vitest";
import { cancelDigitalOrder } from "./cancelDigital.js";
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), order: { findUniqueOrThrow: vi.fn(), update: vi.fn() }, auditLog: { create: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => work(db) } }));
beforeEach(() => { vi.clearAllMocks(); db.order.findUniqueOrThrow.mockResolvedValue({ id: "order", buyerId: "buyer", sellerId: "seller", status: "PENDING" }); });
it("comprador cancela antes de declarar el pago", async () => {
  await cancelDigitalOrder("order", "buyer"); expect(db.order.update).toHaveBeenCalledWith({ where: { id: "order" }, data: expect.objectContaining({ status: "CANCELLED", cancelledReason: "BUYER_CANCELLED" }), include: { escrow: true } });
});
it.each(["PAID", "ESCROW", "RELEASED"])("estado %s requiere revisión del equipo", async (status) => {
  db.order.findUniqueOrThrow.mockResolvedValue({ buyerId: "buyer", sellerId: "seller", status });
  await expect(cancelDigitalOrder("order", "buyer")).rejects.toMatchObject({ code: "PAYMENT_REVIEW" }); expect(db.order.update).not.toHaveBeenCalled();
});
it("tercero no cancela", async () => { await expect(cancelDigitalOrder("order", "third")).rejects.toMatchObject({ status: 403 }); expect(db.order.update).not.toHaveBeenCalled(); });
