import { Router } from "express";
import { beforeEach, expect, it, vi } from "vitest";
import { staffRouter } from "../staff/routes.js";
import { sellerPayoutsRouter } from "./sellerRoutes.js";
import { accountRequest } from "../staff/accountFixture.js";
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn(), findMany: vi.fn() }, payout: { findMany: vi.fn(), groupBy: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (role: string) => ({ sub: "actor", role }) }));
function request(router: Router, path: string, role?: string) {
  const r = Router(); r.use((req, _res, next) => { req.query = Object.fromEntries(new URLSearchParams(req.url.split("?")[1])); next(); }); r.use(router);
  return accountRequest(r, "GET", path, role);
}
beforeEach(() => { vi.clearAllMocks(); db.user.findUnique.mockResolvedValue({ role: "moderator" }); db.payout.findMany.mockResolvedValue([]); db.payout.groupBy.mockResolvedValue([]); db.user.findMany.mockResolvedValue([]); });
it("anónimo no lista liquidaciones del equipo", async () => { expect((await request(staffRouter, "/payouts")).status).toBe(401); });
it("estudiante no lista liquidaciones del equipo", async () => { expect((await request(staffRouter, "/payouts", "student")).status).toBe(403); });
it("cobrador solo ve sus pendientes", async () => { expect((await request(staffRouter, "/payouts", "moderator")).status).toBe(200); expect(db.payout.findMany.mock.calls[0][0].where).toEqual({ status: "PENDING", collectorId: "actor" }); });
it("Técnico ve global y estado completado", async () => { db.user.findUnique.mockResolvedValue({ role: "admin" }); await request(staffRouter, "/payouts?status=COMPLETED", "admin"); expect(db.payout.findMany.mock.calls[0][0].where).toEqual({ status: "COMPLETED" }); expect(db.payout.findMany.mock.calls[0][0].orderBy[0]).toEqual({ completedAt: "desc" }); });
it("token revocado no lista", async () => { db.user.findUnique.mockResolvedValue({ role: "student" }); expect((await request(staffRouter, "/payouts", "admin")).status).toBe(403); expect(db.payout.findMany).not.toHaveBeenCalled(); });
it("página inválida no consulta", async () => { expect((await request(staffRouter, "/payouts?page=-1", "moderator")).status).toBe(400); expect(db.payout.findMany).not.toHaveBeenCalled(); });
it("pagina51 identifica siguiente página", async () => { db.payout.findMany.mockResolvedValue(Array.from({ length: 51 }, (_, i) => ({ id: String(i) }))); const r = await request(staffRouter, "/payouts?page=2", "moderator"); expect(r.body.data).toHaveLength(50); expect(r.body).toHaveProperty("nextPage", 3); expect(db.payout.findMany.mock.calls[0][0].skip).toBe(50); });
it("Mis cobros exige sesión", async () => { expect((await request(sellerPayoutsRouter, "/")).status).toBe(401); });
it("Mis cobros consulta solo vendedor actual y oculta cuentas/comprador", async () => { expect((await request(sellerPayoutsRouter, "/", "creator")).status).toBe(200); const query = db.payout.findMany.mock.calls[0][0]; expect(query.where).toEqual({ sellerId: "actor" }); expect(query.select.proofUrl).toBe(true); expect(query.select).not.toHaveProperty("payDetail"); expect(query.select).not.toHaveProperty("collectorId"); expect(query.select.order.select).not.toHaveProperty("buyer"); });
const period = "?from=2026-10-01T00:00:00Z&to=2026-11-01T00:00:00Z";
it("ganancias suma solo comisión verificada, no precio/neto", async () => {
  db.payout.groupBy.mockResolvedValue([{ collectorId: "actor", _sum: { feeCents: 195 }, _count: { _all: 1 } }]);
  const r = await request(staffRouter, "/payouts/earnings" + period, "moderator"); expect(r.body.data).toMatchObject({ commissionCents: 195, verifiedCount: 1 });
  const query = db.payout.groupBy.mock.calls[0][0]; expect(query._sum).toEqual({ feeCents: true }); expect(query.where).toEqual({ collectorId: "actor", status: { not: "REFUNDED" }, order: { status: { not: "REFUNDED" }, verifiedAt: { gte: new Date("2026-10-01T00:00:00Z"), lt: new Date("2026-11-01T00:00:00Z") } } });
});
it("ganancias globales solo Técnico", async () => { db.user.findUnique.mockResolvedValue({ role: "admin" }); await request(staffRouter, "/payouts/earnings" + period, "admin"); expect(db.payout.groupBy.mock.calls[0][0].where).not.toHaveProperty("collectorId"); });
it("periodo ausente no agrega", async () => { expect((await request(staffRouter, "/payouts/earnings", "moderator")).status).toBe(400); expect(db.payout.groupBy).not.toHaveBeenCalled(); });

it("ganancias excluyen tanto Order como Payout reembolsados", async () => {
  await request(staffRouter, "/payouts/earnings" + period, "moderator");
  const q = db.payout.groupBy.mock.calls[0][0].where;
  expect(q.status).toEqual({ not: "REFUNDED" }); expect(q.order.status).toEqual({ not: "REFUNDED" });
});
it("Mis cobros no expone comprobante del reembolso ni operación comprador", async () => {
  await request(sellerPayoutsRouter, "/", "creator");
  expect(db.payout.findMany.mock.calls[0][0].select).not.toHaveProperty("refundProofUrl");
  expect(db.payout.findMany.mock.calls[0][0].select).not.toHaveProperty("refundPaymentRef");
});
