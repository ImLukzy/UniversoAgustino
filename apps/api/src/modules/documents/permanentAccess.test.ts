import { beforeEach, expect, it, vi } from "vitest";
import { hasFullAccess, paidDocumentFor } from "./access.js";
const db = vi.hoisted(() => ({ documentAccessGrant: { count: vi.fn(), findFirst: vi.fn() }, order: { count: vi.fn() }, document: { findFirst: vi.fn() } }));
vi.mock("../../lib/prisma.js", () => ({ prisma: db }));
const doc = { id: "doc", authorId: "seller", priceCents: 1000 };
beforeEach(() => { vi.clearAllMocks(); db.documentAccessGrant.count.mockResolvedValue(0); db.documentAccessGrant.findFirst.mockResolvedValue(null); db.order.count.mockResolvedValue(0); db.document.findFirst.mockResolvedValue(null); });
it("PAID sin verificación no desbloquea", async () => { expect(await hasFullAccess(doc, { sub: "buyer", role: "student" })).toBe(false); });
it.each(["ESCROW", "RELEASED", "REFUNDED", "CANCELLED"])("derecho permanente no depende del estado %s ni de la liquidación", async (status) => {
  db.documentAccessGrant.count.mockResolvedValue(1); db.order.count.mockResolvedValue(status === "ESCROW" ? 1 : 0);
  expect(await hasFullAccess(doc, { sub: "buyer", role: "student" })).toBe(true);
  expect(db.order.count).not.toHaveBeenCalled();
  expect(db.documentAccessGrant.count).toHaveBeenCalledWith({ where: { buyerId: "buyer", documentId: "doc", revokedAt: null } });
});
it("tercero no obtiene derecho de otro comprador", async () => {
  expect(await hasFullAccess(doc, { sub: "third", role: "student" })).toBe(false);
  expect(db.documentAccessGrant.count.mock.calls[0][0].where.buyerId).toBe("third");
});
it("conserva acceso legado verificado", async () => { db.order.count.mockResolvedValue(1); expect(await hasFullAccess(doc, { sub: "legacy", role: "student" })).toBe(true); });
it("archivo original de una compra sigue protegido después de reemplazar PDF", async () => {
  db.documentAccessGrant.findFirst.mockResolvedValue({ documentId: "doc", authorId: "seller" });
  expect(await paidDocumentFor("old.pdf")).toEqual({ id: "doc", authorId: "seller", priceCents: 1 });
  expect(db.documentAccessGrant.findFirst.mock.calls[0][0].where.fileUrl.endsWith).toBe("/uploads/old.pdf");
});
it("documento actualmente gratis conserva descarga pública de su archivo actual", async () => {
  db.document.findFirst.mockResolvedValue({ ...doc, priceCents: 0 });
  expect(await paidDocumentFor("free.pdf")).toBeNull(); expect(db.documentAccessGrant.findFirst).not.toHaveBeenCalled();
});

it("revocado no concede acceso aunque el snapshot siga protegido", async () => {
  expect(await hasFullAccess({ id: "doc", authorId: "seller", priceCents: 1500 }, { sub: "buyer", role: "student" })).toBe(false);
  expect(db.documentAccessGrant.count.mock.calls[0][0].where.revokedAt).toBeNull();
  expect(db.order.count.mock.calls[0][0].where.status.in).not.toContain("REFUNDED");
  db.documentAccessGrant.findFirst.mockResolvedValue({ documentId: "doc", authorId: "seller", revokedAt: new Date() });
  expect(await paidDocumentFor("old.pdf")).toEqual({ id: "doc", authorId: "seller", priceCents: 1 });
});
