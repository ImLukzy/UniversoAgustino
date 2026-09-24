import { prisma } from "../../lib/prisma.js";

// Dueño del ítem (para impedir auto-compra y autorizar al vendedor) + datos
// del snapshot del pedido. F0-c p95: select recortado (sin description/photos/
// fileUrl) + status/tx para que POST / de bazar no re-lea el ítem.
export async function itemOwner(itemType: string, itemId: string) {
  if (itemType === "document") {
    const d = await prisma.document.findUniqueOrThrow({
      where: { id: itemId },
      select: { authorId: true, title: true, priceCents: true, payMethod: true, payQrUrl: true, payDetail: true, status: true },
    });
    return {
      ownerId: d.authorId,
      title: d.title,
      priceCents: d.priceCents,
      payMethod: d.payMethod,
      payQrUrl: d.payQrUrl,
      payDetail: d.payDetail,
      status: d.status as string,
      tx: "VENTA",
      releaseStatus: null as "SOLD" | "RENTED" | null,
    };
  }
  const b = await prisma.bazarItem.findUniqueOrThrow({
    where: { id: itemId },
    select: { sellerId: true, title: true, priceCents: true, payMethod: true, payQrUrl: true, payDetail: true, status: true, tx: true },
  });
  return {
    ownerId: b.sellerId,
    title: b.title,
    priceCents: b.priceCents,
    payMethod: b.payMethod,
    payQrUrl: b.payQrUrl,
    payDetail: b.payDetail,
    status: b.status,
    tx: b.tx,
    releaseStatus: (b.tx === "ALQUILER" ? "RENTED" : "SOLD") as "SOLD" | "RENTED",
  };
}

// Registro de auditoría de una transición de pedido.
export const audit = (actorId: string, action: string, orderId: string) =>
  prisma.auditLog.create({ data: { actorId, action, entity: "order", entityId: orderId } });

export const EXPIRED_REASONS = ["TTL_EXPIRED", "TTL_BACKFILL"];
