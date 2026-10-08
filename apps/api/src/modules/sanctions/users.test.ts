import express from "express";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => {
  const m = () => ({ findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), create: vi.fn(), updateMany: vi.fn() });
  return { user: m(), strike: m(), userReview: m(), sanction: m(), order: m(), auditLog: m(), notify: vi.fn(), role: { current: "moderator" } };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: { ...h, $transaction: async (fn: (t: typeof h) => Promise<unknown>) => fn(h) } }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notify }));
import { usersRouter } from "./users.js";
import { errorHandler } from "../../middleware/errors.js";
const app = express(); app.use(express.json());
app.use((req, _res, next) => { (req as unknown as { user: unknown }).user = { sub: "actor", role: h.role.current }; next(); });
app.use("/users", usersRouter); app.use(errorHandler);
let base = ""; let server: ReturnType<typeof app.listen>;
beforeAll(async () => { server = app.listen(0, "127.0.0.1"); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
afterAll(() => { server.close(); });
const call = (method: string, path: string, body?: unknown) => fetch(base + path, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then(async (r) => ({ status: r.status, json: await r.json() as { error?: { code: string } } }));
const as = (role: string) => { h.role.current = role; };
beforeEach(() => {
  vi.resetAllMocks(); as("moderator");
  h.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => where.id === "actor" ? { role: h.role.current } : where.id === "staff" ? { id: "staff", role: "moderator", profile: null } : { id: "student", email: "e@unsa.edu.pe", role: "student", createdAt: new Date(), profile: { fullName: "Est", career: "X" } });
  h.sanction.count.mockResolvedValue(0); h.sanction.create.mockImplementation(async ({ data }) => ({ id: "s1", ...data }));
  h.userReview.create.mockResolvedValue({ id: "r1" }); h.userReview.findFirst.mockResolvedValue(null);
});
describe("sanciones del equipo", () => {
  it("Trabajador advierte", async () => { expect((await call("POST", "/users/student/sanctions", { kind: "WARNING", reason: "Llegó tarde" })).status).toBe(201); expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "SANCTION_APPLIED" })); });
  it.each(["SUSPENSION", "BAN"])("Trabajador no aplica %s", async (kind) => {
    const r = await call("POST", "/users/student/sanctions", { kind, reason: "Motivo claro", ...(kind === "SUSPENSION" ? { days: 5 } : {}) });
    expect(r.status).toBe(403); expect(h.sanction.create).not.toHaveBeenCalled();
  });
  it("Técnico aplica BAN y SUSPENSION con auditoría", async () => {
    as("admin");
    expect((await call("POST", "/users/student/sanctions", { kind: "BAN", reason: "Fraude comprobado" })).status).toBe(201);
    expect((await call("POST", "/users/student/sanctions", { kind: "SUSPENSION", reason: "Reincidencia", days: 7 })).status).toBe(201);
    expect(h.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "sanction.ban" }) });
  });
  it("motivo obligatorio", async () => { as("admin"); expect((await call("POST", "/users/student/sanctions", { kind: "BAN", reason: "no" })).status).toBe(400); });
  it("no sanciona a miembros del equipo", async () => { as("admin"); const r = await call("POST", "/users/staff/sanctions", { kind: "WARNING", reason: "Motivo claro" }); expect(r.status).toBe(409); expect(r.json.error?.code).toBe("TARGET_IS_STAFF"); });
  it("no duplica suspensión vigente", async () => { as("admin"); h.sanction.count.mockResolvedValue(1); const r = await call("POST", "/users/student/sanctions", { kind: "SUSPENSION", reason: "Reincidencia", days: 3 }); expect(r.json.error?.code).toBe("ALREADY_SANCTIONED"); });
  it("un estudiante que no es del equipo recibe 403", async () => { as("student"); expect((await call("POST", "/users/student/sanctions", { kind: "WARNING", reason: "Motivo claro" })).status).toBe(403); });
});
describe("levantar y perdonar: solo Técnico", () => {
  it("Trabajador no levanta", async () => { expect((await call("POST", "/users/student/sanctions/s1/lift", { reason: "Error nuestro" })).status).toBe(403); expect(h.sanction.updateMany).not.toHaveBeenCalled(); });
  it("Trabajador no perdona", async () => { expect((await call("POST", "/users/student/strikes/k1/forgive", { reason: "Justificó" })).status).toBe(403); });
  it("Técnico levanta, audita y avisa", async () => {
    as("admin"); h.sanction.updateMany.mockResolvedValue({ count: 1 });
    expect((await call("POST", "/users/student/sanctions/s1/lift", { reason: "Error nuestro" })).status).toBe(200);
    expect(h.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "sanction.lift" }) });
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "SANCTION_LIFTED" }));
  });
  it("levantar sin sanción vigente → 404", async () => { as("admin"); h.sanction.updateMany.mockResolvedValue({ count: 0 }); expect((await call("POST", "/users/student/sanctions/s1/lift", { reason: "Error nuestro" })).status).toBe(404); });
  it("Técnico perdona una falta", async () => { as("admin"); h.strike.updateMany.mockResolvedValue({ count: 1 }); expect((await call("POST", "/users/student/strikes/k1/forgive", { reason: "Justificó" })).status).toBe(200); expect(h.strike.updateMany.mock.calls[0]?.[0].data.forgivenById).toBe("actor"); });
});
describe("calificaciones del equipo", () => {
  it("Trabajador califica y comenta", async () => { expect((await call("POST", "/users/student/reviews", { score: 4, comment: "Puntual" })).status).toBe(201); expect(h.userReview.create).toHaveBeenCalledWith({ data: expect.objectContaining({ authorId: "actor", subjectId: "student", score: 4 }) }); });
  it("puntaje fuera de 1–5 → 400", async () => { expect((await call("POST", "/users/student/reviews", { score: 6 })).status).toBe(400); });
  it("misma calificación por caso → 409", async () => { h.userReview.findFirst.mockResolvedValue({ id: "x" }); expect((await call("POST", "/users/student/reviews", { score: 3, caseId: "c" })).json.error?.code).toBe("ALREADY_REVIEWED"); });
  it("no califica al equipo", async () => { expect((await call("POST", "/users/staff/reviews", { score: 3 })).status).toBe(409); });
});
