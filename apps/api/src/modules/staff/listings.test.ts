import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router, type NextFunction, type Request, type Response } from "express";
import { staffRouter } from "./routes.js";
import { documentsRouter } from "../documents/routes.js";
import { bazarRouter } from "../bazar/routes.js";
import { registerCreate } from "../orders/create.js";
import { errorHandler } from "../../middleware/errors.js";

const h = vi.hoisted(() => {
  const model = () => ({ count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), findFirst: vi.fn(), create: vi.fn(), groupBy: vi.fn() });
  return { document: model(), bazarItem: model(), report: model(), order: model(), savedDocument: { count: vi.fn() }, auditLog: { create: vi.fn() }, notification: { create: vi.fn() }, sanction: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() }, notice: vi.fn(), env: { FEE_PCT: 13 }, read: vi.fn() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h } }));
vi.mock("../../env.js", () => ({ env: h.env }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notice, orderLink: () => "/ventas" }));
vi.mock("../../lib/storage.js", () => ({ readObject: h.read }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => { const [role, sub = "actor"] = token.split(":"); return { role, sub }; } }));
const orders = Router(); registerCreate(orders);
const owner = { id: "owner", authorId: "owner", sellerId: "owner", email: "owner@unsa.edu.pe", profile: { fullName: "Dueño" } };
const listing = { id: "l1", title: "Apunte de prueba", priceCents: 100, status: "PUBLISHED", reviewStatus: "APPROVED", pausedAt: null, removedAt: null, authorId: "owner", sellerId: "owner", author: owner, seller: owner, createdAt: new Date() };
function request(router: Router, method: string, path: string, role?: string, body: unknown = {}, query: Record<string, string> = {}) {
  type Body = { data?: unknown; error?: { code?: string; message?: string }; total?: number };
  return new Promise<{ status: number; body: Body }>((resolve) => {
    const req = { method, url: path, query, headers: role ? { authorization: `Bearer ${role}` } : {}, body } as Request;
    const res = { statusCode: 200, status(this: Response, code: number) { this.statusCode = code; return this; }, setHeader() {},
      json(this: Response, value: Body) { resolve({ status: this.statusCode, body: value }); return this; },
      send(this: Response, value: unknown) { resolve({ status: this.statusCode, body: { data: value } }); return this; } } as unknown as Response;
    (router as Router & { handle: (req: Request, res: Response, next: NextFunction) => void }).handle(req, res,
      (error?: unknown) => error ? errorHandler(error, req, res, () => {}) : res.status(404).json({}));
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  for (const model of [h.document, h.bazarItem]) { model.count.mockResolvedValue(0); model.findMany.mockResolvedValue([]); model.findUnique.mockResolvedValue(listing); model.findUniqueOrThrow.mockResolvedValue(listing); model.update.mockResolvedValue(listing); }
  h.report.groupBy.mockResolvedValue([]); h.order.create.mockResolvedValue({ id: "o1" }); h.order.updateMany.mockResolvedValue({ count: 0 }); h.order.findFirst.mockResolvedValue(null);
  h.order.findMany.mockResolvedValue([]);
  h.savedDocument.count.mockResolvedValue(0);
  h.auditLog.create.mockResolvedValue({}); h.notice.mockResolvedValue(undefined); h.sanction.findFirst.mockResolvedValue(null); h.user.findUnique.mockResolvedValue({ role: "student" });
});

describe("moderación de publicaciones", () => {
  it("moderator retira y notifica con motivo", async () => {
    const r = await request(staffRouter, "POST", "/listings/document/l1/remove", "moderator:staff", { reason: "Incumple las reglas de publicación" });
    expect(r.status).toBe(200); expect(h.document.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ removedReason: "Incumple las reglas de publicación", removedById: "staff" }) }));
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ userId: "owner", type: "PUBLICATION_REMOVED", link: "/publicaciones" }));
  });
  it("estudiante recibe 403, motivo corto 400, y retiro repetido es idempotente", async () => {
    expect((await request(staffRouter, "POST", "/listings/document/l1/remove", "student", { reason: "Motivo suficiente" })).status).toBe(403);
    expect((await request(staffRouter, "POST", "/listings/document/l1/remove", "moderator", { reason: "corto" })).status).toBe(400);
    h.document.findUnique.mockResolvedValue({ ...listing, removedAt: new Date("2026-10-12") });
    const r = await request(staffRouter, "POST", "/listings/document/l1/remove", "moderator", { reason: "Motivo suficiente" });
    expect(r.status).toBe(200); expect(h.document.update).not.toHaveBeenCalled(); expect(h.notice).not.toHaveBeenCalled();
  });
  it("solo admin restaura y TAKEDOWN vuelve a PUBLISHED", async () => {
    h.document.findUnique.mockResolvedValue({ ...listing, status: "TAKEDOWN" });
    expect((await request(staffRouter, "POST", "/listings/document/l1/restore", "moderator")).status).toBe(403);
    const r = await request(staffRouter, "POST", "/listings/document/l1/restore", "admin");
    expect(r.status).toBe(200); expect(h.document.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PUBLISHED", removedAt: null }) }));
    expect(h.notice).toHaveBeenCalledWith(expect.objectContaining({ type: "PUBLICATION_RESTORED" }));
  });
  it("filtra y pagina catálogo de staff con conteo abierto", async () => {
    h.document.count.mockResolvedValue(6);
    h.document.findMany.mockResolvedValue([...Array.from({ length: 5 }, (_, i) => ({ ...listing, id: `newer${i}`, createdAt: new Date(2026, 9, 12, 12, i + 1) })), { ...listing, author: owner, createdAt: new Date(2026, 9, 12, 12, 0) }]);
    h.report.groupBy.mockResolvedValue([{ targetId: "l1", _count: { _all: 3 } }]);
    const r = await request(staffRouter, "GET", "/listings", "moderator", {}, { type: "document", state: "active", q: "Apunte", page: "2", pageSize: "5" });
    expect(r.status).toBe(200);
    const query = h.document.findMany.mock.calls[0]?.[0] as { take: number; where: { AND: unknown[] } };
    expect(query.take).toBe(10); expect(query.where.AND).toHaveLength(2);
    expect(r.body.total).toBe(6);
    expect((r.body.data as Array<{ id: string; type: string; state: string; openReports: number; owner: { nombre: string; correo: string } }>)[0]).toMatchObject({ id: "l1", type: "document", state: "active", openReports: 3, owner: { nombre: "Dueño", correo: owner.email } });
  });
});

describe("publicaciones retiradas", () => {
  it("detalle marca retiradas y TAKEDOWN legado", async () => {
    h.document.findUnique.mockResolvedValue({ ...listing, status: "TAKEDOWN" });
    const d = await request(documentsRouter, "GET", "/l1");
    expect((d.body.data as { removed: boolean }).removed).toBe(true);
    h.bazarItem.findUnique.mockResolvedValue({ ...listing, removedAt: new Date() });
    const b = await request(bazarRouter, "GET", "/l1");
    expect((b.body.data as { removed: boolean }).removed).toBe(true);
  });
  it("catálogo público excluye removedAt y crear pedido responde LISTING_REMOVED", async () => {
    await request(documentsRouter, "GET", "/");
    expect(h.document.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ removedAt: null }) }));
    await request(bazarRouter, "GET", "/");
    expect(h.bazarItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ removedAt: null }) }));
    h.document.findUniqueOrThrow.mockResolvedValue({ ...listing, removedAt: new Date() });
    const r = await request(orders, "POST", "/", "student:buyer", { itemType: "document", itemId: "l1" });
    expect(r.status).toBe(409); expect(r.body.error?.code).toBe("LISTING_REMOVED"); expect(h.order.create).not.toHaveBeenCalled();
  });
});

describe("edición y eliminación solo por el dueño", () => {
  for (const { kind, router } of [{ kind: "document", router: documentsRouter }, { kind: "bazar", router: bazarRouter }]) {
    it(`${kind}: dueño puede editar y eliminar; moderator/admin reciben 403`, async () => {
    const model = kind === "document" ? h.document : h.bazarItem;
    const base = await request(router, "PATCH", "/l1", "student:owner", { title: "Título corregido" });
    expect(base.status).toBe(200);
    const deleted = await request(router, "DELETE", "/l1", "student:owner");
    expect(deleted.status).toBe(200);
    model.update.mockClear(); model.delete.mockClear();
    for (const role of ["moderator", "admin"]) {
      for (const method of ["PATCH", "DELETE"]) {
        const response = await request(router, method, "/l1", `${role}:staff`, { title: "Título corregido" });
        const verb = method === "PATCH" ? "edita" : "elimina";
        expect(response).toMatchObject({ status: 403, body: { error: { code: "FORBIDDEN", message: `Solo el dueño ${verb} su publicación` } } });
      }
    }
    expect(model.update).not.toHaveBeenCalled(); expect(model.delete).not.toHaveBeenCalled();
    });
  }
});
