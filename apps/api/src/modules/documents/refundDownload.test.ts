import { Router } from "express";
import { beforeEach, expect, it, vi } from "vitest";
import { accountRequest } from "../staff/accountFixture.js";
import { registerDownload } from "./download.js";
const db = vi.hoisted(() => ({ document: { findUnique: vi.fn() }, documentAccessGrant: { count: vi.fn(), findFirst: vi.fn() }, order: { count: vi.fn() }, read: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: () => ({ sub: "buyer", role: "student" }) }));
vi.mock("../../lib/storage.js", () => ({ readObject: db.read }));
const router = Router(); registerDownload(router);
beforeEach(() => {
  vi.resetAllMocks(); db.document.findUnique.mockResolvedValue({ id: "doc", authorId: "seller", priceCents: 1500, fileUrl: "/uploads/new.jpg" });
  db.documentAccessGrant.count.mockResolvedValue(0); db.order.count.mockResolvedValue(0);
});
it("apunte reembolsado devuelve PAYWALL sin leer archivo", async () => {
  const r = await accountRequest(router, "GET", "/doc/download", "student");
  expect(r.status).toBe(403); expect(r.body.error?.code).toBe("PAYWALL"); expect(db.read).not.toHaveBeenCalled();
  expect(db.documentAccessGrant.count.mock.calls[0][0].where.revokedAt).toBeNull();
});
it("nuevo acceso activo tras recompra descarga su snapshot, no el revocado", async () => {
  db.documentAccessGrant.count.mockResolvedValue(1); db.documentAccessGrant.findFirst.mockResolvedValue({ fileUrl: "/uploads/repurchase.jpg" }); db.read.mockResolvedValue(Buffer.from("image"));
  expect((await accountRequest(router, "GET", "/doc/download", "student")).status).toBe(200);
  expect(db.documentAccessGrant.findFirst.mock.calls[0][0].where).toEqual({ buyerId: "buyer", documentId: "doc", revokedAt: null });
  expect(db.read).toHaveBeenCalledWith("repurchase.jpg");
});
it("descarga de reembolso sigue requiriendo sesión", async () => { expect((await accountRequest(router, "GET", "/doc/download")).status).toBe(401); expect(db.read).not.toHaveBeenCalled(); });
