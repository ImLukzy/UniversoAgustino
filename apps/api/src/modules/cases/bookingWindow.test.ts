import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actor, h, resetCases } from "./caseFixture.js";
import { physicalFlow } from "./fulfillmentFixture.js";
import { pickupCase } from "./pickup.js";
import { bookCase, markNoShow } from "./appointments.js";
import { returnCase } from "./returns.js";
const cash = { paymentMethod: "CASH" as const, paymentConfirmed: true as const };
const booking = { kind: "RETURN" as const, sedeId: "sede", startsAt: "2026-10-12T13:00:00Z" };
beforeEach(resetCases); afterEach(() => vi.useRealTimers());
describe("ventanas de devolución y retorno", () => {
  it("no permite RETURN antes de la fecha final hábil", async () => { physicalFlow(true); await pickupCase("case", actor, cash); await expect(bookCase("case", actor, { ...booking, startsAt: "2026-10-10T13:00:00Z" })).rejects.toMatchObject({ code: "BEFORE_RETURN_DATE" }); });
  it("feriado desplaza primera devolución sin cambiar rentalEnd", async () => {
    const stored = physicalFlow(true); h.holiday.findMany.mockResolvedValue([{ date: new Date("2026-10-12T00:00:00Z") }]);
    await pickupCase("case", actor, { ...cash, returnAppointment: { ...booking, startsAt: "2026-10-13T13:00:00Z" } });
    expect(stored.returnWindowStart).toEqual(new Date("2026-10-13T05:00:00Z")); expect(stored.order.rentalEnd).toEqual(new Date("2026-10-11T12:00:00Z"));
  });
  it("primer día necesita turno del custodio en la sede", async () => {
    const stored = physicalFlow(true); h.staffShift.findMany.mockResolvedValue([{ weekday: 2, startsMin: 480, endsMin: 1080 }]);
    await pickupCase("case", actor, { ...cash, returnAppointment: { ...booking, startsAt: "2026-10-13T13:00:00Z" } }); expect(stored.returnWindowStart).toEqual(new Date("2026-10-13T05:00:00Z"));
  });
  it("sin turnos no bloquea recojo sin cita adjunta", async () => { const stored = physicalFlow(true); h.staffShift.findMany.mockResolvedValue([]); await pickupCase("case", actor, cash); expect(stored.status).toBe("RENTED_OUT"); await expect(bookCase("case", actor, booking)).rejects.toMatchObject({ code: "NO_AVAILABILITY" }); });
  it("reprogramación RETURN conserva ventana original", async () => {
    const stored = physicalFlow(true); await pickupCase("case", actor, { ...cash, returnAppointment: booking });
    const original = stored.returnDeadlineAt, first = stored.appointments.find((a) => a.kind === "RETURN")!;
    vi.setSystemTime(new Date("2026-10-12T13:20:00Z")); await markNoShow("case", first.id, actor);
    h.holiday.findMany.mockResolvedValue([{ date: new Date("2026-10-12T00:00:00Z") }]);
    await bookCase("case", actor, { ...booking, startsAt: "2026-10-13T13:00:00Z" }, first.id);
    expect(stored.returnDeadlineAt).toBe(original); expect(stored.returnWindowStart).toEqual(new Date("2026-10-12T05:00:00Z"));
  });
  it("RETURN agotado queda en revisión, sin liberar pedido ni objeto", async () => {
    const stored = physicalFlow(true); await pickupCase("case", actor, { ...cash, returnAppointment: booking });
    const first = stored.appointments.find((a) => a.kind === "RETURN")!;
    vi.setSystemTime(new Date("2026-10-12T13:20:00Z")); await markNoShow("case", first.id, actor);
    await bookCase("case", actor, { ...booking, startsAt: "2026-10-13T13:00:00Z" }, first.id);
    const replacement = stored.appointments.at(-1)!; vi.setSystemTime(new Date("2026-10-13T13:20:00Z")); await markNoShow("case", replacement.id, actor);
    h.appointment.count.mockResolvedValue(1); await expect(bookCase("case", actor, { ...booking, startsAt: "2026-10-14T13:00:00Z" }, replacement.id)).rejects.toMatchObject({ code: "RESCHEDULE_LIMIT" });
    expect(stored.status).toBe("RETURN_SCHEDULED"); expect(stored.order.status).toBe("ESCROW"); expect(h.bazarItem.update).toHaveBeenCalledTimes(1);
  });
  it("retorno al vendedor conserva ancla al reprogramar", async () => {
    const stored = physicalFlow(); Object.assign(stored.appointments[0], { rescheduledFromId: "first", endsAt: new Date("2026-10-08T11:00:00Z") }); await markNoShow("case", "pickup", actor);
    const anchor = stored.backToSellerRequestedAt;
    await bookCase("case", actor, { kind: "BACK_TO_SELLER", sedeId: "sede", startsAt: "2026-10-09T13:00:00Z" });
    const first = stored.appointments.at(-1)!; vi.setSystemTime(new Date("2026-10-09T13:20:00Z")); await markNoShow("case", first.id, actor);
    await bookCase("case", actor, { kind: "BACK_TO_SELLER", sedeId: "sede", startsAt: "2026-10-10T13:00:00Z" }, first.id);
    expect(stored.backToSellerRequestedAt).toBe(anchor); expect(h.bazarItem.update).not.toHaveBeenCalled();
  });
  it("foto de devolución ajena no libera el pedido", async () => {
    const stored = physicalFlow(true); await pickupCase("case", actor, { ...cash, returnAppointment: booking });
    vi.setSystemTime(new Date("2026-10-12T13:05:00Z")); h.upload.findUnique.mockResolvedValue({ ownerId: "other", detectedMime: "image/png" });
    await expect(returnCase("case", actor, { condition: "OK", conditionNote: "Buen estado", reviewConfirmed: true, photoUrl: "/uploads/photo.png" })).rejects.toMatchObject({ code: "BAD_PHOTO" }); expect(stored.order.status).toBe("ESCROW");
  });
  it("NO_SHOW exige estar después del fin, no exactamente al final", async () => { const stored = physicalFlow(); stored.appointments[0].endsAt = new Date(); await expect(markNoShow("case", "pickup", actor)).rejects.toMatchObject({ code: "BAD_STATE" }); });
});
