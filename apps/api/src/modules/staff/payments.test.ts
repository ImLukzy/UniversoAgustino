import { beforeEach, expect, it, vi } from "vitest";
import { staffRouter } from "./routes.js";
import { accountRequest } from "./accountFixture.js";
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn() }, order: { findMany: vi.fn() }, document: { findMany: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (role: string) => ({ sub: "worker", role }) }));
beforeEach(() => { vi.clearAllMocks(); db.user.findUnique.mockResolvedValue({ role: "moderator" }); db.order.findMany.mockResolvedValue([]); db.document.findMany.mockResolvedValue([]); });
it("anónimo no lista comprobantes", async () => { expect((await accountRequest(staffRouter, "GET", "/payments")).status).toBe(401); });
it("estudiante no lista comprobantes", async () => { expect((await accountRequest(staffRouter, "GET", "/payments", "student")).status).toBe(403); expect(db.order.findMany).not.toHaveBeenCalled(); });
it("trabajador ve solo pagos pendientes de su cuenta", async () => {
  expect((await accountRequest(staffRouter, "GET", "/payments", "moderator")).status).toBe(200);
  expect(db.order.findMany.mock.calls[0][0].where).toEqual({ itemType: "document", status: "PAID", verifiedAt: null, paymentRejectedReason: null, paymentAccountId: { not: null }, paymentAccount: { userId: "worker" } });
});
it("técnico ve cola global", async () => {
  db.user.findUnique.mockResolvedValue({ role: "admin" }); await accountRequest(staffRouter, "GET", "/payments", "admin");
  expect(db.order.findMany.mock.calls[0][0].where).not.toHaveProperty("paymentAccount");
});
it("denegación requiere motivo antes de mutar", async () => {
  expect((await accountRequest(staffRouter, "POST", "/payments/order/deny", "moderator", { reason: " " })).status).toBe(400); expect(db.order.findMany).not.toHaveBeenCalled();
});
it("token de exmiembro no permite listar", async () => {
  db.user.findUnique.mockResolvedValue({ role: "creator" }); expect((await accountRequest(staffRouter, "GET", "/payments", "admin")).status).toBe(403); expect(db.order.findMany).not.toHaveBeenCalled();
});
