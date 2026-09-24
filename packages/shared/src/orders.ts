import { z } from "zod";

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
  // Voucher opcional: solo rutas internas de POST /uploads (nunca URLs externas).
  payProofUrl: z.string().regex(/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/).optional(),
})
  // Spec 16: sin constancia no hay nada que el vendedor pueda verificar.
  .refine((v) => !!v.payProof || !!v.payProofUrl, { message: "Indica el n.º de operación o adjunta el voucher", path: ["payProof"] });
export type MarkPaidInput = z.infer<typeof MarkPaidSchema>;

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

// Comisión de la plataforma (%). El backend puede sobrescribirla con
// PLATFORM_FEE_PCT; la UI y los simuladores usan este valor por defecto.
export const PLATFORM_FEE_PCT = 13;

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
