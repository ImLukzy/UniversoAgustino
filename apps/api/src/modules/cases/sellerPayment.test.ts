import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h, row, resetCases } from "./caseFixture.js";
import { confirmSellerPayment, reportSellerPayment } from "./sellerPayment.js";
beforeEach(() => { resetCases(); h.handoverCase.findUnique.mockResolvedValue({ ...row, paymentRef: "12345", paymentMethod: "OPERATION", sellerConfirmedAt: null }); h.report.create.mockResolvedValue({ id: "report" }); });
afterEach(() => vi.useRealTimers());
describe("confirmación de vendedor sin segundo paso financiero", () => {
  it("confirmación heredada no cambia finanzas ni confirma cobro", async () => { await expect(confirmSellerPayment("order", "seller")).rejects.toMatchObject({ code: "TEAM_SETTLEMENT" }); expect(h.handoverCase.update).not.toHaveBeenCalled(); expect(h.order.update).not.toHaveBeenCalled(); expect(h.auditLog.create).not.toHaveBeenCalled(); });
  it("comprador y terceros no confirman", async () => { await expect(confirmSellerPayment("order", "buyer")).rejects.toMatchObject({ status: 404 }); expect(h.handoverCase.update).not.toHaveBeenCalled(); });
  it("confirmación duplicada no audita otra vez", async () => { h.handoverCase.findUnique.mockResolvedValue({ ...row, paymentRef: "12345", paymentMethod: "CASH", sellerConfirmedAt: new Date() }); await expect(confirmSellerPayment("order", "seller")).rejects.toMatchObject({ code: "TEAM_SETTLEMENT" }); expect(h.auditLog.create).not.toHaveBeenCalled(); });
  it("no confirma antes de pago certificado", async () => { h.handoverCase.findUnique.mockResolvedValue(row); await expect(confirmSellerPayment("order", "seller")).rejects.toMatchObject({ code: "TEAM_SETTLEMENT" }); });
  it("No recibí abre Report ligado al pedido sin alterar entrega", async () => { await reportSellerPayment("order", "seller", "No recibí el abono"); expect(h.report.create).toHaveBeenCalledWith({ data: { targetType: "order", targetId: "order", reporterId: "seller", reason: "No recibí el abono" } }); expect(h.order.update).not.toHaveBeenCalled(); expect(h.handoverCase.update).not.toHaveBeenCalled(); });
  it("comprador no usa reporte heredado del vendedor", async () => { await expect(reportSellerPayment("order", "buyer", "No recibí el pago")).rejects.toMatchObject({ status: 404 }); expect(h.report.create).not.toHaveBeenCalled(); });
});
