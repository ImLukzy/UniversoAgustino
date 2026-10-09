import { Router } from "express";
import { beforeEach, expect, it, vi } from "vitest";
import { accountRequest } from "../staff/accountFixture.js";
import { registerPaymentAccounts } from "./paymentAccounts.js";
const db = vi.hoisted(() => ({ order: { findFirst: vi.fn() }, paymentAccount: { findMany: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (sub: string) => ({ sub, role: "student" }) }));
const router = Router(); registerPaymentAccounts(router);
beforeEach(() => { vi.clearAllMocks(); db.order.findFirst.mockResolvedValue({ id: "order" }); db.paymentAccount.findMany.mockResolvedValue([]); });
it("sesión obligatoria", async () => { expect((await accountRequest(router, "GET", "/order/payment-accounts")).status).toBe(401); });
it("solo comprador con pedido activo obtiene cuentas activas de miembros actuales", async () => {
  expect((await accountRequest(router, "GET", "/order/payment-accounts", "buyer")).status).toBe(200);
  const where = db.order.findFirst.mock.calls[0][0].where;
  expect(where.buyerId).toBe("buyer"); expect(where.status.in).toEqual(["PENDING", "ACCEPTED", "PAID"]);
  expect(where.OR[1].expiresAt.gt).toBeInstanceOf(Date);
  expect(db.paymentAccount.findMany.mock.calls[0][0].where).toEqual({ active: true, user: { role: { in: ["moderator", "admin"] } } });
});
it.each(["third", "seller", "expired-buyer"])("%s sin pedido activo no recibe datos", async (sub) => {
  db.order.findFirst.mockResolvedValue(null);
  expect((await accountRequest(router, "GET", "/order/payment-accounts", sub)).status).toBe(404);
  expect(db.paymentAccount.findMany).not.toHaveBeenCalled();
});
