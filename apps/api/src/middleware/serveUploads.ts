import path from "node:path";
import fs from "node:fs";
import { Readable } from "node:stream";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "./errors.js";
import { getServeUrl, hasObject, storageConfig } from "../lib/storage.js";

// Sprint 4 (F4-01): servicio controlado de archivos (reemplaza express.static
// directo sobre el directorio de subidas).
//
// Modelo de amenaza documentado: los uploads de este marketplace son
// públicos por diseño (previews, fotos y QRs se renderizan sin login).
// La protección real está en (1) validación por firma al subir, (2) nombres
// UUID imposibles de adivinar, (3) cabeceras defensivas al servir y
// (4) attachment forzado para lo no previsualizable. Las URLs de archivos
// de ítems no publicados nunca se exponen vía API.
export const uploadsDir = storageConfig.localDir;
// En modo s3 el disco local no se usa: no se crea el directorio.
if (storageConfig.backend === "local") fs.mkdirSync(uploadsDir, { recursive: true });

const PREVIEWABLE = new Set(["application/pdf", "image/jpeg", "image/png"]);

function rfc5987(name: string): string {
  return encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, "%2A");
}

function guessLegacyMime(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

export const serveUpload = asyncHandler(async (req, res) => {
  const raw = String(req.params.name ?? "");
  const name = path.basename(raw);
  if (!name || name !== raw || name.includes("..")) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Nombre de archivo inválido" } });
  }

  const rec = await prisma.upload.findUnique({ where: { storedName: name } });
  const mime = rec?.detectedMime ?? guessLegacyMime(name);
  const original = rec?.originalName ?? name;
  const inline = PREVIEWABLE.has(mime);

  // Modo S3 (R2): el bucket es privado; se redirige a una URL prefirmada de
  // 15 min. La URL pública `/uploads/<name>` no cambia (Document.fileUrl y
  // BazarItem.photos siguen intactos).
  if (storageConfig.backend === "s3") {
    if (!(await hasObject(name))) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
    }
    const url = await getServeUrl(name, mime, original, inline);
    // ?stream=1: transmite los bytes por la API (mismo origen efectivo para
    // la web). Lo usa el Visor PDF: evita por completo el fetch cross-origen
    // a R2 (CORS del bucket, preflights de Range, bloqueadores y firmas
    // cacheadas dejan de importar). El Range del cliente se reenvía a R2.
    if (req.query.stream === "1") {
      if (!url) {
        return res.status(502).json({ error: { code: "STORAGE_UPSTREAM", message: "No se pudo leer el archivo" } });
      }
      const range = req.headers.range;
      const upstream = await fetch(url, { headers: range ? { Range: range } : {} });
      if (!upstream.ok && upstream.status !== 206) {
        return res.status(502).json({ error: { code: "STORAGE_UPSTREAM", message: "No se pudo leer el archivo" } });
      }
      res.status(upstream.status === 206 ? 206 : 200);
      for (const h of ["content-type", "content-range", "accept-ranges", "content-length"] as const) {
        const v = upstream.headers.get(h);
        if (v) res.setHeader(h === "content-type" ? "Content-Type" : h.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("-"), v);
      }
      res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${rfc5987(original)}"`);
      // Bytes inmutables por storedName (UUID): cacheables sin riesgo.
      res.setHeader("Cache-Control", "private, max-age=86400");
      if (!upstream.body) return res.end();
      return Readable.fromWeb(upstream.body as unknown as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
    }
    // La Location lleva una firma de 15 min: NUNCA cachear este 302.
    // (Un 302 cacheado reutiliza una firma expirada → R2 responde 403 sin
    // cabeceras CORS y el navegador lo reporta como "CORS error".)
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    return res.redirect(url ?? "/");
  }

  const abs = path.resolve(uploadsDir, name);
  if (!abs.startsWith(path.resolve(uploadsDir) + path.sep)) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Nombre de archivo inválido" } });
  }

  // Nota legado (pre-registro F4-01): sin firma verificada no se puede
  // confiar en el contenido; lo no previsualizable va como descarga forzada.
  // Todo lo nuevo pasa por verifyUpload. Esta rama local conserva el
  // comportamiento previo al dedupe (rec arriba) para no romper listados.
  try {
    await fs.promises.access(abs, fs.constants.R_OK);
  } catch {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
  }
  const disposition = inline ? "inline" : "attachment";
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Disposition", `${disposition}; filename="${rfc5987(original)}"`);
  res.setHeader("Cache-Control", "private, max-age=604800");
  return res.sendFile(abs);
});
