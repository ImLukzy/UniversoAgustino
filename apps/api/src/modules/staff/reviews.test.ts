import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router, type NextFunction, type Request, type Response } from "express";
import { staffRouter } from "./routes.js";
import { documentsRouter } from "../documents/routes.js";
import { bazarRouter } from "../bazar/routes.js";
import { registerCreate } from "../orders/create.js";
import { errorHandler } from "../../middleware/errors.js";
import { initialReview } from "../../lib/moderation.js";
import { hasFullAccess } from "../documents/access.js";

const h = vi.hoisted(() => {
  const model = () => ({ count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), updateMany: vi.fn(), update: vi.fn(), create: vi.fn() });
  return { document: model(), bazarItem: model(), user: { findUnique: vi.fn() }, auditLog: { create: vi.fn() },
    savedDocument: { count: vi.fn() }, order: model(), notice: vi.fn(), env: { MODERATION_TRUST_AFTER: 0, FEE_PCT: 13 }, read: vi.fn() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: async (fn: (tx: typeof h) => Promise<unknown>) => fn(h) } }));
vi.mock("../../env.js", () => ({ env: h.env }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notice, orderLink: () => "/ventas" }));
vi.mock("../../lib/storage.js", () => ({ readObject: h.read }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => { const [role, sub = "actor"] = token.split(":"); return { role, sub }; } }));
const orders = Router(); registerCreate(orders);
const owner = { id: "author", email: "author@unsa.edu.pe", profile: { fullName: "Autor" } };
const item = { id: "item", title: "Apunte propio", authorId: "author", sellerId: "author", author: owner, seller: owner,
  reviewStatus: "PENDING", status: "PUBLISHED", priceCents: 100, fileUrl: "/uploads/preview.png", previewPages: [1, 2], createdAt: new Date() };
function request(router: Router, method: string, path: string, role?: string, body: unknown = {}, query: Record<string, string> = {}) {
  return new Promise<{ status: number; body: { data?: unknown; error?: { code: string }; total?: number } }>((resolve) => {
    const req = { method, url: path, query, headers: role ? { authorization: `Bearer ${role}` } : {}, body } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; }, setHeader() {},
      json(this: Response, value: { data?: unknown; error?: { code: string } }) { resolve({ status: this.statusCode, body: value }); return this; },
      send(this: Response, value: unknown) { resolve({ status: this.statusCode, body: { data: value } }); return this; } } as unknown as Response;
    (router as Router & { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res,
      (error?: unknown) => error ? errorHandler(error, req, res, () => {}) : res.status(404).json({}));
  });
}
beforeEach(() => {
  vi.resetAllMocks(); h.env.MODERATION_TRUST_AFTER = 0; h.user.findUnique.mockResolvedValue({ role: "student" });
  for (const model of [h.document, h.bazarItem]) {
    model.groupBy.mockResolvedValue([]); model.count.mockResolvedValue(0); model.findMany.mockResolvedValue([]); model.findUnique.mockResolvedValue(item);
    model.findUniqueOrThrow.mockResolvedValue(item); model.updateMany.mockResolvedValue({ count: 1 });
    model.create.mockResolvedValue(item); model.update.mockResolvedValue(item);
  }
  h.savedDocument.count.mockResolvedValue(0); h.order.count.mockResolvedValue(0); h.notice.mockResolvedValue(undefined);
  h.read.mockResolvedValue(Buffer.from("image"));
});

describe("historial y alta", () => {
  it("autor nuevo con N=3 → PENDING", async () => { h.env.MODERATION_TRUST_AFTER = 3; expect(await initialReview("author")).toBe("PENDING"); });
  it("N aprobadas entre docs y bazar → APPROVED", async () => {
    h.env.MODERATION_TRUST_AFTER = 3; h.document.count.mockResolvedValue(2); h.bazarItem.count.mockResolvedValue(1);
    expect(await initialReview("author")).toBe("APPROVED");
    expect(h.document.count).toHaveBeenCalledWith({ where: { authorId: "author", reviewStatus: "APPROVED" } });
  });
  it("umbral 0 siempre revisa al autor aunque tenga historial", async () => {
    h.document.count.mockResolvedValue(100); expect(await initialReview("author")).toBe("PENDING");
  });
  it.each(["moderator", "admin"])("equipo %s publica directo con umbral 0", async (role) => {
    h.user.findUnique.mockResolvedValue({ role }); expect(await initialReview("author")).toBe("APPROVED");
  });
  it.each(["document", "bazar"])("alta %s persiste PENDING aunque el cliente pida APPROVED", async (type) => {
    const router = type === "document" ? documentsRouter : bazarRouter;
    const body = { title: "Apunte propio", course: "Curso", cycle: "1", career: "ENFERMERIA", type: "APUNTE", kind: "LIBRO", tx: "VENTA", priceCents: 100, reviewStatus: "APPROVED" };
    expect((await request(router, "POST", "/", "student:author", body)).status).toBe(201);
    expect((type === "document" ? h.document : h.bazarItem).create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reviewStatus: "PENDING" }) }));
  });
});

describe("visibilidad, edición y compra", () => {
  it.each(["document", "bazar"])("listado %s exige APPROVED", async (type) => {
    const r = await request(type === "document" ? documentsRouter : bazarRouter, "GET", "/"); expect(r.status).toBe(200);
    expect((type === "document" ? h.document : h.bazarItem).findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ reviewStatus: "APPROVED" }) }));
  });
  it.each(["PENDING", "REJECTED"])("detalle %s: tercero 404; dueño y equipo 200", async (reviewStatus) => {
    for (const model of [h.document, h.bazarItem]) model.findUnique.mockResolvedValue({ ...item, reviewStatus });
    for (const router of [documentsRouter, bazarRouter]) {
      for (const role of [undefined, "student:third"]) expect((await request(router, "GET", "/item", role)).status).toBe(404);
      for (const role of ["student:author", "moderator", "admin"]) expect((await request(router, "GET", "/item", role)).status).toBe(200);
    }
  });
  it.each(["PENDING", "REJECTED"])("preview %s: tercero 404; dueño y equipo 200", async (reviewStatus) => {
    h.document.findUnique.mockResolvedValue({ ...item, reviewStatus });
    expect((await request(documentsRouter, "GET", "/item/preview", "student:third")).status).toBe(404);
    for (const role of ["student:author", "moderator", "admin"]) expect((await request(documentsRouter, "GET", "/item/preview", role)).status).toBe(200);
  });
  it.each(["document", "bazar"])("editar %s REJECTED reenvía sin metadatos anteriores", async (type) => {
    const model = type === "document" ? h.document : h.bazarItem; model.findUniqueOrThrow.mockResolvedValue({ ...item, reviewStatus: "REJECTED" });
    expect((await request(type === "document" ? documentsRouter : bazarRouter, "PATCH", "/item", "student:author", { title: "Corregido" })).status).toBe(200);
    expect(model.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reviewStatus: "PENDING", reviewNote: null, reviewedById: null, reviewedAt: null }) }));
  });
  it.each(["document", "bazar"])("comprar %s PENDING → 409 antes de reservar", async (itemType) => {
    const r = await request(orders, "POST", "/", "student:buyer", { itemType, itemId: "item" });
    expect(r.status).toBe(409); expect(h.order.create).not.toHaveBeenCalled(); expect(h.order.updateMany).not.toHaveBeenCalled();
  });
  it("reserva directa bazar PENDING → 409 sin cambiar stock", async () => {
    expect((await request(bazarRouter, "POST", "/item/reserve", "student:buyer")).status).toBe(409);
    expect(h.bazarItem.update).not.toHaveBeenCalled();
  });
  it("moderador ve PDF de pago sin compra", async () => { expect(await hasFullAccess(item, { sub: "mod", role: "moderator" })).toBe(true); });
});

describe("decisiones del equipo", () => {
  it("cola FIFO limitada a 50 incluye historial y no expone campos del usuario", async () => {
    h.document.findMany.mockResolvedValue([item]);
    const r = await request(staffRouter, "GET", "/reviews", "moderator", {}, { type: "document", pageSize: "50" });
    expect(r.status).toBe(200);
    expect(h.document.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { reviewStatus: "PENDING" }, take: 50, orderBy: [{ createdAt: "asc" }, { id: "asc" }] }));
    expect(r.body.data).toEqual([expect.objectContaining({ type: "document", previewUrl: "/v/item", author: { id: "author", email: owner.email, fullName: "Autor", approvedCount: 0 } })]);
    expect((await request(staffRouter, "GET", "/reviews", "moderator", {}, { pageSize: "51" })).status).toBe(400);
  });
  it.each(["approve", "reject"])("student no %s (403)", async (action) => {
    expect((await request(staffRouter, "POST", `/reviews/document/item/${action}`, "student", { reason: "Motivo suficiente" })).status).toBe(403);
    expect(h.document.updateMany).not.toHaveBeenCalled();
  });
  it.each(["approve", "reject"])("fuera de PENDING o carrera %s → 409", async (action) => {
    h.document.updateMany.mockResolvedValue({ count: 0 });
    const r = await request(staffRouter, "POST", `/reviews/document/item/${action}`, "moderator", { reason: "Motivo suficiente" });
    expect(r.status).toBe(409); expect(r.body.error?.code).toBe("BAD_STATE"); expect(h.auditLog.create).not.toHaveBeenCalled();
  });
  it.each([undefined, "corto", " ".repeat(12), "x".repeat(301)])("rechazo sin motivo válido → 400", async (reason) => {
    expect((await request(staffRouter, "POST", "/reviews/document/item/reject", "admin", { reason })).status).toBe(400);
    expect(h.document.updateMany).not.toHaveBeenCalled();
  });
  it.each(["document", "bazar"])("aprueba %s con auditoría y aviso", async (type) => {
    expect((await request(staffRouter, "POST", `/reviews/${type}/item/approve`, "moderator")).status).toBe(200);
    expect(h.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "review.approve", entity: type, actorId: "actor" }) });
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ userId: "author", type: "REVIEW_APPROVED" }));
  });
  it("rechaza con motivo, revisor, fecha, auditoría y aviso", async () => {
    const r = await request(staffRouter, "POST", "/reviews/bazar/item/reject", "admin", { reason: "  Motivo suficiente  " }); expect(r.status).toBe(200);
    expect(h.bazarItem.updateMany).toHaveBeenCalledWith({ where: { id: "item", reviewStatus: "PENDING" }, data: { reviewStatus: "REJECTED", reviewNote: "Motivo suficiente", reviewedById: "actor", reviewedAt: expect.any(Date) } });
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ type: "REVIEW_REJECTED", body: "Motivo suficiente" }));
  });
});
