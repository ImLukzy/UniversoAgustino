import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { paymentsRouter } from "./routes.js";
import { errorHandler } from "../../middleware/errors.js";
const h = vi.hoisted(() => ({ find: vi.fn(), preference: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { order: { findUniqueOrThrow: h.find } } }));
vi.mock("../../env.js", () => ({ env: { WEB_ORIGIN: ["https://example.test"] } }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: () => ({ sub: "buyer", role: "student" }) }));
vi.mock("../../lib/mercadopago.js", () => ({ mpEnabled: () => true, createPreference: h.preference }));
vi.mock("../orders/itemOwner.js", () => ({ audit: vi.fn() }));
vi.mock("../../lib/notify.js", () => ({ notify: vi.fn() }));
function request() {
  return new Promise<number>((resolve) => {
    const req = { method: "POST", url: "/checkout/order", headers: { authorization: "Bearer buyer" } } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; }, json(this: Response) { resolve(this.statusCode); return this; } } as Response;
    const next: NextFunction = (err) => err ? errorHandler(err, req, res, next) : resolve(404);
    (paymentsRouter as unknown as { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res, next);
  });
}
beforeEach(() => { vi.clearAllMocks(); h.preference.mockResolvedValue("https://example.test/pay"); });
describe("pasarela solo paga documentos", () => {
  it.each([["bazar", "PENDING", 409], ["bazar", "ACCEPTED", 409], ["document", "PENDING", 200]])("%s %s → %s", async (itemType, status, expected) => {
    h.find.mockResolvedValue({ id: "order", buyerId: "buyer", itemType, status, expiresAt: new Date(Date.now() + 60_000), rentalStart: null });
    expect(await request()).toBe(expected);
    expect(h.preference).toHaveBeenCalledTimes(expected === 200 ? 1 : 0);
  });
});
