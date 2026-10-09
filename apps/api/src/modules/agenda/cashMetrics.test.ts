import { beforeEach, expect, it, vi } from "vitest";
import { staffMetrics } from "./metrics.js";
import { staffRouter } from "../staff/routes.js";
import { accountRequest } from "../staff/accountFixture.js";
const db = vi.hoisted(() => {
  const m = () => ({ count: vi.fn(), groupBy: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() });
  return { appointment: m(), handoverCase: m(), document: m(), bazarItem: m(), report: m(), payout: m(), user: m() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (role: string) => ({ sub: "worker", role }) }));
beforeEach(() => { vi.clearAllMocks(); for (const m of Object.values(db)) { m.count.mockResolvedValue(0); m.groupBy.mockResolvedValue([]); m.findMany.mockResolvedValue([]); } db.user.findUnique.mockResolvedValue({ role: "moderator" }); });
it("efectivo por trabajador suma monto cobrado y muestra fee/net separados", async () => {
  db.payout.groupBy.mockResolvedValue([{ collectorId: "worker", _sum: { amountCents: 1500, feeCents: 195, netCents: 1305 }, _count: { _all: 1 } }]);
  db.user.findMany.mockResolvedValue([{ id: "worker", email: "worker@unsa.edu.pe", profile: { fullName: "Trabajador" } }]);
  const r = await staffMetrics(new Date("2026-10-09T12:00:00Z"));
  expect(r.cashThisMonthByStaff).toEqual([{ staffId: "worker", name: "Trabajador", collectedCents: 1500, commissionCents: 195, netCents: 1305, count: 1 }]);
  expect(db.payout.groupBy.mock.calls[0][0].where).toEqual({ status: { not: "REFUNDED" }, order: { status: { not: "REFUNDED" }, itemType: "bazar", payMethod: "CASH", verifiedAt: { gte: new Date("2026-10-01T05:00:00Z"), lte: new Date("2026-10-09T12:00:00Z") } } });
});
it("sin cobros no inventa saldos", async () => { expect((await staffMetrics()).cashThisMonthByStaff).toEqual([]); });
it("exmiembro no accede a métricas monetarias", async () => { db.user.findUnique.mockResolvedValue({ role: "student" }); expect((await accountRequest(staffRouter, "GET", "/metrics", "admin")).status).toBe(403); expect(db.payout.groupBy).not.toHaveBeenCalled(); });
it("equipo vigente consulta métricas", async () => { expect((await accountRequest(staffRouter, "GET", "/metrics", "moderator")).status).toBe(200); });
