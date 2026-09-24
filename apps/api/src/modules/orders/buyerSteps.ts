import type { Router } from "express";
import { MarkPaidSchema } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { notify, orderLink } from "../../lib/notify.js";
import { expiredPatch, isExpired } from "./reservation.js";
import { audit, EXPIRED_REASONS, itemOwner } from "./itemOwner.js";
import { mpEnabled } from "../../lib/mercadopago.js";

const expiredMsg = { error: { code: "RESERVATION_EXPIRED", message: "La reserva expiró. Genera un nuevo pedido para continuar." } };

// Pasos del comprador: declarar el pago (PENDING|ACCEPTED → PAID) y
// confirmar la recepción (ESCROW → RELEASED).
export function registerBuyerSteps(router: Router) {
  router.post(
    "/:id/pay",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      // Con pasarela activa el pago lo verifica su webhook, no una declaración.
      if (mpEnabled()) return res.status(409).json({ error: { code: "GATEWAY_REQUIRED", message: "Paga con Mercado Pago desde el checkout" } });
      const input = MarkPaidSchema.parse(req.body ?? {});
      const order = await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } });
      if (order.buyerId !== req.user!.sub) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo el comprador declara el pago" } });
      }
      // El voucher debe ser un archivo subido por el propio comprador (spec 16).
      if (input.payProofUrl) {
        const own = await prisma.upload.count({ where: { storedName: input.payProofUrl.replace("/uploads/", ""), ownerId: req.user!.sub } });
        if (!own) return res.status(400).json({ error: { code: "BAD_PROOF", message: "El voucher no es un archivo tuyo" } });
      }
      // Nunca se cobra sobre una reserva muerta.
      if (isExpired(order)) {
        await prisma.order.update({ where: { id: order.id }, data: expiredPatch() });
        return res.status(409).json(expiredMsg);
      }
      // Alquiler: el vendedor debe aceptar antes (PENDING no es pagable).
      const canPay = order.status === "ACCEPTED" || (order.status === "PENDING" && !(order.itemType === "bazar" && order.rentalStart));
      if (!canPay) {
        if (order.status === "CANCELLED" && EXPIRED_REASONS.includes(order.cancelledReason ?? "")) return res.status(409).json(expiredMsg);
        const hint = order.status === "PENDING" ? "El vendedor debe aceptar tu solicitud de alquiler primero" : `El pedido ya está en ${order.status}`;
        return res.status(409).json({ error: { code: "BAD_STATE", message: hint } });
      }
      const upd = await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", payProof: input.payProof ?? null, payProofUrl: input.payProofUrl ?? null },
        include: { escrow: true },
      });
      // O1: audit + notify en paralelo, independientes entre sí.
      await Promise.all([
        audit(req.user!.sub, "order.paid", order.id),
        notify({ userId: order.sellerId, type: "ORDER_PAID", title: "Pago declarado por el comprador", body: `${order.itemTitle} — confirma el abono para pasar a custodia.`, link: orderLink(order.id) }),
      ]);
      res.json({ data: upd });
    }),
  );

  router.post(
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
        if (item.releaseStatus) await prisma.bazarItem.update({ where: { id: order.itemId }, data: { status: item.releaseStatus } });
      }
      await Promise.all([
        audit(req.user!.sub, "order.release", order.id),
        notify({ userId: order.sellerId, type: "ORDER_RELEASED", title: "Pago liberado", body: `${order.itemTitle} — el comprador confirmó la recepción.`, link: orderLink(order.id) }),
      ]);
      res.json({ data: upd });
    }),
  );
}
