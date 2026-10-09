import type { Prisma } from "@prisma/client";
import { canTransitionCase } from "@hub/shared";
import { scheduleFail } from "../staff/scheduleGuard.js";
export async function refundPhysical(tx: Prisma.TransactionClient, orderId: string, now: Date) {
  const row = await tx.handoverCase.findUnique({ where: { orderId } });
  if (!row) scheduleFail("BAD_STATE", "El físico no tiene caso de custodia");
  if (["IN_CUSTODY", "PICKUP_SCHEDULED", "RETURNED"].includes(row.status)) {
    if (!canTransitionCase(row.status, "BACK_TO_SELLER")) scheduleFail("BAD_STATE", "No se puede devolver el objeto");
    await tx.appointment.updateMany({ where: { caseId: row.id, kind: "PICKUP", status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    await tx.handoverCase.update({ where: { id: row.id }, data: { status: "BACK_TO_SELLER", backToSellerRequestedAt: now } });
  } else if (row.status !== "BACK_TO_SELLER") {
    scheduleFail("RETURN_REQUIRED", "El objeto debe volver a la sede antes de registrar el reembolso");
  }
}
