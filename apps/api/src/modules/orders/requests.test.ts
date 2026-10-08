import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router, type NextFunction, type Request, type Response } from "express";
import { registerCreate } from "./create.js";
import { registerSellerSteps } from "./sellerSteps.js";
import { registerBuyerSteps } from "./buyerSteps.js";
import { registerCloseSteps } from "./closeSteps.js";
import { registerReject } from "./rejectStep.js";
import { errorHandler } from "../../middleware/errors.js";
const h = vi.hoisted(() => {
  const model = () => ({ findUniqueOrThrow: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), create: vi.fn(), count: vi.fn() });
  return { $queryRaw: vi.fn(), sanction: { findFirst: vi.fn() }, handoverCase: model(), appointment: model(), order: model(), bazarItem: model(), auditLog: model(), upload: model(), item: vi.fn(), notify: vi.fn(), guard: vi.fn() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: async (fn: (tx: typeof h) => Promise<unknown>) => fn(h) } }));
vi.mock("../../env.js", () => ({ env: { FEE_PCT: 0 } }));
vi.mock("./itemOwner.js", () => ({ itemOwner: h.item, audit: vi.fn(), EXPIRED_REASONS: ["TTL_EXPIRED"] }));
vi.mock("./documentGuard.js", () => ({ documentGuard: h.guard }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notify, orderLink: () => "/ventas", buyerOrderLink: () => "/pedidos" }));
vi.mock("../../lib/mercadopago.js", () => ({ mpEnabled: () => false }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (sub: string) => ({ sub, role: "student" }) }));
const router = Router(); registerCreate(router); registerSellerSteps(router); registerBuyerSteps(router); registerReject(router); registerCloseSteps(router);
const pending = { id: "order", buyerId: "buyer", sellerId: "seller", itemType: "bazar", itemId: "item", status: "PENDING", itemTitle: "Libro",
  expiresAt: new Date(Date.now() + 48 * 3_600_000), rentalStart: null, cancelledReason: null };
function request(path: string, sub: string, body: unknown = {}) {
  return new Promise<{ status: number; body: unknown }>((resolve) => {
    const req = { method: "POST", url: path, body, headers: { authorization: `Bearer ${sub}` } } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; },
      json(this: Response, value: unknown) { resolve({ status: this.statusCode, body: value }); return this; } } as Response;
    const next: NextFunction = (err) => err ? errorHandler(err, req, res, next) : resolve({ status: 404, body: null });
    (router as unknown as { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res, next);
  });
}
beforeEach(() => {
  vi.clearAllMocks(); h.item.mockResolvedValue({ ownerId: "seller", reviewStatus: "APPROVED", status: "AVAILABLE", tx: "VENTA", priceCents: 1000, title: "Libro" });
  h.order.findUniqueOrThrow.mockResolvedValue(pending); h.order.findFirst.mockResolvedValue(null);
  h.order.updateMany.mockResolvedValue({ count: 1 }); h.order.update.mockResolvedValue(pending);
  h.order.create.mockImplementation(async ({ data }) => ({ ...data, id: "order" })); h.guard.mockResolvedValue(null);
});
describe("solicitudes bazar", () => {
  it("vendedor no puede saltar el motivo por cancel", async () => {
    expect((await request("/order/cancel", "seller")).status).toBe(409); expect(h.order.update).not.toHaveBeenCalled();
  });
  it("comprador puede cancelar su solicitud", async () => {
    expect((await request("/order/cancel", "buyer")).status).toBe(200);
  });
  it.each(["VENTA", "ALQUILER"])("%s nace PENDING con plazo 48 h", async (tx) => {
    h.item.mockResolvedValue({ ownerId: "seller", reviewStatus: "APPROVED", status: "AVAILABLE", tx, priceCents: 1000, title: "Libro" });
    const start = Date.now();
    expect((await request("/", "buyer", { itemType: "bazar", itemId: "item", rentalStart: "2026-11-01T00:00:00Z", rentalEnd: "2026-11-02T00:00:00Z" })).status).toBe(201);
    const data = h.order.create.mock.calls[0][0].data;
    expect(data.status).toBe("PENDING"); expect(data.expiresAt.getTime() - start).toBeGreaterThanOrEqual(48 * 3_600_000);
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "ORDER_CREATED", title: "Nueva solicitud" }));
  });
  it("suspendido no solicita (403 ACCOUNT_SUSPENDED) y no reserva", async () => {
    h.sanction.findFirst.mockResolvedValue({ kind: "BAN", reason: "Fraude", endsAt: null });
    const r = await request("/", "buyer", { itemType: "bazar", itemId: "item", rentalStart: "2026-11-01T00:00:00Z", rentalEnd: "2026-11-02T00:00:00Z" });
    expect(r.status).toBe(403); expect(JSON.stringify(r.body)).toContain("ACCOUNT_SUSPENDED"); expect(h.order.create).not.toHaveBeenCalled();
    h.sanction.findFirst.mockResolvedValue(null);
  });
  it("documento conserva plazo 30 min y pago directo", async () => {
    const start = Date.now(); await request("/", "buyer", { itemType: "document", itemId: "item" });
    expect(h.order.create.mock.calls[0][0].data.expiresAt.getTime() - start).toBeLessThan(30 * 60_000 + 1000);
    h.order.findUniqueOrThrow.mockResolvedValue({ ...pending, itemType: "document" });
    expect((await request("/order/pay", "buyer", { payProof: "123456" })).status).toBe(200);
  });
  it("venta PENDING no es pagable", async () => {
    expect((await request("/order/pay", "buyer", { payProof: "123456" })).status).toBe(409); expect(h.order.update).not.toHaveBeenCalled();
  });
  it("venta aceptada crea caso y bloquea pago web", async () => {
    expect((await request("/order/accept", "seller")).status).toBe(200);
    expect(h.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "ACCEPTED" }) }));
    h.order.findUniqueOrThrow.mockResolvedValue({ ...pending, status: "ACCEPTED", expiresAt: null });
    expect((await request("/order/pay", "buyer", { payProof: "123456" })).status).toBe(409);
    expect(h.handoverCase.create).toHaveBeenCalledWith({ data: { orderId: "order" } });
  });
  it.each([["pay", "ACCEPTED", "buyer"], ["confirm-payment", "PAID", "seller"], ["confirm-receipt", "ESCROW", "buyer"]])("bazar %s se bloquea incluso con estado %s", async (action, status, sub) => {
    h.order.findUniqueOrThrow.mockResolvedValue({ ...pending, status, expiresAt: null });
    const result = await request(`/order/${action}`, sub);
    expect(result.status).toBe(409); expect(result.body).toMatchObject({ error: { code: "PHYSICAL_PAYMENT" } }); expect(h.order.update).not.toHaveBeenCalled();
  });
  it.each(["buyer", "third"])("%s no puede rechazar", async (sub) => { expect((await request("/order/reject", sub, { reason: "No disponible" })).status).toBe(403); });
  it.each([{}, { reason: " " }, { reason: "no" }, { reason: "a".repeat(301) }])("rechazo exige motivo válido %j", async (body) => {
    expect((await request("/order/reject", "seller", body)).status).toBe(400);
  });
  it("rechazo guarda motivo, libera y avisa al comprador", async () => {
    expect((await request("/order/reject", "seller", { reason: "  No puedo entregar  " })).status).toBe(200);
    expect(h.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED", cancelledReason: "SELLER_REJECTED: No puedo entregar" }) }));
    expect(h.bazarItem.updateMany).toHaveBeenCalledWith({ where: { id: "item", status: "RESERVED" }, data: { status: "AVAILABLE" } });
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "buyer", type: "ORDER_CANCELLED", body: "Libro — No puedo entregar" }));
    expect(h.auditLog.create).toHaveBeenCalled();
  });
  it.each(["ACCEPTED", "CANCELLED", "PAID"])("%s no permite rechazo ni aceptar de nuevo", async (status) => {
    h.order.findUniqueOrThrow.mockResolvedValue({ ...pending, status });
    expect((await request("/order/reject", "seller", { reason: "No disponible" })).status).toBe(409);
    expect((await request("/order/accept", "seller")).status).toBe(409);
  });
  it("aceptar solicitud vencida libera el artículo sin aceptarla", async () => {
    h.order.findUniqueOrThrow.mockResolvedValue({ ...pending, expiresAt: new Date(0) }); h.order.count.mockResolvedValue(0);
    expect((await request("/order/accept", "seller")).status).toBe(409);
    expect(h.bazarItem.updateMany).toHaveBeenCalledWith({ where: { id: "item", status: "RESERVED" }, data: { status: "AVAILABLE" } });
  });
  it.each(["accept", "reject"])("%s concurrente perdido no envía aviso", async (action) => {
    h.order.updateMany.mockResolvedValue({ count: 0 });
    expect((await request(`/order/${action}`, "seller", { reason: "No disponible" })).status).toBe(409);
    expect(h.notify).not.toHaveBeenCalled();
  });
});
