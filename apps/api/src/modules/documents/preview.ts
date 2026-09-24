import type { Router } from "express";
import { PDFDocument } from "pdf-lib";
import { DEFAULT_PREVIEW_PAGES } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { readObject } from "../../lib/storage.js";
import { asyncHandler } from "../../middleware/errors.js";
import { fileKind, storedNameOf } from "./access.js";

const CACHE_MAX = 50;

export interface Preview {
  pdf: Buffer;
  // Páginas reales (1-based) incluidas, en el orden del PDF de muestra.
  pages: number[];
  total: number;
}

// Vista previa por storedName (UUID inmutable) + páginas: se genera una sola vez.
const cache = new Map<string, Preview>();

// PDF nuevo solo con las páginas de muestra (spec 16): el resto nunca sale
// del servidor. Páginas fuera del documento se ignoran; si ninguna existe,
// cae a la primera para que la tarjeta siempre tenga portada.
export async function pickPages(bytes: Uint8Array, wanted: readonly number[] = DEFAULT_PREVIEW_PAGES): Promise<Preview> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = src.getPageCount();
  let pages = [...new Set(wanted)].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  if (!pages.length) pages = [1];
  const out = await PDFDocument.create();
  for (const page of await out.copyPages(src, pages.map((p) => p - 1))) out.addPage(page);
  return { pdf: Buffer.from(await out.save()), pages, total };
}

async function cachedPreview(name: string, wanted: readonly number[]): Promise<Preview | null> {
  const key = `${name}#${wanted.join(",")}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const raw = await readObject(name);
  if (!raw) return null;
  const preview = await pickPages(raw, wanted);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, preview);
  return preview;
}

// GET /documents/:id/preview (spec 15 T7 + spec 16): las páginas de muestra
// del PDF, o la imagen tal cual (una imagen es una sola "página").
// X-Preview-Pages / X-Total-Pages permiten al Visor cubrir el resto.
export function registerPreview(router: Router) {
  router.get(
    "/:id/preview",
    asyncHandler(async (req, res) => {
      const doc = await prisma.document.findUnique({ where: { id: req.params.id }, select: { fileUrl: true, previewPages: true } });
      const name = storedNameOf(doc?.fileUrl ?? null);
      const kind = fileKind(doc?.fileUrl ?? null);
      if (!doc || !name || !kind) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Sin vista previa" } });
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.setHeader("Content-Disposition", "inline");
      if (kind === "image") {
        const img = await readObject(name);
        if (!img) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
        res.setHeader("Content-Type", /\.png$/i.test(name) ? "image/png" : "image/jpeg");
        return res.send(img);
      }
      const preview = await cachedPreview(name, doc.previewPages.length ? doc.previewPages : DEFAULT_PREVIEW_PAGES);
      if (!preview) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("X-Preview-Pages", preview.pages.join(","));
      res.setHeader("X-Total-Pages", String(preview.total));
      return res.send(preview.pdf);
    })
  );
}
