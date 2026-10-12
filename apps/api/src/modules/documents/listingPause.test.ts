import { expect, it, vi } from "vitest";
import { Router } from "express";
import { registerListing } from "./listing.js";
import { accountRequest } from "../staff/accountFixture.js";

const db = vi.hoisted(() => ({ document: { count: vi.fn(), findMany: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/moderation.js", () => ({ canViewReview: () => true, initialReview: async () => "APPROVED" }));
vi.mock("./access.js", () => ({ fileKind: () => null, hasFullAccess: async () => false }));
vi.mock("../sanctions/guard.js", () => ({ assertNotSuspended: async () => {} }));

it("el catálogo de documentos excluye publicaciones pausadas antes de paginar", async () => {
  db.document.count.mockResolvedValue(0); db.document.findMany.mockResolvedValue([]);
  const router = Router(); router.use((req, _res, next) => { req.query = {}; next(); }); registerListing(router);
  expect((await accountRequest(router, "GET", "/")).status).toBe(200);
  expect(db.document.count).toHaveBeenCalledWith({ where: expect.objectContaining({ pausedAt: null }) });
  expect(db.document.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ pausedAt: null }) }));
});
