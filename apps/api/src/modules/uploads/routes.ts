import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { sanitizeFilename, sha256File, verifyUpload } from "../../lib/fileSignature.js";
import { putObject, storageConfig, tmpDir } from "../../lib/storage.js";
import { prisma } from "../../lib/prisma.js";

export const uploadsRouter = Router();

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);

const storage = multer.diskStorage({
  // En modo disco el temporal vive junto al destino final; en modo s3 en el
  // tmp del SO (el objeto definitivo viaja al bucket tras verificar firma).
  destination: (_req, _file, cb) => cb(null, tmpDir()),
  // Nombre temporal: el definitivo (UUID) se decide tras verificar la firma.
  filename: (_req, _file, cb) => {
    cb(null, `tmp-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`);
  },
});

const ALLOWED = new Set([".pdf", ".jpg", ".jpeg", ".png", ".epub"]);

const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) return cb(new Error(`Tipo no permitido (${ext}). Solo: pdf, jpg, png, epub`));
    cb(null, true);
  },
});

// Sube un archivo real (PDF/imagen/EPUB, máx 25 MB). Sprint 4 (F4-01):
// verifica firma mágica, renombra a UUID, deduplica por checksum+dueño y
// registra en BD. Devuelve { url, name, size, mime }.
uploadsRouter.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const f = (req as unknown as { file?: Express.Multer.File }).file;
    if (!f) return res.status(400).json({ error: { code: "VALIDATION", message: "Adjunte el archivo en el campo 'file'" } });
    const tmp = f.path;
    try {
      const detectedMime = await verifyUpload(tmp, f.originalname);
      const checksum = await sha256File(tmp);

      // Deduplicación: mismo dueño + mismo contenido reutiliza el registro.
      const existing = await prisma.upload.findFirst({
        where: { ownerId: req.user!.sub, checksum },
        select: { storedName: true, originalName: true, bytes: true, detectedMime: true },
      });
      if (existing) {
        await fs.promises.unlink(tmp).catch(() => {});
        return res.status(201).json({
          data: {
            url: `/uploads/${existing.storedName}`,
            name: existing.originalName,
            size: existing.bytes,
            mime: existing.detectedMime,
          },
        });
      }

      const ext = path.extname(f.originalname).toLowerCase();
      const stored = `${crypto.randomUUID()}${ext}`;
      if (storageConfig.backend === "s3") {
        await putObject(stored, await fs.promises.readFile(tmp), detectedMime);
        await fs.promises.unlink(tmp).catch(() => {});
      } else {
        await fs.promises.rename(tmp, path.join(tmpDir(), stored));
      }
      const record = await prisma.upload.create({
        data: {
          ownerId: req.user!.sub,
          storedName: stored,
          originalName: sanitizeFilename(f.originalname),
          bytes: f.size,
          detectedMime,
          checksum,
        },
      });
      return res.status(201).json({
        data: { url: `/uploads/${record.storedName}`, name: record.originalName, size: record.bytes, mime: record.detectedMime },
      });
    } catch (e) {
      await fs.promises.unlink(tmp).catch(() => {});
      throw e;
    }
  })
);
