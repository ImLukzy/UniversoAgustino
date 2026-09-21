import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { sanitizeFilename, sha256File, verifyUpload } from "./fileSignature.js";

const tmp: string[] = [];
afterEach(async () => {
  await Promise.all(tmp.splice(0).map((f) => fs.promises.unlink(f).catch(() => {})));
});

async function tempFile(bytes: Uint8Array, ext: string): Promise<string> {
  const p = path.join(os.tmpdir(), `f4test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  await fs.promises.writeFile(p, bytes);
  tmp.push(p);
  return p;
}

describe("verifyUpload", () => {
  it("acepta PNG real", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await expect(verifyUpload(await tempFile(png, ".png"), "foto.png")).resolves.toBe("image/png");
  });

  it("acepta JPEG con SOI/EOI", async () => {
    const f = await tempFile(new Uint8Array([0xff, 0xd8, 0x00, 0x01, 0xff, 0xd9]), ".jpg");
    await expect(verifyUpload(f, "foto.jpg")).resolves.toBe("image/jpeg");
  });

  it("rechaza exe renombrado a jpg con 415", async () => {
    const f = await tempFile(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), ".jpg");
    await expect(verifyUpload(f, "malware.jpg")).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza jpg truncado (sin EOI) con 415", async () => {
    const f = await tempFile(new Uint8Array([0xff, 0xd8, 0x00]), ".jpg");
    await expect(verifyUpload(f, "corto.jpg")).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza pdf falso y epub sin mimetype con 415", async () => {
    const fakePdf = await tempFile(new TextEncoder().encode("hola mundo"), ".pdf");
    await expect(verifyUpload(fakePdf, "doc.pdf")).rejects.toMatchObject({ status: 415 });
    const fakeEpub = await tempFile(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00]), ".epub");
    await expect(verifyUpload(fakeEpub, "libro.epub")).rejects.toMatchObject({ status: 415 });
  });

  it("rechaza archivo vacío con 400", async () => {
    const f = await tempFile(new Uint8Array([]), ".pdf");
    await expect(verifyUpload(f, "vacio.pdf")).rejects.toMatchObject({ status: 400 });
  });
});

describe("sha256File + sanitizeFilename", () => {
  it("checksum estable y saneado anti path-traversal", async () => {
    const f = await tempFile(new TextEncoder().encode("abc"), ".txt");
    const h1 = await sha256File(f);
    const h2 = await sha256File(f);
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(sanitizeFilename("../../etc/passwd.jpg")).toBe("passwd.jpg");
    expect(sanitizeFilename("")).toBe("archivo");
  });
});
