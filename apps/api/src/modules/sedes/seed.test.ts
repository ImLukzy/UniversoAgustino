import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { seedSedes } from "./seed.js";
const h = { lock: vi.fn(), marker: vi.fn(), sede: vi.fn(), hours: vi.fn(), audit: vi.fn() };
const db = { $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({ $queryRaw: h.lock, sede: { upsert: h.sede }, openingHours: { upsert: h.hours }, auditLog: { findFirst: h.marker, create: h.audit } }) } as unknown as PrismaClient;
beforeEach(() => { vi.clearAllMocks(); h.marker.mockResolvedValue(null); h.sede.mockImplementation(async ({ create }) => create); });
describe("seed sedes seguro", () => {
  it("crea tres sedes sin inventar direcciones y horario L–V/S", async () => {
    expect(await seedSedes(db)).toEqual({ seeded: true }); expect(h.sede).toHaveBeenCalledTimes(3); expect(h.hours).toHaveBeenCalledTimes(6);
    expect(h.sede.mock.calls.map(([v]) => v.create.name)).toEqual(["Ingenierías", "Sociales", "Biomédicas"]);
    for (const [v] of h.sede.mock.calls) expect(v.create).toMatchObject({ address: "", meetingPoint: "" });
    expect(h.hours).toHaveBeenLastCalledWith({ where: { weekday: 6 }, create: { weekday: 6, opens: 480, closes: 780, special: true }, update: {} });
  });
  it("repetir seed no reabre días cerrados ni sobrescribe sedes", async () => {
    h.marker.mockResolvedValue({ id: "seed-marker" });
    expect(await seedSedes(db)).toEqual({ seeded: false }); expect(h.sede).not.toHaveBeenCalled(); expect(h.hours).not.toHaveBeenCalled();
  });
  it("configuración preexistente nunca se actualiza y cambios se auditan", async () => {
    await seedSedes(db);
    for (const [v] of [...h.sede.mock.calls, ...h.hours.mock.calls]) expect(v.update).toEqual({});
    expect(h.lock.mock.invocationCallOrder[0]).toBeLessThan(h.sede.mock.invocationCallOrder[0]);
    expect(h.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "sedes.seed" }) }));
  });
});
