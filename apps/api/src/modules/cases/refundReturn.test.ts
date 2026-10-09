import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { actor, h, resetCases } from "./caseFixture.js";
import { physicalFlow } from "./fulfillmentFixture.js";
import { bookCase } from "./appointments.js";
import { returnCase } from "./returns.js";
import { backToSeller } from "./close.js";
vi.mock("./reminders.js", () => ({ remindIfDue: vi.fn() }));
const tech = { sub: "worker", role: "admin" };
beforeEach(() => { resetCases(); h.user.findUnique.mockResolvedValue({ role: "admin" }); h.payout.findUnique.mockResolvedValue({ status: "FROZEN", refundRequired: true }); });
afterEach(() => vi.useRealTimers());
const booking = { kind: "RETURN" as const, sedeId: "sede", startsAt: "2026-10-08T13:15:00Z" };
const review = { condition: "OK", conditionNote: "Objeto devuelto conforme", reviewConfirmed: true, photoUrl: "/uploads/return.png" };
function sale(status = "CLOSED") { const r = physicalFlow(); r.status = status; r.order.status = "ESCROW"; return r; }
it.each(["CLOSED", "DELIVERED"])("Técnico agenda devolución de venta %s al comprador", async (status) => {
  const r = sale(status); const a = await bookCase("case", tech, booking);
  expect(a.partyId).toBe("buyer"); expect(r.status).toBe("RETURN_SCHEDULED"); expect(r).toHaveProperty("closedAt", null);
});
it("trabajador no agenda retorno de venta", async () => { sale(); h.user.findUnique.mockResolvedValue({ role: "moderator" }); await expect(bookCase("case", actor, booking)).rejects.toMatchObject({ status: 403 }); expect(h.appointment.create).not.toHaveBeenCalled(); });
it.each([{ status: "PENDING", refundRequired: true }, { status: "FROZEN", refundRequired: false }, null])("sin decisión real no reabre venta %#", async (p) => { sale(); h.payout.findUnique.mockResolvedValue(p); await expect(bookCase("case", tech, booking)).rejects.toMatchObject({ code: "BAD_STATE" }); });
it("recepción de venta obliga foto y no reembolsa automáticamente", async () => {
  const r = sale(); await bookCase("case", tech, booking); vi.setSystemTime(new Date(booking.startsAt));
  await expect(returnCase("case", tech, { ...review, photoUrl: undefined })).rejects.toMatchObject({ code: "BAD_PHOTO" });
  expect(h.order.update).not.toHaveBeenCalled(); await returnCase("case", tech, review);
  expect(r.status).toBe("RETURNED"); expect(r.returnedAt).toBeInstanceOf(Date); expect(h.payout.update).not.toHaveBeenCalled();
});
it("recepción no admite foto de otro trabajador", async () => {
  sale(); await bookCase("case", tech, booking); vi.setSystemTime(new Date(booking.startsAt)); h.upload.findUnique.mockResolvedValue({ ownerId: "other", detectedMime: "image/png" });
  await expect(returnCase("case", tech, review)).rejects.toMatchObject({ code: "BAD_PHOTO" });
});
it("BACK_TO_SELLER reembolsado admite cita y libera stock solo tras entrega física", async () => {
  const r = sale("BACK_TO_SELLER"); r.order.status = "REFUNDED"; h.payout.findUnique.mockResolvedValue({ status: "REFUNDED", refundRequired: true });
  const a = await bookCase("case", tech, { ...booking, kind: "BACK_TO_SELLER" });
  expect(h.bazarItem.update).not.toHaveBeenCalled(); vi.setSystemTime(a.startsAt); await backToSeller("case", tech);
  expect(r.status).toBe("CLOSED"); expect(r.order.status).toBe("REFUNDED");
  expect(h.bazarItem.update).toHaveBeenCalledWith({ where: { id: "item" }, data: { status: "AVAILABLE" } });
});

it("no devuelve objeto al vendedor mientras el reembolso autorizado sigue pendiente", async () => {
  const r = sale("BACK_TO_SELLER"); r.appointments[0].kind = "BACK_TO_SELLER";
  await expect(backToSeller("case", tech)).rejects.toMatchObject({ code: "REFUND_REQUIRED" });
  expect(h.bazarItem.update).not.toHaveBeenCalled();
});
