import path from "node:path";
import fs from "node:fs";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "./errors.js";

// Sprint 4 (F4-01): servicio controlado de archivos (reemplaza express.static
// directo sobre el directorio de subidas).
//
// Modelo de amenaza documentado: los uploads de este marketplace son
// públicos por diseño (previews, fotos y QRs se renderizan sin login).
// La protección real está en (1) validación por firma al subir, (2) nombres
// UUID imposibles de adivinar, (3) cabeceras defensivas al servir y
// (4) attachment forzado para lo no previsualizable. Las URLs de archivos
// de ítems no publicados nunca se exponen vía API.
export const uploadsDir = path.resolve(
  process.cwd(),
  process.env.STORAGE_LOCAL_DIR ?? "./uploads",
);
fs.mkdirSync(uploadsDir, { recursive: true });

const PREVIEWABLE = new Set(["application/pdf", "image/jpeg", "image/png"]);

function rfc5987(name: string): string {
  return encodeURIComponent(name).replace(/['()]/g, escape).replace(/\*/g, "%2A");
}

export const serveUpload = asyncHandler(async (req, res) => {
  const raw = String(req.params.name ?? "");
  const name = path.basename(raw);
  if (!name || name !== raw || name.includes("..")) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Nombre de archivo inválido" } });
  }
  const abs = path.resolve(uploadsDir, name);
  if (!abs.startsWith(path.resolve(uploadsDir) + path.sep)) {
    return res.status(400).json({ error: { code: "VALIDATION", message: "Nombre de archivo inválido" } });
  }

  const rec = await prisma.upload.findUnique({ where: { storedName: name } });
  if (!rec) {
    // Legado (pre-registro F4-01): sin firma verificada no se puede confiar
    // en el contenido. Las imágenes/PDF legados se sirven inline para no
    // romper listados existentes (<img> no renderiza attachment); el resto
    // va como descarga forzada. Todo lo nuevo pasa por verifyUpload.
    try {
      await fs.promises.access(abs, fs.constants.R_OK);
    } catch {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
    }
    const ext = path.extname(name).toLowerCase();
    const legacyMime =
      ext === ".png" ? "image/png"
      : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : ext === ".pdf" ? "application/pdf"
      : "application/octet-stream";
    const legacyDisposition = legacyMime === "application/octet-stream" ? "attachment" : "inline";
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", legacyMime);
    res.setHeader("Content-Disposition", `${legacyDisposition}; filename="${rfc5987(name)}"`);
    res.setHeader("Cache-Control", "private, max-age=604800");
    return res.sendFile(abs);
  }

  try {
    await fs.promises.access(abs, fs.constants.R_OK);
  } catch {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
  }
  const disposition = PREVIEWABLE.has(rec.detectedMime) ? "inline" : "attachment";
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Type", rec.detectedMime);
  res.setHeader("Content-Disposition", `${disposition}; filename="${rfc5987(rec.originalName)}"`);
  res.setHeader("Cache-Control", "private, max-age=604800");
  return res.sendFile(abs);
});
