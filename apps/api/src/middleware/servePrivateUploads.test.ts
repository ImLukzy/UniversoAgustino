import fs from "node:fs";
import path from "node:path";
import type { Request, Response } from "express";
import { afterAll, beforeEach, expect, it, vi } from "vitest";
import { serveUpload } from "./serveUploads.js";
const h = vi.hoisted(() => ({ dir: `/tmp/hub-private-upload-${process.pid}`,
  documentAccessGrant: { findFirst: vi.fn().mockResolvedValue(null) },
  payout: { count: vi.fn().mockResolvedValue(0) }, upload: { findUnique: vi.fn() }, document: { findFirst: vi.fn() }, paymentAccount: { findFirst: vi.fn() }, order: { findFirst: vi.fn().mockResolvedValue(null), count: vi.fn() } }));
vi.mock("../lib/prisma.js", () => ({ prisma: h }));
vi.mock("../lib/storage.js", () => ({ storageConfig: { backend: "local", localDir: h.dir }, hasObject: vi.fn() }));
fs.mkdirSync(h.dir, { recursive: true }); fs.writeFileSync(path.join(h.dir, "qr.png"), "private-fixture");
afterAll(() => { fs.rmSync(h.dir, { recursive: true, force: true }); });
beforeEach(() => {
  vi.clearAllMocks(); h.order.findFirst.mockResolvedValue(null); h.document.findFirst.mockResolvedValue(null);
  h.upload.findUnique.mockResolvedValue({ ownerId: "owner", private: true, detectedMime: "image/png", originalName: "qr.png" });
  h.paymentAccount.findFirst.mockResolvedValue(null); h.order.count.mockResolvedValue(0);
});
function request(user?: { sub: string; role: string }) {
  return new Promise<{ status: number; headers: Record<string, string>; served: boolean }>((resolve, reject) => {
    const headers: Record<string, string> = {}; let status = 200;
    const finish = (served: boolean) => resolve({ status, headers, served });
    const req = { params: { name: "qr.png" }, query: {}, headers: {}, user } as unknown as Request;
    const res = { status(code: number) { status = code; return this; }, setHeader(key: string, value: string) { headers[key] = value; },
      json() { finish(false); }, sendFile() { finish(true); } } as unknown as Response;
    serveUpload(req, res, (error?: unknown) => { if (error) reject(error); });
  });
}
it("URL exacta del QR sigue privada sin token", async () => {
  const r = await request(); expect(r.status).toBe(403); expect(r.served).toBe(false); expect(r.headers["Cache-Control"]).toBe("private, no-store");
});
it("tercero sin pedido no recibe bytes privados", async () => { expect((await request({ sub: "third", role: "student" })).status).toBe(403); });
it("dueño de imagen aún sin cuenta puede previsualizarla con token", async () => {
  const r = await request({ sub: "owner", role: "moderator" }); expect(r.served).toBe(true); expect(r.headers["Cache-Control"]).toBe("private, no-store");
});
it("comprador activo recibe imagen de cuenta activa", async () => {
  h.paymentAccount.findFirst.mockResolvedValue({ id: "account" }); h.order.count.mockResolvedValue(1);
  expect((await request({ sub: "buyer", role: "student" })).served).toBe(true);
});
it("imagen de publicación pública sigue disponible", async () => {
  h.upload.findUnique.mockResolvedValue({ private: false, detectedMime: "image/png", originalName: "qr.png" });
  expect((await request()).served).toBe(true);
});

it("comprador propio recibe bytes de comprobante físico privado con no-store", async () => { h.order.findFirst.mockResolvedValue({ id: "order" }); const r = await request({ sub: "buyer", role: "student" }); expect(r.served).toBe(true); expect(r.headers["Cache-Control"]).toBe("private, no-store"); });
