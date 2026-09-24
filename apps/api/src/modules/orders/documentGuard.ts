import type { Order } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ACCESS_STATUSES } from "../documents/access.js";

type Guard = { status: number; code: string; message: string } | { existing: Order } | null;

// Reglas de compra de un apunte (spec 16): publicado, de pago, sin pago ya
// verificado y un solo pedido vivo por comprador (se reutiliza, no se duplica).
export async function documentGuard(buyerId: string, itemId: string, item: { status: string; priceCents: number }): Promise<Guard> {
  if (item.status !== "PUBLISHED") return { status: 409, code: "NOT_AVAILABLE", message: "Este apunte ya no está disponible" };
  if (item.priceCents <= 0) return { status: 400, code: "FREE_ITEM", message: "Este apunte es gratis: ábrelo directamente en el visor" };
  const mine = { buyerId, itemType: "document", itemId };
  const owned = await prisma.order.count({ where: { ...mine, status: { in: [...ACCESS_STATUSES] } } });
  if (owned > 0) return { status: 409, code: "ALREADY_OWNED", message: "Ya compraste este apunte" };
  const existing = await prisma.order.findFirst({
    where: { ...mine, OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: new Date() } }] },
    orderBy: { createdAt: "desc" },
  });
  return existing ? { existing } : null;
}
