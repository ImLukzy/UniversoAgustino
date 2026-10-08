import { beforeEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { sanction: { findFirst: h.findFirst } } }));
import { assertNotSuspended, blockedMessage } from "./guard.js";
beforeEach(() => vi.resetAllMocks());
describe("bloqueo por sanción", () => {
  it("sin sanción vigente deja pasar", async () => { h.findFirst.mockResolvedValue(null); await expect(assertNotSuspended("u")).resolves.toBeUndefined(); });
  it("suspendido recibe 403 con motivo y fecha fin", async () => {
    h.findFirst.mockResolvedValue({ kind: "SUSPENSION", reason: "3 faltas en 90 días", endsAt: new Date("2026-10-24T12:00:00Z") });
    await expect(assertNotSuspended("u")).rejects.toMatchObject({ status: 403, code: "ACCOUNT_SUSPENDED", message: expect.stringContaining("24/10/2026") });
  });
  it("busca solo suspensión/ban no levantados y vigentes", async () => {
    h.findFirst.mockResolvedValue(null); await assertNotSuspended("u");
    const where = h.findFirst.mock.calls[0]?.[0].where;
    expect(where).toMatchObject({ userId: "u", kind: { in: ["SUSPENSION", "BAN"] }, liftedAt: null });
    expect(where.OR).toHaveLength(2);
  });
  it("el ban no tiene fecha fin", () => { expect(blockedMessage({ kind: "BAN", reason: "Fraude", endsAt: null })).toBe("Tu cuenta está bloqueada. Motivo: Fraude."); });
});
