import { privateOrder } from "./paymentPrivacy.js";
import type { Router } from "express";
import { MarkPaidSchema, canTransition } from "@hub/shared";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/errors.js";
import { ownPhoto } from "../cases/evidence.js";
import { scheduleFail } from "../staff/scheduleGuard.js";
import { isExpired } from "./reservation.js";
import { paymentSubmittedNotices } from "./paymentNotices.js";

export function registerDigitalPay(router: Router) {
  router.post("/:id/pay", requireAuth, asyncHandler(async (req: AuthedRequest, res) => {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(300030)::text`;
      const order = await tx.order.findUniqueOrThrow({ where: { id: req.params.id } });
      if (order.buyerId !== req.user!.sub) scheduleFail("FORBIDDEN", "Solo el comprador declara el pago", 403);
      if (order.itemType !== "document") scheduleFail("PHYSICAL_PAYMENT", "Paga al equipo al recoger en sede");
      const input = MarkPaidSchema.parse(req.body);
      if (isExpired(order)) scheduleFail("RESERVATION_EXPIRED", "La reserva expiró. Genera un nuevo pedido.");
      if (!["PENDING", "ACCEPTED", "PAID"].includes(order.status) || order.verifiedAt ||
        (order.status === "PAID" && order.paymentAccountId && !order.paymentRejectedReason)) {
        scheduleFail("BAD_STATE", "Este comprobante ya está en revisión o el pedido está cerrado");
      }
      const account = await tx.paymentAccount.findFirst({ where: { id: input.paymentAccountId, active: true,
        user: { role: { in: ["moderator", "admin"] } } } });
      if (!account) scheduleFail("ACCOUNT_INACTIVE", "Selecciona una cuenta activa del equipo", 400);
      await ownPhoto(tx, input.payProofUrl, req.user!.sub);
      await tx.upload.update({ where: { storedName: input.payProofUrl.slice(9) }, data: { private: true } });
      if (order.status === "PENDING") {
        if (!canTransition("PENDING", "ACCEPTED")) scheduleFail("BAD_STATE", "Transición no permitida");
        await tx.order.update({ where: { id: order.id }, data: { status: "ACCEPTED", acceptedAt: new Date(), expiresAt: null } });
      }
      if (order.status !== "PAID" && !canTransition("ACCEPTED", "PAID")) scheduleFail("BAD_STATE", "Transición no permitida");
      const updated = await tx.order.update({ where: { id: order.id }, data: {
        status: "PAID", paymentAccountId: account.id, payMethod: account.method, payDetail: account.number,
        payQrUrl: account.qrUrl, payPhotoUrl: account.photoUrl, payHolder: account.holder,
        payProof: input.payProof ?? null, payProofUrl: input.payProofUrl, proofSubmittedAt: new Date(),
        expiresAt: null, paymentRejectedReason: null, paymentReviewedAt: null, paymentReviewedById: null,
      }, include: { escrow: true } });
      await tx.auditLog.create({ data: { actorId: req.user!.sub, action: "order.proofSubmitted", entity: "order", entityId: order.id } });
      return { order: updated, collectorId: account.userId };
    });
    await paymentSubmittedNotices(result.order, result.collectorId);
    res.json({ data: privateOrder(result.order, "buyer") });
  }));
}
