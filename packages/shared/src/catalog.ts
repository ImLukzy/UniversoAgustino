import { z } from "zod";
import { CareerSchema, UniversitySchema } from "./common.js";
import { PreviewPagesSchema } from "./pages.js";

// --- Cobro del vendedor: método + QR + dato (titular/número) ---
export const PayMethodSchema = z.enum(["YAPE", "PLIN", "AMBAS"]);
export type PayMethod = z.infer<typeof PayMethodSchema>;
const payFields = {
  payMethod: PayMethodSchema.default("YAPE"),
  payQrUrl: z.string().url().or(z.string().startsWith("/uploads/")).optional(),
  payDetail: z.string().max(160).optional(),
};

// --- Documents (marketplace apuntes) ---
export const DocumentTypeSchema = z.enum(["APUNTE", "PAE", "BALOTARIO", "GUIA"]);
export const CreateDocumentSchema = z.object({
  title: z.string().min(4).max(160),
  course: z.string().min(2).max(100),
  university: UniversitySchema.default("UNSA"),
  career: CareerSchema.default("ENFERMERIA"),
  cycle: z.string().min(1).max(20),
  type: DocumentTypeSchema,
  priceCents: z.number().int().min(0).max(50_000_00),
  fileUrl: z.string().url().or(z.string().startsWith("/uploads/")).optional(),
  description: z.string().max(2000).optional(),
  // Páginas de muestra públicas (spec 16); sin valor rige el default [1,2].
  previewPages: PreviewPagesSchema.optional(),
  ...payFields,
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

// Edición por el dueño: solo campos seguros (sin carrera/universidad/tipo).
export const UpdateDocumentSchema = z.object({
  title: z.string().min(4).max(160).optional(),
  course: z.string().min(2).max(100).optional(),
  cycle: z.string().min(1).max(20).optional(),
  priceCents: z.number().int().min(0).max(50_000_00).optional(),
  fileUrl: z.string().url().or(z.string().startsWith("/uploads/")).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  previewPages: PreviewPagesSchema.optional(),
  payMethod: PayMethodSchema.optional(),
  payQrUrl: z.string().url().or(z.string().startsWith("/uploads/")).nullable().optional(),
  payDetail: z.string().max(160).nullable().optional(),
});
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;

export const ListQuerySchema = z.object({
  q: z.string().max(100).optional(),
  university: UniversitySchema.optional(),
  career: CareerSchema.optional(),
  course: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

// --- Bazar ---
export const BazarKindSchema = z.enum(["LIBRO", "SCRUB", "INSTRUMENTO"]);
export const BazarTxSchema = z.enum(["VENTA", "ALQUILER"]);
const photoList = z
  .array(z.string().url().or(z.string().startsWith("/uploads/")))
  .max(4)
  .default([]);

export const CreateBazarItemSchema = z.object({
  title: z.string().min(4).max(160),
  kind: BazarKindSchema,
  tx: BazarTxSchema,
  priceCents: z.number().int().min(0),
  depositCents: z.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
  photos: photoList,
  ...payFields,
});
export type CreateBazarItemInput = z.infer<typeof CreateBazarItemSchema>;

// Edición por el dueño: solo campos seguros (sin kind/tx).
export const UpdateBazarItemSchema = z.object({
  title: z.string().min(4).max(160).optional(),
  priceCents: z.number().int().min(0).optional(),
  depositCents: z.number().int().min(0).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  photos: z.array(z.string().url().or(z.string().startsWith("/uploads/"))).max(4).optional(),
  payMethod: PayMethodSchema.optional(),
  payQrUrl: z.string().url().or(z.string().startsWith("/uploads/")).nullable().optional(),
  payDetail: z.string().max(160).nullable().optional(),
});
export type UpdateBazarItemInput = z.infer<typeof UpdateBazarItemSchema>;
