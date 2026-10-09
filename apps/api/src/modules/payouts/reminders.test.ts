import { beforeEach, expect, it, vi } from "vitest";
import { sendPayoutReminders } from "./reminders.js";
const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), payout: { findMany: vi.fn(), update: vi.fn() }, notification: { create: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: { $transaction: async (fn: (tx: typeof db) => Promise<unknown>) => fn(db) } }));
beforeEach(() => { vi.clearAllMocks(); db.payout.findMany.mockResolvedValue([]); });
it("cola incluye próximos6h y vencidos sin marca; excluye congelados/completados", async () => {
  const now = new Date("2026-10-09T10:00:00Z"); await sendPayoutReminders(now);
  expect(db.payout.findMany.mock.calls[0][0].where).toEqual({ status: "PENDING", reminderSentAt: null, dueAt: { lte: new Date("2026-10-09T16:00:00Z") } });
  expect(db.notification.create).not.toHaveBeenCalled(); expect(db.$queryRaw).toHaveBeenCalledTimes(1);
});
it("marca y crea aviso atómicamente para evitar duplicados", async () => {
  db.payout.findMany.mockResolvedValue([{ id: "payout", collectorId: "worker", netCents: 1305, dueAt: new Date("2026-10-09T10:00:00Z") }]);
  const now = new Date(); expect((await sendPayoutReminders(now)).length).toBe(1);
  expect(db.payout.update).toHaveBeenCalledWith({ where: { id: "payout" }, data: { reminderSentAt: now } });
  expect(db.notification.create.mock.calls[0][0].data).toMatchObject({ userId: "worker", type: "PAYOUT_DUE", link: "/equipo?tab=liquidaciones" });
});
it("fallo de marca no crea aviso", async () => {
  db.payout.findMany.mockResolvedValue([{ id: "payout" }]); db.payout.update.mockRejectedValueOnce(new Error("db"));
  await expect(sendPayoutReminders()).rejects.toThrow("db"); expect(db.notification.create).not.toHaveBeenCalled();
});
