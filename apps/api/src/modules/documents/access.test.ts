import fs from "node:fs";
import path from "node:path";
import type { AddressInfo } from "node:net";
import express from "express";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Spec 15 (T7): paywall del archivo en el servidor, vista previa y detalle sin fileUrl.
const h = vi.hoisted(() => {
  const dir = `${process.env.TEMP ?? process.env.TMPDIR ?? "/tmp"}/hub-access-${process.pid}`;
  const PDF = "11111111-2222-4333-8444-555555555555.pdf";
  const doc = { id: "doc1", authorId: "author", priceCents: 500, fileUrl: `/uploads/${PDF}`, title: "PAE", author: null, previewPages: [2, 4] };
  // "declarer" solo autodeclaró el pago (PAID): no debe desbloquear (spec 16).
  const orders = [
    { buyerId: "buyer", status: "ESCROW" },
    { buyerId: "declarer", status: "PAID" },
  ];
  return { dir, PDF, doc, orders };
});

vi.mock("../../lib/storage.js", async () => {
  const fsp = await import("node:fs/promises");
  const p = await import("node:path");
  return {
    storageConfig: { backend: "local", localDir: h.dir },
    hasObject: async () => true,
    getServeUrl: async () => null,
    readObject: async (name: string) => fsp.readFile(p.join(h.dir, name)).catch(() => null),
  };
});

vi.mock("../../lib/auth.js", () => ({
  verifyAccess: (t: string) => ({ sub: t, role: "student" }),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    document: {
      findFirst: async ({ where }: { where: { fileUrl: { endsWith: string } } }) => (h.doc.fileUrl.endsWith(where.fileUrl.endsWith) ? h.doc : null),
      findUnique: async () => h.doc,
    },
    order: {
      count: async ({ where }: { where: { buyerId: string; status: { in: string[] } } }) =>
        h.orders.filter((o) => o.buyerId === where.buyerId && where.status.in.includes(o.status)).length,
    },
    upload: { findUnique: async () => ({ detectedMime: "application/pdf", originalName: "pae.pdf" }) },
    savedDocument: { count: async () => 0 },
  },
}));

const { serveUpload } = await import("../../middleware/serveUploads.js");
const { optionalAuth } = await import("../../middleware/auth.js");
const { documentsRouter } = await import("./routes.js");

let base = "";
let close = () => {};

beforeAll(async () => {
  fs.mkdirSync(h.dir, { recursive: true });
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 5; i++) pdf.addPage([200, 280]);
  fs.writeFileSync(path.join(h.dir, h.PDF), await pdf.save());
  const app = express();
  app.use("/documents", documentsRouter);
  app.get("/uploads/:name", optionalAuth, serveUpload);
  const server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => server.close();
});

afterAll(() => {
  close();
  fs.rmSync(h.dir, { recursive: true, force: true });
});

const as = (who?: string, extra: Record<string, string> = {}) => ({ headers: { ...(who ? { Authorization: `Bearer ${who}` } : {}), ...extra } });

describe("GET /uploads/:name de un documento de pago (A12)", () => {
  it("sin sesión → 403 PAYWALL", async () => {
    const r = await fetch(`${base}/uploads/${h.PDF}?stream=1`, as());
    expect(r.status).toBe(403);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe("PAYWALL");
  });

  it("usuario sin pedido → 403", async () => {
    expect((await fetch(`${base}/uploads/${h.PDF}?stream=1`, as("otro"))).status).toBe(403);
  });

  it("pago solo declarado (PAID) → 403", async () => {
    expect((await fetch(`${base}/uploads/${h.PDF}?stream=1`, as("declarer"))).status).toBe(403);
  });

  it("comprador con pago verificado (ESCROW) → 200, y 206 con Range", async () => {
    expect((await fetch(`${base}/uploads/${h.PDF}?stream=1`, as("buyer"))).status).toBe(200);
    expect((await fetch(`${base}/uploads/${h.PDF}?stream=1`, as("buyer", { Range: "bytes=0-99" }))).status).toBe(206);
  });

  it("autor → 200", async () => {
    expect((await fetch(`${base}/uploads/${h.PDF}`, as("author"))).status).toBe(200);
  });
});

describe("GET /documents/:id/preview (A13)", () => {
  it("devuelve solo las páginas de muestra elegidas (spec 16)", async () => {
    const r = await fetch(`${base}/documents/doc1/preview`);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    expect(r.headers.get("cache-control")).toContain("private");
    const pdf = await PDFDocument.load(new Uint8Array(await r.arrayBuffer()));
    expect(pdf.getPageCount()).toBe(2);
    expect(r.headers.get("x-preview-pages")).toBe("2,4");
    expect(r.headers.get("x-total-pages")).toBe("5");
  });

  it("ignora páginas fuera del documento y cae a la 1 si no queda ninguna", async () => {
    const prev = h.doc.previewPages;
    h.doc.previewPages = [9, 12];
    try {
      const r = await fetch(`${base}/documents/doc1/preview`);
      expect(r.headers.get("x-preview-pages")).toBe("1");
    } finally {
      h.doc.previewPages = prev;
    }
  });
});

// Filas antiguas guardan la URL absoluta: el paywall y la vista previa deben reconocerla igual.
describe("fileUrl absoluta (http://host/uploads/<name>)", () => {
  it("paywall 403 sin sesión y vista previa 200", async () => {
    const rel = h.doc.fileUrl;
    h.doc.fileUrl = `http://localhost:4000${rel}`;
    try {
      expect((await fetch(`${base}/uploads/${h.PDF}?stream=1`, as())).status).toBe(403);
      expect((await fetch(`${base}/documents/doc1/preview`)).status).toBe(200);
    } finally {
      h.doc.fileUrl = rel;
    }
  });
});

describe("GET /documents/:id (A14)", () => {
  it("sin acceso no incluye fileUrl", async () => {
    const { data } = (await (await fetch(`${base}/documents/doc1`)).json()) as { data: Record<string, unknown> };
    expect(data.fullAccess).toBe(false);
    expect(data).not.toHaveProperty("fileUrl");
    expect(data.fileType).toBe("pdf");
  });

  it("el comprador sí recibe fileUrl", async () => {
    const { data } = (await (await fetch(`${base}/documents/doc1`, as("buyer"))).json()) as { data: Record<string, unknown> };
    expect(data.fullAccess).toBe(true);
    expect(data.fileUrl).toBe(h.doc.fileUrl);
  });
});
