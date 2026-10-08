import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actor, h, resetCases } from "./caseFixture.js";
import { physicalFlow } from "./fulfillmentFixture.js";
import { pickupCase } from "./pickup.js";
import { returnCase } from "./returns.js";
import { backToSeller } from "./close.js";
import { bookCase, markNoShow } from "./appointments.js";
const paid = { paymentMethod: "OPERATION" as const, paymentRef: " 12345 ", paymentConfirmed: true as const };
const cash = { paymentMethod: "CASH" as const, paymentConfirmed: true as const };
beforeEach(resetCases); afterEach(() => vi.useRealTimers());
describe("recojo físico certificado", () => {
  it("venta pasa PAID→ESCROW→RELEASED, SOLD y CLOSED", async () => {
    const stored = physicalFlow(); await pickupCase("case", actor, paid);
    expect(h.order.update.mock.calls.map(([v]) => v.data.status)).toEqual(["PAID", "ESCROW", "RELEASED"]);
    expect(h.handoverCase.update.mock.calls.map(([v]) => v.data.status)).toEqual(["DELIVERED", "CLOSED"]);
    expect(stored.paymentRef).toBe("12345"); expect(stored.appointments[0].status).toBe("DONE");
    expect(h.bazarItem.update).toHaveBeenCalledWith({ where: { id: "item" }, data: { status: "SOLD" } });
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "seller", body: expect.stringContaining("15.00; 12345") }));
    expect(h.auditLog.create.mock.invocationCallOrder.at(-1)).toBeLessThan(h.notify.mock.invocationCallOrder[0]);
  });
  it("efectivo se guarda y se avisa al vendedor", async () => { const stored = physicalFlow(); await pickupCase("case", actor, cash); expect(stored.paymentRef).toBe("efectivo"); expect(stored.paymentMethod).toBe("CASH"); expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "seller", body: expect.stringContaining("efectivo") })); });
  it("sin confirmación explícita no escribe", async () => { physicalFlow(); await expect(pickupCase("case", actor, { ...cash, paymentConfirmed: false } as unknown as typeof cash)).rejects.toThrow(); expect(h.order.update).not.toHaveBeenCalled(); });
  it("sin operación no entrega", async () => { physicalFlow(); await expect(pickupCase("case", actor, { paymentMethod: "OPERATION", paymentConfirmed: true })).rejects.toThrow(); expect(h.appointment.update).not.toHaveBeenCalled(); });
  it("fuera de cita no entrega", async () => { physicalFlow(); vi.setSystemTime(new Date("2026-10-08T12:11:00Z")); await expect(pickupCase("case", actor, cash)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.order.update).not.toHaveBeenCalled(); });
  it("trabajador ajeno no entrega", async () => { physicalFlow(); await expect(pickupCase("case", { ...actor, sub: "other" }, cash)).rejects.toMatchObject({ status: 403 }); });
  it("repetir recojo no crea otro escrow ni aviso", async () => { physicalFlow(); await pickupCase("case", actor, cash); const count = h.notify.mock.calls.length; await expect(pickupCase("case", actor, cash)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.notify).toHaveBeenCalledTimes(count); expect(h.order.update).toHaveBeenCalledTimes(3); });
  it("estado financiero cambiado no salta canTransition", async () => { const stored = physicalFlow(); stored.order.status = "ESCROW"; await expect(pickupCase("case", actor, cash)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.order.update).not.toHaveBeenCalled(); });
  it("fallo en inventario no audita éxito ni avisa", async () => { physicalFlow(); h.bazarItem.update.mockRejectedValue(new Error("DB")); await expect(pickupCase("case", actor, cash)).rejects.toThrow("DB"); expect(h.auditLog.create).not.toHaveBeenCalled(); expect(h.notify).not.toHaveBeenCalled(); });
});
describe("alquiler y retorno", () => {
  it("alquiler conserva ESCROW/RENTED y permite programar después", async () => { const stored = physicalFlow(true); await pickupCase("case", actor, cash); expect(stored.order.status).toBe("ESCROW"); expect(stored.status).toBe("RENTED_OUT"); expect(h.bazarItem.update).toHaveBeenCalledWith({ where: { id: "item" }, data: { status: "RENTED" } }); });
  it("domingo final admite RETURN lunes sin alterar snapshot", async () => {
    const stored = physicalFlow(true), originalEnd = stored.order.rentalEnd;
    await pickupCase("case", actor, { ...cash, returnAppointment: { kind: "RETURN", sedeId: "sede", startsAt: "2026-10-12T13:00:00Z" } });
    expect(stored.status).toBe("RETURN_SCHEDULED"); expect(stored.order.rentalEnd).toBe(originalEnd);
    expect(stored.returnWindowStart).toEqual(new Date("2026-10-12T05:00:00Z"));
    vi.setSystemTime(new Date("2026-10-12T13:05:00Z"));
    await returnCase("case", actor, { condition: "OK", conditionNote: "Devolución conforme", reviewConfirmed: true, photoUrl: "/uploads/return.png" });
    expect(stored.status).toBe("RETURNED"); expect(stored.order.status).toBe("RELEASED");
    expect(stored.conditionNote).toBe("Estado inicial"); expect(stored.receivedPhotoUrl).toBe("/uploads/original.png");
    expect(stored).toMatchObject({ returnCondition: "OK", returnConditionNote: "Devolución conforme", returnPhotoUrl: "/uploads/return.png" });
    expect(h.bazarItem.update).toHaveBeenCalledTimes(1);
    await bookCase("case", actor, { kind: "BACK_TO_SELLER", sedeId: "sede", startsAt: "2026-10-13T13:00:00Z" });
    expect(stored.status).toBe("BACK_TO_SELLER"); expect(h.bazarItem.update).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-10-13T13:05:00Z")); await backToSeller("case", actor);
    expect(stored.status).toBe("CLOSED"); expect(stored.order.status).toBe("RELEASED"); expect(h.bazarItem.update).toHaveBeenLastCalledWith({ where: { id: "item" }, data: { status: "AVAILABLE" } });
  });
  it("no acepta revisión sin confirmación", async () => { physicalFlow(true); await expect(returnCase("case", actor, { condition: "OK", conditionNote: "Buen estado" })).rejects.toThrow(); expect(h.order.update).not.toHaveBeenCalled(); });
  it("segunda ausencia de PICKUP fija ancla para devolver", async () => {
    const stored = physicalFlow(); Object.assign(stored.appointments[0], { rescheduledFromId: "first", endsAt: new Date("2026-10-08T11:00:00Z") });
    await markNoShow("case", "pickup", actor); expect(stored.backToSellerRequestedAt).toEqual(new Date("2026-10-08T11:00:00Z"));
    await bookCase("case", actor, { kind: "BACK_TO_SELLER", sedeId: "sede", startsAt: "2026-10-09T13:00:00Z" });
    expect(stored.order.status).toBe("ACCEPTED"); expect(h.bazarItem.update).not.toHaveBeenCalled();
    vi.setSystemTime(new Date("2026-10-09T13:05:00Z")); await backToSeller("case", actor);
    expect(stored.order.status).toBe("CANCELLED"); expect(stored.status).toBe("CLOSED"); expect(h.bazarItem.update).toHaveBeenCalledWith({ where: { id: "item" }, data: { status: "AVAILABLE" } });
  });
  it("retorno físico no puede ejecutarse sin cita", async () => { physicalFlow(); await expect(backToSeller("case", actor)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.bazarItem.update).not.toHaveBeenCalled(); });
});
