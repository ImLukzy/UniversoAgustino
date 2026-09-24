import type { Router } from "express";
import { CreateOrderSchema, computePrice } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../env.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { notify, orderLink } from "../../lib/notify.js";
import { blockingOrderWhere, expiredPatch, nextExpiry, RESERVATION_TTL_MINUTES } from "./reservation.js";
import { audit, itemOwner } from "./itemOwner.js";
import { documentGuard } from "./documentGuard.js";

// Paso 1: el comprador crea el pedido en PENDING (nada es gratis: debe pagar
// al Yape/Plin del vendedor y luego marcarlo como pagado).
export function registerCreate(router: Router) {
  router.post(
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
        const stillBlocked = await prisma.order.findFirst({ where: blockingOrderWhere(input.itemType, input.itemId), select: { id: true } });
        if (!stillBlocked) {
          await prisma.bazarItem.updateMany({ where: { id: input.itemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
        }
      }
      if (input.itemType === "document") {
        const guard = await documentGuard(req.user!.sub, input.itemId, item);
        if (guard && "existing" in guard) return res.json({ data: guard.existing });
        if (guard) return res.status(guard.status).json({ error: { code: guard.code, message: guard.message } });
      }
      let rentalStart: Date | undefined;
      let rentalEnd: Date | undefined;
      if (input.itemType === "bazar") {
        // O5: status/tx ya vienen de itemOwner (un solo read del ítem).
        if (item.status !== "AVAILABLE") {
          return res.status(409).json({ error: { code: "NOT_AVAILABLE", message: "Este ítem ya está reservado o vendido" } });
        }
        if (item.tx === "ALQUILER") {
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
      const { amountCents, feeCents, netCents, feeBps } = computePrice(item.priceCents, env.FEE_PCT);
      const order = await prisma.order.create({
        data: {
          buyerId: req.user!.sub,
          sellerId: item.ownerId,
          itemType: input.itemType,
          itemId: input.itemId,
          amountCents,
          feeCents,
          netCents,
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
      // O1: audit + notify son independientes entre sí → en paralelo (ahorra 1 RTT
      // a Neon por pedido; el p95 de POST /orders es RTT-bound, ver F0-c).
      await Promise.all([
        audit(req.user!.sub, "order.created", order.id),
        notify({
          userId: item.ownerId,
          type: "ORDER_CREATED",
          title: "Nueva reserva en tu publicación",
          body: `${item.title} — la reserva expira en ${RESERVATION_TTL_MINUTES} minutos.`,
          link: orderLink(order.id),
        }),
      ]);
      res.status(201).json({ data: order });
    }),
  );
}
