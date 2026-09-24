import type { MpPayment } from "../../lib/mercadopago.js";

interface SettleOrder {
  status: string;
  itemType: string;
  amountCents: number;
  cancelledReason: string | null;
}

export type Settlement = "ESCROW" | "ALREADY" | "IGNORE" | "MISMATCH" | "ORPHAN";

const TTL = ["TTL_EXPIRED", "TTL_BACKFILL"];

// Decide qué hace un pago aprobado con su pedido (spec 16). Pura para testear:
// - ESCROW: pago verificado por la pasarela → custodia (acceso completo).
// - ALREADY: webhook repetido; idempotente.
// - MISMATCH: monto/moneda no cuadran → nunca se libera nada.
// - ORPHAN: pedido cerrado (o bazar ya re-reservado): se audita para reembolso.
export function settle(order: SettleOrder, pay: MpPayment): Settlement {
  if (pay.status !== "approved") return "IGNORE";
  if (pay.currency_id !== "PEN" || Math.round(pay.transaction_amount * 100) !== order.amountCents) return "MISMATCH";
  if (["PAID", "ESCROW", "RELEASED"].includes(order.status)) return order.status === "PAID" ? "ESCROW" : "ALREADY";
  if (order.status === "PENDING" || order.status === "ACCEPTED") return "ESCROW";
  // Un apunte no tiene stock: si la reserva expiró mientras pagaba, se honra.
  if (order.status === "CANCELLED" && TTL.includes(order.cancelledReason ?? "") && order.itemType === "document") return "ESCROW";
  return "ORPHAN";
}
