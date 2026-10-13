import { describe, expect, it, vi } from "vitest";
import { moderateListing } from "./moderationListing.js";

const setup = (overrides: Partial<Parameters<typeof moderateListing>[0]> = {}) => {
  const update = vi.fn().mockResolvedValue({}); const audit = vi.fn().mockResolvedValue({}); const notify = vi.fn().mockResolvedValue({});
  const input = { id: "l1", kind: "document" as const, actorId: "staff", ownerId: "owner", removedAt: null, reason: "Incumple las reglas de publicación", update, audit, notify, ...overrides };
  return { input, update, audit, notify };
};

describe("moderateListing", () => {
  it("retira, registra auditoría y avisa al dueño con motivo y enlace", async () => {
    const s = setup(); const result = await moderateListing(s.input);
    expect(result.status).toBe(200); expect(s.update).toHaveBeenCalledWith(expect.objectContaining({ removedReason: s.input.reason, removedById: "staff" }));
    expect(s.update.mock.calls[0]?.[0].removedAt).toBeInstanceOf(Date);
    expect(s.audit).toHaveBeenCalledWith("listing.remove");
    expect(s.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "owner", type: "PUBLICATION_REMOVED", body: s.input.reason, link: "/publicaciones" }));
  });
  it("es idempotente al retirar", async () => {
    const s = setup({ removedAt: new Date("2026-10-12") }); const result = await moderateListing(s.input);
    expect(result).toEqual({ status: 200, data: { id: "l1", removedAt: s.input.removedAt } });
    expect(s.update).not.toHaveBeenCalled(); expect(s.notify).not.toHaveBeenCalled();
  });
  it("restaura y convierte TAKEDOWN legado a PUBLISHED", async () => {
    const s = setup({ restore: true, legacyTakedown: true }); const result = await moderateListing(s.input);
    expect(result).toEqual({ status: 200, data: { id: "l1", removedAt: null } });
    expect(s.update).toHaveBeenCalledWith({ removedAt: null, removedReason: null, removedById: null, status: "PUBLISHED" });
    expect(s.audit).toHaveBeenCalledWith("listing.restore"); expect(s.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "PUBLICATION_RESTORED" }));
  });
  it("no restaura si no fue retirada", async () => {
    const s = setup({ restore: true }); expect(await moderateListing(s.input)).toMatchObject({ status: 409, code: "NOT_REMOVED" });
  });
});
