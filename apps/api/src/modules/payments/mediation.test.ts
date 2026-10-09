import { expect, it, vi } from "vitest";
import { paymentsRouter } from "./routes.js";
import { accountRequest } from "../staff/accountFixture.js";
const h = vi.hoisted(() => ({ preference: vi.fn(), fetchPayment: vi.fn(), update: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { order: { update: h.update } } }));
vi.mock("../../env.js", () => ({ env: {} }));
vi.mock("../../lib/mercadopago.js", () => ({ mpEnabled: () => true, createPreference: h.preference, fetchPayment: h.fetchPayment }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: () => ({ sub: "buyer", role: "student" }) }));
it("config manual aunque MercadoPago tenga credenciales", async () => {
  expect((await accountRequest(paymentsRouter, "GET", "/config")).body.data).toEqual({ provider: "manual" });
});
it("checkout no crea preferencia ni desbloquea", async () => {
  expect((await accountRequest(paymentsRouter, "POST", "/checkout/order", "buyer")).body.error?.code).toBe("TEAM_PAYMENT_REQUIRED"); expect(h.preference).not.toHaveBeenCalled();
});
it("webhook ignora incluso pago aprobado durante intermediación", async () => {
  expect((await accountRequest(paymentsRouter, "POST", "/webhook", undefined, { type: "payment", data: { id: "paid" } })).body.data).toEqual({ ignored: true, reason: "TEAM_MEDIATION" });
  expect(h.fetchPayment).not.toHaveBeenCalled(); expect(h.update).not.toHaveBeenCalled();
});
