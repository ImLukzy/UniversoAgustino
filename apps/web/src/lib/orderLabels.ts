import { displayOrderStatus } from "./api";

// Etiqueta única de estado de pedido (Sprint 2B). Reemplaza las copias de
// ORDER_LABEL que vivían en Panel, Ventas, Publicaciones y Pedidos con
// textos inconsistentes para el mismo estado.
export type OrderRole = "buyer" | "seller";

const BUYER_LABEL: Record<string, string> = {
  PENDING: "Esperando pago",
  ACCEPTED: "Aceptado",
  PAID: "Pagado",
  ESCROW: "En custodia",
  RELEASED: "Completado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

const SELLER_LABEL: Record<string, string> = {
  PENDING: "Pendiente de aprobación",
  ACCEPTED: "Aceptado · pago en espera",
  PAID: "Pagado · por confirmar",
  ESCROW: "En custodia",
  RELEASED: "Completado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

/**
 * Texto preciso según contexto. CANCELLED con motivo muestra la causa
 * ("Reserva expirada", "Rechazado por el vendedor"...); cualquier estado
 * desconocido se devuelve tal cual (fail-open, nunca pantalla rota).
 */
export function getOrderLabel(
  status: string,
  role: OrderRole = "buyer",
  cancelledReason?: string | null,
): string {
  if (status === "CANCELLED") {
    return displayOrderStatus({ status, cancelledReason }) ?? (role === "seller" ? SELLER_LABEL : BUYER_LABEL).CANCELLED;
  }
  const map = role === "seller" ? SELLER_LABEL : BUYER_LABEL;
  return map[status] ?? status;
}

// Microcopy de dominio (Sprint F3-06, espejo de @hub/shared sin traer zod
// al bundle web). Claves en minúsculas como los valores reales.
export const ITEM_TYPE_LABEL: Record<string, string> = {
  document: "Apunte digital",
  bazar: "Artículo de bazar",
  user: "Usuario",
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  ACTIONED: "Atendido",
  DISMISSED: "Descartado",
};
