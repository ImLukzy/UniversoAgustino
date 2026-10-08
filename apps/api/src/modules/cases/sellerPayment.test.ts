import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { h, row, resetCases } from "./caseFixture.js";
import { confirmSellerPayment, reportSellerPayment } from "./sellerPayment.js";
beforeEach(() => { resetCases(); h.handoverCase.findUnique.mockResolvedValue({ ...row, paymentRef: "12345", paymentMethod: "OPERATION", sellerConfirmedAt: null }); h.report.create.mockResolvedValue({ id: "report" }); });
afterEach(() => vi.useRealTimers());
describe("confirmación de vendedor sin segundo paso financiero", () => {
  it("confirma cobro y audita sin cambiar Order ni stock", async () => { await confirmSellerPayment("order", "seller"); expect(h.handoverCase.update).toHaveBeenCalledWith(expect.objectContaining({ data: { sellerConfirmedAt: expect.anything() } })); expect(h.order.update).not.toHaveBeenCalled(); expect(h.bazarItem.update).not.toHaveBeenCalled(); expect(h.auditLog.create).toHaveBeenCalled(); });
  it("comprador y terceros no confirman", async () => { await expect(confirmSellerPayment("order", "buyer")).rejects.toMatchObject({ status: 404 }); expect(h.handoverCase.update).not.toHaveBeenCalled(); });
  it("confirmación duplicada no audita otra vez", async () => { h.handoverCase.findUnique.mockResolvedValue({ ...row, paymentRef: "12345", paymentMethod: "CASH", sellerConfirmedAt: new Date() }); await expect(confirmSellerPayment("order", "seller")).rejects.toMatchObject({ code: "ALREADY_CONFIRMED" }); expect(h.auditLog.create).not.toHaveBeenCalled(); });
  it("no confirma antes de pago certificado", async () => { h.handoverCase.findUnique.mockResolvedValue(row); await expect(confirmSellerPayment("order", "seller")).rejects.toMatchObject({ code: "BAD_STATE" }); });
  it("No recibí abre Report ligado al pedido sin alterar entrega", async () => { await reportSellerPayment("order", "seller", "No recibí el abono"); expect(h.report.create).toHaveBeenCalledWith({ data: { targetType: "order", targetId: "order", reporterId: "seller", reason: "No recibí el abono" } }); expect(h.order.update).not.toHaveBeenCalled(); expect(h.handoverCase.update).not.toHaveBeenCalled(); });
  it("reporte abierto duplicado no se multiplica", async () => { h.report.findFirst.mockResolvedValue({ id: "report" }); await expect(reportSellerPayment("order", "seller", "No recibí el pago")).rejects.toMatchObject({ code: "REPORT_EXISTS" }); expect(h.report.create).not.toHaveBeenCalled(); });
});
