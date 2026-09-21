import { Router } from "express";
import { CreateOrderSchema, MarkPaidSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../env.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth.js";
import { blockingOrderWhere, expiredPatch, isExpired, nextExpiry } from "./reservation.js";

export const ordersRouter = Router();

const ACTIVE = ["PENDING", "ACCEPTED", "PAID", "ESCROW"] as const;

// Dueño del ítem (para impedir auto-compra y autorizar al vendedor).
// Devuelve también título y precio para el snapshot del pedido.
async function itemOwner(itemType: string, itemId: string) {
  if (itemType === "document") {
    const d = await prisma.document.findUniqueOrThrow({ where: { id: itemId } });
    return {
      ownerId: d.authorId,
      title: d.title,
      priceCents: d.priceCents,
      payMethod: d.payMethod,
      payQrUrl: d.payQrUrl,
      payDetail: d.payDetail,
      releaseStatus: null as "SOLD" | "RENTED" | null,
    };
  }
  const b = await prisma.bazarItem.findUniqueOrThrow({ where: { id: itemId } });
  return {
    ownerId: b.sellerId,
    title: b.title,
    priceCents: b.priceCents,
    payMethod: b.payMethod,
    payQrUrl: b.payQrUrl,
    payDetail: b.payDetail,
    releaseStatus: (b.tx === "ALQUILER" ? "RENTED" : "SOLD") as "SOLD" | "RENTED",
  };
}

// Paso 1: el comprador crea el pedido en PENDING (nada es gratis: debe pagar
// al Yape/Plin del vendedor y luego marcarlo como pagado).
ordersRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = CreateOrderSchema.parse(req.body);
    const item = await itemOwner(input.itemType, input.itemId);
    if (item.ownerId === req.user!.sub) {
      return res.status(400).json({ error: { code: "SELF_PURCHASE", message: "No puedes comprar tu propia publicación" } });
    }
    // (a) Expiración perezosa (Sprint 1A): libera PENDING vencidos de este
    // ítem para que el cron caído no bloquee el inventario.
    const expiredNow = await prisma.order.updateMany({
      where: { itemType: input.itemType, itemId: input.itemId, status: "PENDING", expiresAt: { lte: new Date() } },
      data: expiredPatch(),
    });
    // Si se liberó una reserva de bazar y no queda otra viva, el ítem vuelve
    // a AVAILABLE (su RESERVED quedó huérfano).
    if (expiredNow.count > 0 && input.itemType === "bazar") {
      const stillBlocked = await prisma.order.findFirst({
        where: blockingOrderWhere(input.itemType, input.itemId),
        select: { id: true },
      });
      if (!stillBlocked) {
        await prisma.bazarItem.updateMany({
          where: { id: input.itemId, status: "RESERVED" },
          data: { status: "AVAILABLE" },
        });
      }
    }
    let rentalStart: Date | undefined;
    let rentalEnd: Date | undefined;
    if (input.itemType === "bazar") {
      const cur = await prisma.bazarItem.findUniqueOrThrow({ where: { id: input.itemId } });
      if (cur.status !== "AVAILABLE") {
        return res.status(409).json({ error: { code: "NOT_AVAILABLE", message: "Este ítem ya está reservado o vendido" } });
      }
      if (cur.tx === "ALQUILER") {
        if (!input.rentalStart || !input.rentalEnd) {
          return res.status(400).json({ error: { code: "DATES_REQUIRED", message: "El alquiler requiere fecha de inicio y fin" } });
        }
        rentalStart = new Date(input.rentalStart);
        rentalEnd = new Date(input.rentalEnd);
        if (!(rentalEnd > rentalStart)) {
          return res.status(400).json({ error: { code: "BAD_DATES", message: "La fecha de fin debe ser posterior al inicio" } });
        }
      }
      await prisma.bazarItem.update({ where: { id: input.itemId }, data: { status: "RESERVED" } });
      // (b) Chequeo explícito de reserva viva en bazar (mensaje legible con
      // fecha de liberación). El árbitro final es el índice único parcial
      // order_active_item_unique (P2002 → 409). Los documentos digitales
      // admiten N pedidos vivos y nunca bloquean.
      const blocking = await prisma.order.findFirst({
        where: blockingOrderWhere(input.itemType, input.itemId),
        select: { id: true, status: true, expiresAt: true },
      });
      if (blocking) {
        return res.status(409).json({ error: { code: "NOT_AVAILABLE", message: "Este ítem ya está reservado", details: { availableAt: blocking.expiresAt } } });
      }
    }
    const amountCents = item.priceCents;
    const feeCents = Math.round(amountCents * (env.FEE_PCT / 100));
    const feeBps = Math.round(env.FEE_PCT * 100);
    const order = await prisma.order.create({
      data: {
        buyerId: req.user!.sub,
        sellerId: item.ownerId,
        itemType: input.itemType,
        itemId: input.itemId,
        amountCents,
        feeCents,
        netCents: amountCents - feeCents,
        payMethod: item.payMethod,
        payQrUrl: item.payQrUrl,
        payDetail: item.payDetail,
        rentalStart,
        rentalEnd,
        status: "PENDING",
        expiresAt: nextExpiry(),
        // Snapshot congelado: título, precio y tasa vigentes al reservar.
        itemTitle: item.title,
        itemPriceCents: amountCents,
        feeBps,
      },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.created", entity: "order", entityId: order.id } });
    res.status(201).json({ data: order });
  })
);

ordersRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await prisma.order.findMany({ where: { buyerId: req.user!.sub }, orderBy: { createdAt: "desc" }, include: { escrow: true } });
    res.json({ data: rows });
  })
);

// Ventas: pedidos sobre MIS publicaciones (soy el vendedor), con comprador,
// título del ítem y reputación del comprador (pedidos completados previos).
// Sprint 2A: el conteo por comprador es UN solo groupBy (antes: 1 count por fila).
ordersRouter.get(
  "/sales",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = req.user!.sub;
    const [docs, items] = await Promise.all([
      prisma.document.findMany({ where: { authorId: me }, select: { id: true, title: true, priceCents: true } }),
      prisma.bazarItem.findMany({ where: { sellerId: me }, select: { id: true, title: true, priceCents: true, tx: true, description: true } }),
    ]);
    const meta = new Map<string, { title: string; desc?: string | null; tx?: string }>([
      ...docs.map((d): [string, { title: string }] => [d.id, { title: d.title }]),
      ...items.map((b): [string, { title: string; desc?: string | null; tx?: string }] => [b.id, { title: b.title, desc: b.description, tx: b.tx }]),
    ]);
    const rows = await prisma.order.findMany({
      where: { itemId: { in: [...meta.keys()] } },
      orderBy: { createdAt: "desc" },
      include: { escrow: true, buyer: { select: { id: true, email: true, profile: true } } },
    });
    // Compras completadas por comprador en UNA sola agregación.
    // El IN lleva IDs de comprador deduplicados (no IDs de pedido).
    const buyerIds = [...new Set(rows.map((o) => o.buyerId))];
    const completedByBuyer = buyerIds.length
      ? await prisma.order.groupBy({
          by: ["buyerId"],
          where: { buyerId: { in: buyerIds }, status: "RELEASED" },
          _count: { _all: true },
        })
      : [];
    const completions = new Map(completedByBuyer.map((r) => [r.buyerId, r._count._all]));
    const data = rows.map((o) => ({
      ...o,
      itemTitle: meta.get(o.itemId)?.title ?? o.itemId,
      itemDesc: meta.get(o.itemId)?.desc ?? null,
      itemTx: meta.get(o.itemId)?.tx ?? null,
      buyerCompleted: completions.get(o.buyerId) ?? 0,
    }));
    res.json({ data });
  })
);

// Detalle: solo participan comprador, vendedor o moderación.
// NOTA: rutas fijas (/mine, /sales) van ANTES que /:id o "sales" caería en :id.
ordersRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { escrow: true } });
    if (!order) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Pedido no existe" } });
    const item = await itemOwner(order.itemType, order.itemId);
    const me = req.user!.sub;
    const allowed = order.buyerId === me || item.ownerId === me || ["admin", "moderator"].includes(req.user!.role);
    if (!allowed) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No participas en este pedido" } });
    res.json({ data: order });
  })
);

// Aceptar solicitud (alquiler de bazar): el vendedor autoriza a continuar al pago.
ordersRouter.post(
  "/:id/accept",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    const item = await itemOwner(order.itemType, order.itemId);
    if (item.ownerId !== req.user!.sub) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el vendedor acepta solicitudes" } });
    }
    if (order.itemType !== "bazar") {
      return res.status(409).json({ error: { code: "NOT_RENTAL", message: "Las ventas digitales no requieren aceptación" } });
    }
    // Reserva ya expirada (por cron o expiración perezosa): mensaje accionable
    // en vez del genérico "está en CANCELLED".
    if (order.status === "CANCELLED" && (order.cancelledReason === "TTL_EXPIRED" || order.cancelledReason === "TTL_BACKFILL")) {
      return res.status(409).json({ error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. El comprador debe generar un nuevo pedido." } });
    }
    if (order.status !== "PENDING") {
      return res.status(409).json({ error: { code: "BAD_STATE", message: `La solicitud está en ${order.status}` } });
    }
    // La reserva vencida no se puede aceptar: se marca expirada y el
    // comprador debe generar un nuevo pedido.
    if (isExpired(order)) {
      await prisma.order.update({ where: { id: order.id }, data: expiredPatch() });
      return res.status(409).json({ error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. El comprador debe generar un nuevo pedido." } });
    }
    const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "ACCEPTED", acceptedAt: new Date(), expiresAt: null }, include: { escrow: true } });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.accept", entity: "order", entityId: order.id } });
    res.json({ data: upd });
  })
);

// Paso 2: el comprador declara que ya pagó (con n° de operación opcional).
ordersRouter.post(
  "/:id/pay",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const input = MarkPaidSchema.parse(req.body ?? {});
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    if (order.buyerId !== req.user!.sub) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el comprador declara el pago" } });
    }
    // Nunca se cobra sobre una reserva muerta.
    if (isExpired(order)) {
      await prisma.order.update({ where: { id: order.id }, data: expiredPatch() });
      return res.status(409).json({ error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. Genera un nuevo pedido para continuar." } });
    }
    const canPay =
      order.status === "ACCEPTED" ||
      (order.status === "PENDING" && !(order.itemType === "bazar" && order.rentalStart));
    if (!canPay) {
      if (order.status === "CANCELLED" && (order.cancelledReason === "TTL_EXPIRED" || order.cancelledReason === "TTL_BACKFILL")) {
        return res.status(409).json({ error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. Genera un nuevo pedido para continuar." } });
      }
      const hint = order.status === "PENDING"
        ? "El vendedor debe aceptar tu solicitud de alquiler primero"
        : `El pedido ya está en ${order.status}`;
      return res.status(409).json({ error: { code: "BAD_STATE", message: hint } });
    }
    const upd = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", payProof: input.payProof ?? null },
      include: { escrow: true },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.paid", entity: "order", entityId: order.id } });
    res.json({ data: upd });
  })
);

// Paso 3: el vendedor confirma que recibió el pago → custodia (ESCROW).
ordersRouter.post(
  "/:id/confirm-payment",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    const item = await itemOwner(order.itemType, order.itemId);
    if (item.ownerId !== req.user!.sub) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el vendedor confirma el pago" } });
    }
    if (order.status !== "PAID") {
      return res.status(409).json({ error: { code: "BAD_STATE", message: `El pedido está en ${order.status}, falta que el comprador pague` } });
    }
    const upd = await prisma.order.update({
      where: { id: order.id },
      data: { status: "ESCROW", escrow: { create: {} } },
      include: { escrow: true },
    });
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.escrow", entity: "order", entityId: order.id } });
    res.json({ data: upd });
  })
);

// Cancelar (comprador o vendedor) mientras no esté liberado: libera la reserva.
ordersRouter.post(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    const item = await itemOwner(order.itemType, order.itemId);
    const mine = order.buyerId === req.user!.sub || item.ownerId === req.user!.sub;
    if (!mine) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No participas en este pedido" } });
    if (!["PENDING", "ACCEPTED", "PAID"].includes(order.status)) {
      return res.status(409).json({ error: { code: "BAD_STATE", message: `Ya no se puede cancelar (está ${order.status})` } });
    }
    const cancelledReason = order.buyerId === req.user!.sub ? "BUYER_CANCELLED" : "SELLER_REJECTED";
    const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason, expiresAt: null }, include: { escrow: true } });
    if (order.itemType === "bazar") {
      await prisma.bazarItem.updateMany({ where: { id: order.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    }
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.cancel", entity: "order", entityId: order.id } });
    res.json({ data: upd });
  })
);

// Paso 4: el comprador confirma recepción → se libera al vendedor.
ordersRouter.post(
  "/:id/confirm-receipt",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    if (order.buyerId !== req.user!.sub) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el comprador confirma recepción" } });
    }
    if (order.status !== "ESCROW") {
      return res.status(409).json({ error: { code: "BAD_STATE", message: `El pedido está en ${order.status}, aún no está en custodia` } });
    }
    const upd = await prisma.order.update({
      where: { id: order.id },
      data: { status: "RELEASED", escrow: { update: { releasedAt: new Date() } } },
      include: { escrow: true },
    });
    if (order.itemType === "bazar") {
      const item = await itemOwner(order.itemType, order.itemId);
      if (item.releaseStatus) {
        await prisma.bazarItem.update({ where: { id: order.itemId }, data: { status: item.releaseStatus } });
      }
    }
    await prisma.auditLog.create({ data: { actorId: req.user!.sub, action: "order.release", entity: "order", entityId: order.id } });
    res.json({ data: upd });
  })
);

ordersRouter.post(
  "/:id/refund",
  requireAuth,
  requireRole("moderator", "admin"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
    const upd = await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED" } });
    if (order.itemType === "bazar") {
      await prisma.bazarItem.updateMany({ where: { id: order.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
    }
    res.json({ data: upd });
  })
);
