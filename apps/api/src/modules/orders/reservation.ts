import type { Prisma } from "@prisma/client";
import { LIVE_ORDER_STATUS } from "@hub/shared";

// Ventana de reserva configurable (minutos). Mínimo 1 para permitir E2E;
// por defecto 30. Solo se lee al arrancar el proceso.
const rawTtlMin = Number(process.env.RESERVATION_TTL_MINUTES ?? 30);
export const RESERVATION_TTL_MINUTES =
  Number.isFinite(rawTtlMin) && rawTtlMin >= 1 ? Math.floor(rawTtlMin) : 30;
export const RESERVATION_TTL_MS = RESERVATION_TTL_MINUTES * 60_000;

export function nextExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESERVATION_TTL_MS);
}

export interface Expirable {
  status: string;
  expiresAt: Date | string | null;
}

/** true si un PENDING superó su ventana de reserva (comparación por reloj). */
export function isExpired(order: Expirable, now: Date = new Date()): boolean {
  if (order.status !== "PENDING" || !order.expiresAt) return false;
  return new Date(order.expiresAt).getTime() <= now.getTime();
}

/**
 * Pedidos que bloquean el ítem: estados vivos y, en PENDING, no vencidos
 * por reloj. SOLO aplica a bazar (ítem físico único); los documentos
 * digitales admiten N pedidos vivos de N compradores.
 */
export function blockingOrderWhere(itemType: string, itemId: string): Prisma.OrderWhereInput {
  if (itemType !== "bazar") {
    // Condición imposible tipada: los digitales nunca bloquean.
    return { id: "__never__" };
  }
  return {
    itemType,
    itemId,
    OR: [
      { status: { in: ["ACCEPTED", "PAID", "ESCROW"] } },
      { status: "PENDING", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    ],
  };
}

/**
 * Parche único de expiración. El cron y la expiración perezosa escriben
 * exactamente lo mismo: CANCELLED + motivo TTL_EXPIRED (sin tocar el enum).
 */
export function expiredPatch(now: Date = new Date()) {
  return {
    status: "CANCELLED" as const,
    cancelledAt: now,
    cancelledReason: "TTL_EXPIRED",
    expiresAt: null,
  };
}

export { LIVE_ORDER_STATUS };
