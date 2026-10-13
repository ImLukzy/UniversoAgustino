import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router, type NextFunction, type Request, type Response } from "express";
import { reportsRouter } from "./routes.js";
import { errorHandler } from "../../middleware/errors.js";

const h = vi.hoisted(() => {
  const model = () => ({ count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() });
  return { report: model(), document: model(), bazarItem: model(), order: model(), user: model(), payout: model(), auditLog: { create: vi.fn() }, queryRaw: vi.fn(), notice: vi.fn() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: async (fn: (tx: typeof h & { $queryRaw: typeof h.queryRaw }) => Promise<unknown>) => fn({ ...h, $queryRaw: h.queryRaw }) } }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notice, buyerOrderLink: () => "/checkout/o1" }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => { const [role, sub = "actor"] = token.split(":"); return { role, sub }; } }));
const sample = { id: "r1", targetType: "document", targetId: "d1", category: "NO_SHOW", reason: "No se presentó al punto acordado", status: "OPEN", createdAt: new Date(), reporterId: "buyer", reporter: { id: "buyer", profile: { fullName: "Comprador" } } };
function call(method: string, path: string, role?: string, body: unknown = {}, query: Record<string, string> = {}) {
  type Body = { data?: unknown; error?: { code: string; message?: string }; page?: number; pageSize?: number; total?: number };
  return new Promise<{ status: number; body: Body }>((resolve) => {
    const req = { method, url: path, query, headers: role ? { authorization: `Bearer ${role}` } : {}, body } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; }, setHeader() {},
      json(this: Response, value: Body) { resolve({ status: this.statusCode, body: value }); return this; } } as unknown as Response;
    (reportsRouter as Router & { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res, (e?: unknown) => e ? errorHandler(e, req, res, () => {}) : res.status(404).json({}));
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  h.report.count.mockResolvedValue(0); h.report.findMany.mockResolvedValue([]); h.report.findUnique.mockResolvedValue(sample); h.report.create.mockResolvedValue(sample); h.report.updateMany.mockResolvedValue({ count: 1 });
  for (const model of [h.document, h.bazarItem, h.order, h.user, h.payout]) { model.findMany.mockResolvedValue([]); model.findUnique.mockResolvedValue(null); model.create.mockResolvedValue({}); model.update.mockResolvedValue({}); model.count.mockResolvedValue(0); }
  h.auditLog.create.mockResolvedValue({}); h.notice.mockResolvedValue(undefined);
});

describe("reportes API", () => {
  it("POST guarda category y conserva entrada vía claims", async () => {
    const r = await call("POST", "/", "student:buyer", { targetType: "document", targetId: "d1", category: "NO_SHOW", reason: "No se presentó al punto acordado" });
    expect(r.status).toBe(201); expect(h.report.create).toHaveBeenCalledWith({ data: expect.objectContaining({ category: "NO_SHOW", reporterId: "buyer" }) });
  });
  it("POST de pedido conserva la congelación de payout", async () => {
    h.order.findUnique.mockResolvedValue({ id: "o1", buyerId: "buyer", sellerId: "seller" });
    h.payout.findUnique.mockResolvedValue({ id: "p1", orderId: "o1", status: "PENDING", netCents: 1000, frozenReason: null, sellerId: "seller", collectorId: "staff" });
    h.payout.update.mockResolvedValue({ id: "p1", orderId: "o1", status: "FROZEN", netCents: 1000, frozenReason: "No se presentó al punto acordado", sellerId: "seller", collectorId: "staff" });
    const r = await call("POST", "/", "student:buyer", { targetType: "order", targetId: "o1", category: "NO_SHOW", reason: "No se presentó al punto acordado" });
    expect(r.status).toBe(201); expect(h.payout.update).toHaveBeenCalledWith({ where: { id: "p1" }, data: { status: "FROZEN", frozenReason: "No se presentó al punto acordado" } });
  });
  it("GET enriquece, filtra por estado y pagina; estudiante recibe 403", async () => {
    h.report.count.mockResolvedValue(2); h.report.findMany.mockResolvedValue([sample]);
    h.document.findMany.mockResolvedValue([{ id: "d1", authorId: "seller", title: "Guía de anatomía" }]);
    h.user.findMany.mockResolvedValue([{ id: "seller", email: "seller@unsa.edu.pe", profile: { fullName: "Vendedor" } }]);
    const r = await call("GET", "/", "moderator:staff", {}, { status: "OPEN", page: "2", pageSize: "5" });
    expect(r.status).toBe(200); expect(r.body).toMatchObject({ page: 2, pageSize: 5, total: 2 });
    const row = (r.body.data as Array<{ reporter: { nombre: string }; owner: { correo: string }; publication: { title: string } }>)[0];
    expect(row).toMatchObject({ reporter: { nombre: "Comprador" }, owner: { correo: "seller@unsa.edu.pe" }, publication: { title: "Guía de anatomía" } });
    expect(h.report.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "OPEN" }, skip: 5, take: 5 }));
    expect((await call("GET", "/", "student")).status).toBe(403);
  });
  it("GET resuelve dueño vendedor y publicación desde un pedido", async () => {
    h.report.findMany.mockResolvedValue([{ ...sample, targetType: "order", targetId: "o1" }]);
    h.order.findMany.mockResolvedValue([{ id: "o1", sellerId: "seller", itemType: "bazar", itemId: "b1", itemTitle: "Foto antigua" }]);
    h.bazarItem.findMany.mockResolvedValue([{ id: "b1", sellerId: "seller", title: "Libro actual" }]);
    h.user.findMany.mockResolvedValue([{ id: "seller", email: "seller@unsa.edu.pe", profile: { fullName: "Vendedor" } }]);
    const r = await call("GET", "/", "admin");
    const row = (r.body.data as Array<{ owner: { id: string }; publication: { type: string; id: string; title: string } }>)[0];
    expect(row).toMatchObject({ owner: { id: "seller" }, publication: { type: "bazar", id: "b1", title: "Libro actual" } });
  });
  it("rechaza decisión inválida y no resuelve el reporte", async () => {
    const r = await call("POST", "/r1/action", "moderator", { decision: "REJECTED" });
    expect(r.status).toBe(400); expect(h.report.updateMany).not.toHaveBeenCalled();
  });
  it("exige motivo al atender un reporte de publicación", async () => {
    const r = await call("POST", "/r1/action", "moderator", { decision: "ACTIONED" });
    expect(r.status).toBe(400); expect(h.report.updateMany).not.toHaveBeenCalled();
  });
  it.each(["document", "bazar", "order"])("ACTIONED retira publicación para objetivo %s y notifica", async (targetType) => {
    h.report.findUnique.mockResolvedValue({ ...sample, targetType, targetId: targetType === "order" ? "o1" : targetType === "document" ? "d1" : "b1" });
    h.order.findUnique.mockResolvedValue({ itemType: "bazar", itemId: "b1" });
    h.document.findUnique.mockResolvedValue({ id: "d1", authorId: "seller", removedAt: null, status: "PUBLISHED" });
    h.bazarItem.findUnique.mockResolvedValue({ id: "b1", sellerId: "seller", removedAt: null });
    const r = await call("POST", "/r1/action", "moderator", { decision: "ACTIONED", reason: "No cumplió las reglas de la plataforma" });
    expect(r.status).toBe(200); expect(h.report.updateMany).toHaveBeenCalledWith({ where: { id: "r1", status: "OPEN" }, data: { status: "ACTIONED" } });
    const modified = targetType === "document" ? h.document.update : h.bazarItem.update;
    expect(modified).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ removedReason: "No cumplió las reglas de la plataforma" }) }));
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ userId: "seller", type: "PUBLICATION_REMOVED" }));
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ userId: "buyer", type: "REPORT_RESOLVED" }));
  });
  it("DISMISSED cierra y avisa sin retirar", async () => {
    const r = await call("POST", "/r1/action", "admin", { decision: "DISMISSED" });
    expect(r.status).toBe(200); expect(h.document.update).not.toHaveBeenCalled();
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ type: "REPORT_RESOLVED", userId: "buyer" }));
  });
});
