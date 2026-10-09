import { beforeEach, describe, expect, it, vi } from "vitest";
import { staffRouter } from "./routes.js";
import { accountRequest } from "./accountFixture.js";
const db = vi.hoisted(() => ({
  $queryRaw: vi.fn(), paymentAccount: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn() }, upload: { findUnique: vi.fn(), update: vi.fn() }, auditLog: { create: vi.fn() },
}));
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...db, $transaction: async (work: (tx: typeof db) => Promise<unknown>) => work(db) } }));
vi.mock("../../lib/storage.js", () => ({ hasObject: vi.fn().mockResolvedValue(true) }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => { const [role, sub = "owner"] = token.split(":"); return { role, sub }; } }));
const input = { userId: "owner", method: "YAPE", holder: "Titular de prueba", number: "TEST-ACCOUNT", photoUrl: "/uploads/profile.png", qrUrl: "/uploads/qr.png", active: true };
const account = { id: "account", ...input };
const request = (method: string, token?: string, body: unknown = input, path = "/payment-accounts") => accountRequest(staffRouter, method, path, token, body);
beforeEach(() => {
  vi.clearAllMocks(); db.user.findUnique.mockResolvedValue({ role: "moderator" });
  db.upload.findUnique.mockResolvedValue({ ownerId: "owner", detectedMime: "image/png" });
  db.paymentAccount.findMany.mockResolvedValue([account]); db.paymentAccount.findUnique.mockResolvedValue(account);
  db.paymentAccount.create.mockResolvedValue(account); db.paymentAccount.update.mockResolvedValue(account);
});
describe("cuentas del equipo", () => {
  it.each(["GET", "POST", "PATCH"])("anónimo %s no accede", async (method) => {
    expect((await request(method)).status).toBe(401); expect(db.paymentAccount.findMany).not.toHaveBeenCalled();
  });
  it.each(["GET", "POST", "PATCH"])("estudiante %s no accede", async (method) => {
    expect((await request(method, "student")).status).toBe(403); expect(db.paymentAccount.create).not.toHaveBeenCalled();
  });
  it("trabajador lista solo sus cuentas", async () => {
    expect((await request("GET", "moderator")).status).toBe(200);
    expect(db.paymentAccount.findMany).toHaveBeenCalledWith({ where: { userId: "owner" }, orderBy: { createdAt: "asc" } });
  });
  it("técnico lista todas", async () => {
    db.user.findUnique.mockResolvedValue({ role: "admin" });
    expect((await request("GET", "admin")).body.data).toEqual([account]);
    expect(db.paymentAccount.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: "asc" } });
  });
  it("trabajador crea cuenta propia, protege ambas fotos y audita sin números", async () => {
    expect((await request("POST", "moderator")).status).toBe(201);
    expect(db.paymentAccount.create).toHaveBeenCalledWith({ data: input });
    expect(db.upload.update).toHaveBeenCalledTimes(2);
    expect(db.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "owner", action: "paymentAccount.create", entity: "paymentAccount", entityId: "account" } });
  });
  it("trabajador no crea a nombre de otro", async () => {
    expect((await request("POST", "moderator", { ...input, userId: "other" })).status).toBe(403);
    expect(db.paymentAccount.create).not.toHaveBeenCalled();
  });
  it("técnico crea cuenta para miembro actual", async () => {
    db.user.findUnique.mockResolvedValue({ role: "admin" });
    expect((await request("POST", "admin", { ...input, userId: "other" })).status).toBe(201);
  });
  it("no crea cuenta para usuario que no es trabajador", async () => {
    db.user.findUnique.mockResolvedValueOnce({ role: "admin" }).mockResolvedValueOnce({ role: "student" });
    expect((await request("POST", "admin", { ...input, userId: "other" })).body.error?.code).toBe("NOT_STAFF"); expect(db.paymentAccount.create).not.toHaveBeenCalled();
  });
  it.each([null, { ownerId: "third", detectedMime: "image/png" }, { ownerId: "owner", detectedMime: "application/pdf" }])("rechaza foto inexistente, ajena o PDF %j", async (photo) => {
    db.upload.findUnique.mockResolvedValue(photo);
    expect((await request("POST", "moderator")).body.error?.code).toBe("BAD_PHOTO"); expect(db.paymentAccount.create).not.toHaveBeenCalled();
  });
  it.each([{ ...input, qrUrl: "https://example.org/qr.png" }, { ...input, number: " " }, { ...input, photoUrl: "" }])("contrato inválido %j", async (body) => {
    expect((await request("POST", "moderator", body)).status).toBe(400); expect(db.paymentAccount.create).not.toHaveBeenCalled();
  });
  it("tercero no edita cuenta ajena", async () => {
    const { userId: _owner, ...data } = input;
    expect((await request("PATCH", "moderator:third", data, "/payment-accounts/account")).status).toBe(403);
    expect(db.paymentAccount.update).not.toHaveBeenCalled();
  });
  it("técnico desactiva conservando fotos y titular", async () => {
    const { userId: _owner, ...data } = input;
    expect((await request("PATCH", "admin", { ...data, active: false }, "/payment-accounts/account")).status).toBe(200);
    expect(db.paymentAccount.update).toHaveBeenCalledWith({ where: { id: "account" }, data: { ...data, active: false } });
    expect(db.upload.findUnique).not.toHaveBeenCalled(); expect(db.auditLog.create).toHaveBeenCalledTimes(1);
  });
  it("token de exmiembro no permite leer cuentas", async () => {
    db.user.findUnique.mockResolvedValue({ role: "creator" });
    expect((await request("GET", "admin")).status).toBe(403); expect(db.paymentAccount.findMany).not.toHaveBeenCalled();
  });
  it("token admin antiguo no permite editar cuenta ajena tras degradación", async () => {
    const { userId: _owner, ...data } = input;
    db.paymentAccount.findUnique.mockResolvedValue({ ...account, userId: "other" });
    expect((await request("PATCH", "admin", data, "/payment-accounts/account")).status).toBe(403);
    expect(db.paymentAccount.update).not.toHaveBeenCalled();
  });
  it("no permite transferir propiedad al editar", async () => {
    expect((await request("PATCH", "admin", input, "/payment-accounts/account")).status).toBe(400);
    expect(db.paymentAccount.update).not.toHaveBeenCalled();
  });
});
