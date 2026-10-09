import { Router } from "express";
import { beforeEach, expect, it, vi } from "vitest";
import { bazarRouter } from "./routes.js";
import { accountRequest } from "../staff/accountFixture.js";
const db = vi.hoisted(() => ({ bazarItem: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: () => ({ sub: "seller", role: "creator" }) }));
vi.mock("../../lib/moderation.js", () => ({ initialReview: async () => "PENDING", canViewReview: () => false, resubmitReview: () => ({}) }));
vi.mock("../sanctions/guard.js", () => ({ assertNotSuspended: async () => {} }));
beforeEach(() => { vi.clearAllMocks(); db.bazarItem.create.mockImplementation(async ({ data }) => ({ id: "apunte", ...data })); db.bazarItem.findMany.mockResolvedValue([]); db.bazarItem.count.mockResolvedValue(0); });
it("publica APUNTE físico pasando por moderación", async () => { const r = await accountRequest(bazarRouter, "POST", "/", "creator", { title: "Apunte físico", kind: "APUNTE", tx: "VENTA", priceCents: 1500, payMethod: "PLIN" }); expect(r.status).toBe(201); expect(r.body.data).toMatchObject({ kind: "APUNTE", sellerId: "seller", reviewStatus: "PENDING" }); });
it("filtra APUNTE en servidor antes de paginar", async () => {
  const r = Router(); r.use((req, _res, next) => { req.query = { kind: "APUNTE", page: "2" }; next(); }); r.use(bazarRouter);
  expect((await accountRequest(r, "GET", "/")).status).toBe(200); expect(db.bazarItem.findMany.mock.calls[0][0]).toMatchObject({ where: { kind: "APUNTE", status: "AVAILABLE", reviewStatus: "APPROVED" }, skip: 12, take: 12 });
});
