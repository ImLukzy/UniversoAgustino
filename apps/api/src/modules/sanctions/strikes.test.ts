import { beforeEach, describe, expect, it, vi } from "vitest";
import { announceSanction, recordStrike } from "./strikes.js";
const h = vi.hoisted(() => ({ notify: vi.fn() }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notify }));
const tx = { user: { findUnique: vi.fn() }, strike: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
  sanction: { count: vi.fn(), create: vi.fn() }, auditLog: { create: vi.fn() } };
const now = new Date("2026-10-10T12:00:00Z");
const run = () => recordStrike(tx as never, "student", "appt", now);
beforeEach(() => {
  vi.resetAllMocks();
  tx.user.findUnique.mockResolvedValue({ role: "student" }); tx.strike.findUnique.mockResolvedValue(null);
  tx.strike.count.mockResolvedValue(1); tx.sanction.count.mockResolvedValue(0);
  tx.sanction.create.mockImplementation(async ({ data }) => ({ id: "s", ...data }));
});
describe("faltas", () => {
  it.each([1, 2])("la falta %i no sanciona", async (n) => { tx.strike.count.mockResolvedValue(n); expect(await run()).toBeNull(); expect(tx.strike.create).toHaveBeenCalledWith({ data: { userId: "student", appointmentId: "appt" } }); expect(tx.sanction.create).not.toHaveBeenCalled(); });
  it("la tercera suspende 14 días automáticamente", async () => {
    tx.strike.count.mockResolvedValue(3);
    const s = await run();
    expect(s).toMatchObject({ kind: "SUSPENSION", auto: true, userId: "student", reason: "3 faltas en 90 días" });
    expect(s?.endsAt?.toISOString()).toBe("2026-10-24T12:00:00.000Z");
    expect(tx.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ action: "sanction.auto" }) });
  });
  it("cuenta solo faltas no perdonadas de los últimos 90 días", async () => {
    await run();
    expect(tx.strike.count).toHaveBeenCalledWith({ where: { userId: "student", forgivenAt: null, createdAt: { gte: new Date("2026-07-12T12:00:00Z") } } });
  });
  it("no duplica la suspensión si ya hay una vigente", async () => { tx.strike.count.mockResolvedValue(4); tx.sanction.count.mockResolvedValue(1); expect(await run()).toBeNull(); expect(tx.sanction.create).not.toHaveBeenCalled(); });
  it("es idempotente por cita", async () => { tx.strike.findUnique.mockResolvedValue({ id: "x" }); expect(await run()).toBeNull(); expect(tx.strike.create).not.toHaveBeenCalled(); });
  it.each(["admin", "moderator"])("no registra faltas al equipo (%s)", async (role) => { tx.user.findUnique.mockResolvedValue({ role }); expect(await run()).toBeNull(); expect(tx.strike.create).not.toHaveBeenCalled(); });
  it("avisa de la suspensión con motivo y fecha fin", async () => {
    await announceSanction({ id: "s", userId: "student", reason: "3 faltas en 90 días", endsAt: new Date("2026-10-24T12:00:00Z") } as never);
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "SANCTION_APPLIED", body: expect.stringContaining("3 faltas en 90 días") }));
    expect(h.notify.mock.calls[0]?.[0].body).toContain("24/10/2026");
  });
  it("sin sanción no avisa", async () => { await announceSanction(null); expect(h.notify).not.toHaveBeenCalled(); });
});
