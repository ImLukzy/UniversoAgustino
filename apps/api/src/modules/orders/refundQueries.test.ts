import { Router } from "express";
import { beforeEach, expect, it, vi } from "vitest";
import { registerQueries } from "./queries.js";
import { accountRequest } from "../staff/accountFixture.js";
const db = vi.hoisted(() => ({ order: { findMany: vi.fn() }, document: { findMany: vi.fn() }, documentAccessGrant: { findMany: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: () => ({ sub: "buyer", role: "student" }) }));
const router = Router(); registerQueries(router);
const refund = { refundProofUrl: "/uploads/refund.png", refundPaymentRef: "OP123", refundedAt: "2026-10-09T00:00:00Z" };
beforeEach(() => {
  vi.clearAllMocks(); db.order.findMany.mockResolvedValue([{ id: "o", status: "REFUNDED", itemType: "document", itemId: "doc", payout: refund }]);
  db.documentAccessGrant.findMany.mockResolvedValue([{ documentId: "doc", fileUrl: "/uploads/rebought.pdf" }]); db.document.findMany.mockResolvedValue([]);
});
it("Mis pedidos expone comprobante del comprador pero no descarga del pedido reembolsado", async () => {
  const r = await accountRequest(router, "GET", "/mine", "student");
  expect(r.status).toBe(200); expect(r.body.data).toEqual([expect.objectContaining({ refund, fileUrl: null })]);
  expect(db.order.findMany.mock.calls[0][0].where).toEqual({ buyerId: "buyer" });
});
it("consulta solo grants activos y selecciona campos mínimos de devolución", async () => {
  await accountRequest(router, "GET", "/mine", "student");
  expect(db.documentAccessGrant.findMany.mock.calls[0][0].where).toEqual({ buyerId: "buyer", revokedAt: null });
  expect(db.order.findMany.mock.calls[0][0].include.payout.select).toEqual({ refundProofUrl: true, refundPaymentRef: true, refundedAt: true });
});
it("anónimo no recibe comprobantes", async () => { expect((await accountRequest(router, "GET", "/mine")).status).toBe(401); expect(db.order.findMany).not.toHaveBeenCalled(); });
