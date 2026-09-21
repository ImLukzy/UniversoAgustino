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

// Sprint F1-01: recuperación de contraseña (el backend nunca confirma si el
// email existe: misma respuesta 202 en ambos casos).
export const ForgotSchema = z.object({
  email: z.string().email().max(160),
});
export type ForgotInput = z.infer<typeof ForgotSchema>;

export const ResetSchema = z.object({
  token: z.string().min(32).max(128),
  password: z
    .string()
    .min(10)
    .max(128)
    .regex(/[a-z]/, "Debe incluir minúscula")
    .regex(/[A-Z]/, "Debe incluir mayúscula")
    .regex(/[0-9]/, "Debe incluir número"),
});
export type ResetInput = z.infer<typeof ResetSchema>;

// Edición del perfil propio (Mi cuenta).
export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  career: CareerSchema,
  cycle: z.string().max(20).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

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

// --- Orders / pago por pasos: PENDING → PAID → ESCROW → RELEASED ---
export const CreateOrderSchema = z.object({
  itemType: z.enum(["document", "bazar"]),
  itemId: z.string().min(1),
  // Alquiler de bazar: fechas solicitadas (requeridas solo en ese caso).
  rentalStart: z.string().datetime({ offset: true }).optional(),
  rentalEnd: z.string().datetime({ offset: true }).optional(),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const MarkPaidSchema = z.object({
  // Constancia del comprador (n° operación Yape/Plin u otro comprobante).
  payProof: z.string().min(3).max(160).optional(),
});
export type MarkPaidInput = z.infer<typeof MarkPaidSchema>;

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

// --- Pedidos / reservas: estados, motivos de cancelación y transiciones ---
// Fuente única de la máquina de estados (Sprint 1A). Los estados viven en
// mayúsculas (enum OrderStatus de Prisma); itemType vive en minúsculas
// ('document' | 'bazar') según CreateOrderSchema. No mezclar.
export const ORDER_STATUS = [
  "PENDING",
  "ACCEPTED",
  "PAID",
  "ESCROW",
  "RELEASED",
  "REFUNDED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

// Pedidos que bloquean el ítem (impiden una segunda reserva viva).
export const LIVE_ORDER_STATUS: readonly OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PAID",
  "ESCROW",
];

// Motivos de cancelación. El estado es CANCELLED en todos los casos;
// el motivo es lo que cambia el texto de cara al usuario.
export const CANCEL_REASONS = [
  "TTL_EXPIRED",
  "TTL_BACKFILL",
  "BUYER_CANCELLED",
  "SELLER_REJECTED",
  "ORPHAN_ITEM",
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export const CANCEL_REASON_LABEL: Record<CancelReason, string> = {
  TTL_EXPIRED: "Reserva expirada",
  TTL_BACKFILL: "Reserva expirada",
  BUYER_CANCELLED: "Cancelado por el comprador",
  SELLER_REJECTED: "Rechazado por el vendedor",
  ORPHAN_ITEM: "Publicación no disponible",
};

export function isCancelReason(v: unknown): v is CancelReason {
  return typeof v === "string" && (CANCEL_REASONS as readonly string[]).includes(v);
}

/** Etiqueta de cancelación si aplica, si no null (el llamador usa su mapa local). */
export function cancelLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return isCancelReason(reason) ? CANCEL_REASON_LABEL[reason] : null;
}

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PAID", "CANCELLED"],
  PAID: ["ESCROW", "CANCELLED"],
  ESCROW: ["RELEASED"],
  RELEASED: [],
  REFUNDED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

// --- Precio de pedido (Sprint F2-09): la ÚNICA forma de calcular montos.
// Invariante: netCents + feeCents === amountCents (testeada abajo en
// price.test.ts y usada por POST /orders). feeBps congela la tasa vigente.
export interface PriceSnapshot {
  amountCents: number;
  feeCents: number;
  netCents: number;
  feeBps: number;
}

export function computePrice(priceCents: number, feePct: number): PriceSnapshot {
  const amountCents = Math.max(0, Math.round(priceCents));
  const feeCents = Math.round((amountCents * feePct) / 100);
  return {
    amountCents,
    feeCents,
    netCents: amountCents - feeCents,
    feeBps: Math.round(feePct * 100),
  };
}

// --- Microcopy de dominio (Sprint F3-06): etiquetas en minúsculas porque
// así están los valores reales (CreateOrderSchema, CreateReportSchema).
// El alquiler NO es un itemType: es un pedido con fechas (rentalStart).
export const ITEM_TYPE_LABEL: Record<string, string> = {
  document: "Apunte digital",
  bazar: "Artículo de bazar",
  user: "Usuario",
};

// Estados de reporte observados en el modelo Report (status String con
// default OPEN; la moderación escribe ACTIONED/DISMISSED).
export const REPORT_STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  ACTIONED: "Atendido",
  DISMISSED: "Descartado",
};

// --- Moderacion / legal ---
export const CreateReportSchema = z.object({
  targetType: z.enum(["document", "bazar", "user"]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(2000),
});
export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const PEN = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;
