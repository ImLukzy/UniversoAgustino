import type { Router } from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "../../lib/prisma.js";
import { readObject } from "../../lib/storage.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { hasFullAccess, storedNameOf } from "./access.js";

export async function watermarkDownload(bytes: Uint8Array, email: string) {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const text = `Uso personal: ${email.replace(/[^ -~]/g, "?")}`;
  for (const page of pdf.getPages()) {
    const size = Math.min(10, (page.getWidth() - 24) / Math.max(1, font.widthOfTextAtSize(text, 1)));
    page.drawText(text, { x: 12, y: 12, size: Math.max(2, size), font, color: rgb(0.35, 0.35, 0.35), opacity: 0.7 });
  }
  return Buffer.from(await pdf.save());
}
export function registerDownload(router: Router) {
  router.get("/:id/download", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Apunte no encontrado" } });
    if (!await hasFullAccess(doc, req.user)) return res.status(403).json({ error: { code: "PAYWALL", message: "El equipo debe verificar tu pago primero" } });
    const grant = await prisma.documentAccessGrant.findUnique({ where: { buyerId_documentId: { buyerId: req.user!.sub, documentId: doc.id } } });
    const name = storedNameOf(grant?.fileUrl ?? doc.fileUrl);
    const bytes = name ? await readObject(name) : null;
    if (!name || !bytes) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Archivo no encontrado" } });
    const pdf = /\.pdf$/i.test(name);
    const user = pdf ? await prisma.user.findUnique({ where: { id: req.user!.sub }, select: { email: true } }) : null;
    const file = pdf && user ? await watermarkDownload(bytes, user.email).catch(() => bytes) : bytes;
    res.setHeader("Cache-Control", "private, no-store"); res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", pdf ? "application/pdf" : /\.png$/i.test(name) ? "image/png" : /\.jpe?g$/i.test(name) ? "image/jpeg" : "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
    res.send(file);
  }));
}
