import type { Prisma } from "@prisma/client";
import { hasObject } from "../../lib/storage.js";
import { scheduleFail } from "../staff/scheduleGuard.js";

export async function ownPhoto(tx: Prisma.TransactionClient, photoUrl: string, ownerId: string) {
  const storedName = photoUrl.slice("/uploads/".length);
  const upload = await tx.upload.findUnique({ where: { storedName } });
  if (!upload || upload.ownerId !== ownerId || !["image/jpeg", "image/png"].includes(upload.detectedMime)) scheduleFail("BAD_PHOTO", "Sube una foto JPG o PNG propia", 400);
  if (!await hasObject(storedName)) scheduleFail("BAD_PHOTO", "La foto no está disponible", 400);
}
