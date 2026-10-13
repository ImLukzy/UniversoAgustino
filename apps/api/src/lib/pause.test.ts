import { beforeEach, describe, expect, it, vi } from "vitest";
import { Router } from "express";
import { registerManage } from "../modules/documents/manage.js";
import { bazarPauseHandler } from "../modules/bazar/pause.js";
import { requireAuth } from "../middleware/auth.js";
import { accountRequest } from "../modules/staff/accountFixture.js";

const db = vi.hoisted(() => ({
  document: { findUnique: vi.fn(), update: vi.fn() }, bazarItem: { findUnique: vi.fn(), update: vi.fn() },
  order: { findMany: vi.fn() }, auditLog: { create: vi.fn() },
}));
vi.mock("./prisma.js", () => ({ prisma: db }));
vi.mock("./auth.js", () => ({ verifyAccess: (sub: string) => ({ sub, role: sub === "admin" ? "admin" : "student" }) }));
vi.mock("./moderation.js", () => ({ resubmitReview: () => ({ reviewStatus: "PENDING" }) }));

const documents = Router(); registerManage(documents);
const bazar = Router(); bazar.post("/:id/pause", requireAuth, bazarPauseHandler(false));
const doc = { id: "doc", authorId: "owner", pausedAt: null, reviewStatus: "APPROVED" };
const item = { id: "item", sellerId: "owner", pausedAt: null, reviewStatus: "APPROVED" };

beforeEach(() => {
  vi.clearAllMocks(); db.document.findUnique.mockResolvedValue(doc); db.bazarItem.findUnique.mockResolvedValue(item);
  db.document.update.mockResolvedValue({ ...doc, pausedAt: new Date() }); db.bazarItem.update.mockResolvedValue({ ...item, pausedAt: new Date() });
  db.order.findMany.mockResolvedValue([]); db.auditLog.create.mockResolvedValue({});
});

describe("pausar publicaciones", () => {
  it("dueño pausa y reactiva documento sin alterar revisión", async () => {
    const paused = await accountRequest(documents, "POST", "/doc/pause", "owner");
    const pausedData = (paused.body as { data: { id: string; pausedAt: unknown } }).data;
    expect(paused.status).toBe(200); expect(pausedData.id).toBe("doc"); expect(pausedData.pausedAt).toBeInstanceOf(Date);
    expect(db.document.update.mock.lastCall?.[0]).toMatchObject({ where: { id: "doc" } }); expect(db.document.update.mock.lastCall?.[0].data.pausedAt).toBeInstanceOf(Date);
    db.document.findUnique.mockResolvedValue({ ...doc, pausedAt: new Date() });
    expect((await accountRequest(documents, "POST", "/doc/resume", "owner")).body.data).toMatchObject({ id: "doc", pausedAt: null });
    expect(db.document.update).toHaveBeenLastCalledWith({ where: { id: "doc" }, data: { pausedAt: null } });
    expect(db.auditLog.create.mock.calls.map(([call]) => call.data.action)).toEqual(["document.pause", "document.resume"]);
  });
  it.each(["other", "admin"])("%s no puede pausar documento ajeno", async (actor) => {
    const result = await accountRequest(documents, "POST", "/doc/pause", actor);
    expect(result).toMatchObject({ status: 403, body: { error: { code: "FORBIDDEN" } } });
    expect(db.document.update).not.toHaveBeenCalled();
  });
  it("devuelve 404 si no existe", async () => {
    db.document.findUnique.mockResolvedValue(null);
    expect(await accountRequest(documents, "POST", "/missing/pause", "owner")).toMatchObject({ status: 404, body: { error: { code: "NOT_FOUND" } } });
  });
  it("bloquea pedidos en curso con el detalle de conflicto", async () => {
    db.order.findMany.mockResolvedValue([{ status: "ACCEPTED", expiresAt: null }]);
    expect(await accountRequest(documents, "POST", "/doc/pause", "owner")).toMatchObject({ status: 409, body: { error: { code: "CONFLICT_ACTIVE_ORDERS", message: "Tiene pedidos en curso, no se puede pausar", details: { activeOrders: 1, statuses: ["ACCEPTED"], canForce: false } } } });
    expect(db.document.update).not.toHaveBeenCalled();
  });
  it("indica cuándo se puede pausar tras una reserva PENDING", async () => {
    db.order.findMany.mockResolvedValue([{ status: "PENDING", expiresAt: new Date() }]);
    expect(await accountRequest(documents, "POST", "/doc/pause", "owner")).toMatchObject({ status: 409, body: { error: { message: "Hay una reserva activa. Podrás pausarla cuando expire o si la cancelas." } } });
  });
  it("pausar/reactivar es idempotente", async () => {
    const pausedAt = new Date(); db.document.findUnique.mockResolvedValue({ ...doc, pausedAt });
    expect(await accountRequest(documents, "POST", "/doc/pause", "owner")).toMatchObject({ status: 200, body: { data: { pausedAt } } });
    expect(db.order.findMany).not.toHaveBeenCalled(); expect(db.document.update).not.toHaveBeenCalled();
    expect(await accountRequest(documents, "POST", "/doc/resume", "owner")).toMatchObject({ status: 200, body: { data: { pausedAt: null } } });
  });
  it("permite al dueño pausar ítem bazar", async () => {
    const pausedItem = await accountRequest(bazar, "POST", "/item/pause", "owner");
    expect(pausedItem).toMatchObject({ status: 200, body: { data: { id: "item" } } }); expect((pausedItem.body as { data: { pausedAt: unknown } }).data.pausedAt).toBeInstanceOf(Date);
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "owner", action: "bazar.pause", entity: "bazar", entityId: "item" } });
  });
});
