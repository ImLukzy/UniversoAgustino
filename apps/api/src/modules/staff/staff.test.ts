import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { StaffMemberSchema } from "@hub/shared";
import { staffRouter } from "./routes.js";
import { errorHandler } from "../../middleware/errors.js";

vi.mock("../../lib/notify.js", () => ({ notify: vi.fn() }));

const db = vi.hoisted(() => ({
  user: { findMany: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  auditLog: { findMany: vi.fn(), create: vi.fn() }, refreshToken: { updateMany: vi.fn() },
}));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (fn: (tx: typeof db) => Promise<unknown>) => fn(db) } }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => {
  if (token === "invalid") throw new Error("token inválido");
  const [role, sub = "actor"] = token.split(":"); return { role, sub };
} }));
const user = { id: "member", email: "member@unsa.edu.pe", role: "student", createdAt: new Date("2026-01-01"), profile: { fullName: "Persona" } };
const since = new Date("2026-10-08");
// Ejecuta el router real y sus permisos sin abrir puertos ni contactar servicios.
function request(method: string, path = "/members", role?: string, body: unknown = {}) {
  return new Promise<{ status: number; body: { data?: unknown; error?: { code: string } } }>((resolve) => {
    const req = { method, url: path, headers: role ? { authorization: `Bearer ${role}` } : {}, body } as Request;
    const res = {
      statusCode: 200,
      status(code: number) { this.statusCode = code; return this; },
      json(value: { data?: unknown; error?: { code: string } }) { resolve({ status: this.statusCode, body: value }); return this; },
    } as Response;
    const router = staffRouter as typeof staffRouter & { handle: (req: Request, res: Response, next: NextFunction) => void };
    router.handle(req, res, (error?: unknown) => error ? errorHandler(error, req, res, () => {}) : res.status(404).json({}));
  });
}
beforeEach(() => {
  vi.resetAllMocks(); db.user.findMany.mockResolvedValue([user]); db.user.findUnique.mockResolvedValue(user);
  db.user.updateMany.mockResolvedValue({ count: 1 }); db.auditLog.findMany.mockResolvedValue([]);
  db.auditLog.create.mockResolvedValue({ createdAt: since }); db.refreshToken.updateMany.mockResolvedValue({ count: 2 });
});

describe("permisos /staff", () => {
  it.each(["GET", "POST", "DELETE"])("sin sesión %s → 401", async (method) => {
    expect((await request(method, method === "DELETE" ? "/members/member" : "/members")).status).toBe(401);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it.each(["GET", "POST", "DELETE"])("student %s → 403 sin datos", async (method) => {
    expect((await request(method, method === "DELETE" ? "/members/member" : "/members", "student")).status).toBe(403);
    expect(db.user.findMany).not.toHaveBeenCalled(); expect(db.user.updateMany).not.toHaveBeenCalled();
  });
  it("moderator lista miembros y fecha de alta auditada", async () => {
    db.user.findMany.mockResolvedValue([{ ...user, role: "moderator" }]);
    db.auditLog.findMany.mockResolvedValue([{ entityId: user.id, createdAt: since }]);
    const r = await request("GET", "/members", "moderator"); expect(r.status).toBe(200);
    expect(r.body.data).toEqual([{ id: user.id, email: user.email, fullName: "Persona", role: "moderator", since }]);
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { role: { in: ["moderator", "admin"] } } }));
  });
  it.each(["POST", "DELETE"])("moderator %s → 403", async (method) => {
    expect((await request(method, method === "DELETE" ? "/members/member" : "/members", "moderator")).status).toBe(403);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });
  it("token inválido → 401", async () => { expect((await request("GET", "/members", "invalid")).status).toBe(401); });
});

describe("altas y bajas del equipo", () => {
  it("admin añade UNSA normalizado, audita", async () => {
    const r = await request("POST", "/members", "admin", { email: " MEMBER@UNSA.EDU.PE " });
    expect(r.status).toBe(200); expect(r.body.data).toEqual(expect.objectContaining({ role: "moderator", since }));
    expect(db.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { email: user.email } }));
    expect(db.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { role: "moderator" } }));
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "actor", action: "staff.add", entity: "user", entityId: user.id } });
  });
  it.each(["user@gmail.com", "bad", "user@unsa.edu.pe.evil.org"])("rechaza email %s", async (email) => {
    expect((await request("POST", "/members", "admin", { email })).status).toBe(400);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it("acepta excepción autorizada", async () => {
    expect(StaffMemberSchema.parse({ email: "lukas.melgar@tecsup.edu.pe" }).email).toBe("lukas.melgar@tecsup.edu.pe");
    expect((await request("POST", "/members", "admin", { email: "lukas.melgar@tecsup.edu.pe" })).status).toBe(200);
  });
  it("inexistente → 404 sin cambios", async () => {
    db.user.findUnique.mockResolvedValue(null);
    const r = await request("POST", "/members", "admin", { email: user.email });
    expect(r.status).toBe(404); expect(r.body.error?.code).toBe("USER_NOT_FOUND"); expect(db.user.updateMany).not.toHaveBeenCalled();
  });
  it("duplicado o alta concurrente → 409 sin auditoría", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    const r = await request("POST", "/members", "admin", { email: user.email });
    expect(r.status).toBe(409); expect(r.body.error?.code).toBe("ALREADY_STAFF");
    expect(db.auditLog.create).not.toHaveBeenCalled();
  });
  it("auto-baja → 409", async () => {
    const r = await request("DELETE", "/members/actor", "admin");
    expect(r.status).toBe(409); expect(r.body.error?.code).toBe("SELF_REMOVE"); expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it("quitar otro admin → 409", async () => {
    db.user.findUnique.mockResolvedValue({ role: "admin" });
    const r = await request("DELETE", "/members/other", "admin");
    expect(r.status).toBe(409); expect(r.body.error?.code).toBe("IS_ADMIN"); expect(db.user.updateMany).not.toHaveBeenCalled();
  });
  it("baja revoca refresh, devuelve creator, audita", async () => {
    db.user.findUnique.mockResolvedValue({ role: "moderator" });
    const r = await request("DELETE", "/members/member", "admin");
    expect(r.status).toBe(200); expect(r.body.data).toEqual({ id: "member", role: "creator" });
    expect(db.user.updateMany).toHaveBeenCalledWith({ where: { id: "member", role: "moderator" }, data: { role: "creator" } });
    expect(db.refreshToken.updateMany).toHaveBeenCalledWith({ where: { userId: "member", revoked: false }, data: { revoked: true } });
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "actor", action: "staff.remove", entity: "user", entityId: "member" } });
  });
  it("baja inexistente → 404", async () => {
    db.user.findUnique.mockResolvedValue(null); expect((await request("DELETE", "/members/member", "admin")).status).toBe(404);
  });
  it("baja duplicada o rol cambiado → 409 sin revocar", async () => {
    db.user.updateMany.mockResolvedValue({ count: 0 });
    const r = await request("DELETE", "/members/member", "admin");
    expect(r.status).toBe(409); expect(r.body.error?.code).toBe("NOT_STAFF"); expect(db.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
