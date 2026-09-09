import { z } from "zod";

export const UniversitySchema = z.enum(["UNSA"]);
export type University = z.infer<typeof UniversitySchema>;

// --- Comunidad UNSA: solo correos institucionales + excepción autorizada ---
export const UNSA_EMAIL_DOMAIN = "unsa.edu.pe";
export const ALLOWED_EMAIL_EXCEPTIONS = ["lukas.melgar@tecsup.edu.pe"];

export function isAllowedEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if ((ALLOWED_EMAIL_EXCEPTIONS as string[]).includes(e)) return true;
  return e.endsWith(`@${UNSA_EMAIL_DOMAIN}`);
}

export const UnsaEmailSchema = z
  .string()
  .email()
  .max(160)
  .refine((v) => isAllowedEmail(v), {
    message: "Acceso exclusivo comunidad UNSA: usa tu correo @unsa.edu.pe",
  });

// --- Carreras UNSA (Escuelas Profesionales). El catálogo visual
// (etiquetas, facultad, color) vive en apps/web/src/data/unsa.ts y debe
// mantener las mismas claves que CareerSchema. ---
export const CareerSchema = z.enum([
  "ENFERMERIA",
  "MEDICINA",
  "PSICOLOGIA",
  "BIOLOGIA",
  "DERECHO",
  "EDUCACION",
  "ADMINISTRACION",
  "CONTABILIDAD",
  "ECONOMIA",
  "ING_SISTEMAS",
  "ING_CIVIL",
  "ING_INDUSTRIAL",
  "ARQUITECTURA",
  "AGRONOMIA",
  "OTRA_UNSA",
]);
export type Career = z.infer<typeof CareerSchema>;

export const RoleSchema = z.enum(["student", "creator", "moderator", "admin"]);
export type Role = z.infer<typeof RoleSchema>;

// --- Auth (comunidad UNSA) ---
export const RegisterSchema = z.object({
  email: UnsaEmailSchema,
  password: z.string().min(8).max(100),
  fullName: z.string().min(2).max(120),
  university: UniversitySchema.default("UNSA"),
  career: CareerSchema.default("ENFERMERIA"),
  cycle: z.string().max(20).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: UnsaEmailSchema,
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

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
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;

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
export const CreateBazarItemSchema = z.object({
  title: z.string().min(4).max(160),
  kind: BazarKindSchema,
  tx: BazarTxSchema,
  priceCents: z.number().int().min(0),
  depositCents: z.number().int().min(0).optional(),
  description: z.string().max(2000).optional(),
});
export type CreateBazarItemInput = z.infer<typeof CreateBazarItemSchema>;

// --- Orders / escrow ---
export const CreateOrderSchema = z.object({
  itemType: z.enum(["document", "bazar"]),
  itemId: z.string().min(1),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// --- Monetizacion: calculadora pura (testeable) ---
export const SimulateSchema = z.object({
  avgPrice: z.number().min(0).max(500), // soles
  salesPerMonth: z.number().int().min(0).max(10000),
  bazarExtra: z.number().min(0).max(10000).default(0),
  feePct: z.number().min(0).max(50).default(13),
});
export type SimulateInput = z.infer<typeof SimulateSchema>;

export function simulateEarnings(input: SimulateInput) {
  const gross = input.avgPrice * input.salesPerMonth + input.bazarExtra;
  const fee = +(gross * (input.feePct / 100)).toFixed(2);
  const net = +(gross - fee).toFixed(2);
  return { gross: +gross.toFixed(2), fee, net, currency: "PEN" as const };
}

// --- Moderacion / legal ---
export const CreateReportSchema = z.object({
  targetType: z.enum(["document", "bazar", "user"]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(2000),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const PEN = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;
