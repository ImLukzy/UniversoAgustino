import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

export const uploadsRouter = Router();

const dir = path.resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "./uploads");
fs.mkdirSync(dir, { recursive: true });

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 25);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`);
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

// Sube un archivo real (PDF/imagen, máx 25 MB). Devuelve { url } servida en /uploads/*.
uploadsRouter.post(
  "/",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const f = (req as unknown as { file?: Express.Multer.File }).file;
    if (!f) return res.status(400).json({ error: { code: "NO_FILE", message: "Adjunte el archivo en el campo 'file'" } });
    res.status(201).json({ data: { url: `/uploads/${f.filename}`, name: f.originalname, size: f.size } });
  })
);

export const uploadsDir = dir;
