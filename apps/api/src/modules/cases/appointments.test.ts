import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actor, h, row, resetCases } from "./caseFixture.js";
import { bookCase, markNoShow } from "./appointments.js";
import { protectShift, protectHoliday } from "./scheduleProtection.js";
import { prisma } from "../../lib/prisma.js";
const input = { kind: "DROP_OFF" as const, sedeId: "sede", startsAt: "2026-10-09T13:00:00Z" };
beforeEach(resetCases); afterEach(() => vi.useRealTimers());
describe("citas transaccionales", () => {
  it("programa entrega para vendedor con turno", async () => { await bookCase("case", actor, input); expect(h.appointment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ partyId: "seller", shiftId: "shift" }) })); expect(h.auditLog.create).toHaveBeenCalled(); });
  it("recojo usa sede de custodia, comprador y aviso completo", async () => {
    h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "IN_CUSTODY", receivedAt: new Date(), receivedPhotoUrl: "/uploads/foto.png" });
    await bookCase("case", actor, { ...input, kind: "PICKUP" });
    const notice = h.notify.mock.calls[0][0]; expect(notice.userId).toBe("buyer");
    for (const piece of ["Trabajador", "Campus", "Calle 1", "Puerta", "15.00"]) expect(notice.body).toContain(piece);
    expect(notice.body).not.toContain("/uploads/"); expect(notice.link).toBe("/pedidos");
  });
  it("sin turno no crea cita", async () => { h.staffShift.findFirst.mockResolvedValue(null); await expect(bookCase("case", actor, input)).rejects.toMatchObject({ code: "OUTSIDE_SHIFT" }); expect(h.appointment.create).not.toHaveBeenCalled(); });
  it("solape de custodio rechaza sin crear ni avisar", async () => { h.appointment.count.mockResolvedValue(1); await expect(bookCase("case", actor, input)).rejects.toMatchObject({ code: "SLOT_TAKEN" }); expect(h.notify).not.toHaveBeenCalled(); });
  it("intervalo excluye extremos contiguos", async () => { await bookCase("case", actor, input); expect(h.appointment.count).toHaveBeenCalledWith({ where: { staffId: "worker", status: "SCHEDULED", startsAt: { lt: new Date("2026-10-09T13:15:00Z") }, endsAt: { gt: new Date(input.startsAt) } } }); });
  it("sede inactiva no recibe citas", async () => { h.sede.findUnique.mockResolvedValue({ active: false }); await expect(bookCase("case", actor, input)).rejects.toMatchObject({ code: "SEDE_INACTIVE" }); });
  it("recojo no mueve objeto a otra sede", async () => { h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "IN_CUSTODY", receivedAt: new Date(), sedeId: "other" }); await expect(bookCase("case", actor, { ...input, kind: "PICKUP" })).rejects.toMatchObject({ code: "BAD_STATE" }); });
  it("trabajador ajeno no programa", async () => { await expect(bookCase("case", { ...actor, sub: "other" }, input)).rejects.toMatchObject({ status: 403 }); });
  it("NO_SHOW exige cita terminada y SCHEDULED", async () => {
    h.appointment.findUnique.mockResolvedValue({ id: "drop", caseId: "case", status: "SCHEDULED", endsAt: new Date("2026-10-08T12:15:00Z") });
    await expect(markNoShow("case", "drop", actor)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.appointment.update).not.toHaveBeenCalled();
  });
  it("NO_SHOW terminado avisa sin sanción", async () => { h.appointment.findUnique.mockResolvedValue({ id: "drop", caseId: "case", status: "SCHEDULED", endsAt: new Date("2026-10-08T11:00:00Z") }); await markNoShow("case", "drop", actor); expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "ORDER_APPOINTMENT_NO_SHOW" })); expect(h.order.update).not.toHaveBeenCalled(); });
  it("NO_SHOW repetido no vuelve a avisar", async () => { h.appointment.findUnique.mockResolvedValue({ id: "drop", caseId: "case", status: "NO_SHOW", endsAt: new Date(0) }); await expect(markNoShow("case", "drop", actor)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.notify).not.toHaveBeenCalled(); });
  it("reprograma una ausencia conservando enlace histórico", async () => { h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "DROP_SCHEDULED" }); h.appointment.findUnique.mockResolvedValue({ id: "drop", caseId: "case", kind: "DROP_OFF", status: "NO_SHOW" }); await bookCase("case", actor, input, "drop"); expect(h.appointment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ rescheduledFromId: "drop" }) })); });
  it("reasignar no salta el historial de ausencias", async () => {
    h.appointment.findFirst.mockResolvedValue({ status: "NO_SHOW" });
    await expect(bookCase("case", actor, input)).rejects.toMatchObject({ code: "RESCHEDULE_REQUIRED" }); expect(h.appointment.create).not.toHaveBeenCalled();
  });
  it("segunda reprogramación falla antes de crear", async () => { h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "DROP_SCHEDULED" }); h.appointment.findUnique.mockResolvedValue({ id: "drop", caseId: "case", kind: "DROP_OFF", status: "NO_SHOW" }); h.appointment.count.mockResolvedValue(1); await expect(bookCase("case", actor, input, "drop")).rejects.toMatchObject({ code: "RESCHEDULE_LIMIT" }); expect(h.appointment.create).not.toHaveBeenCalled(); });
  it("no borrar turno con cita futura", async () => { h.appointment.findMany.mockResolvedValue([{ staffId: "worker", sedeId: "sede", startsAt: new Date(input.startsAt) }]); await expect(protectShift(prisma, "shift")).rejects.toMatchObject({ code: "HAS_APPOINTMENTS" }); });
  it("editar turno conservando cita sí", async () => { h.appointment.findMany.mockResolvedValue([{ staffId: "worker", sedeId: "sede", startsAt: new Date(input.startsAt) }]); await expect(protectShift(prisma, "shift", { userId: "worker", sedeId: "sede", weekday: 5, startsMin: 480, endsMin: 540 })).resolves.toBeUndefined(); });
  it("feriado no puede invalidar citas", async () => { h.appointment.count.mockResolvedValue(1); await expect(protectHoliday(prisma, "2026-10-09")).rejects.toMatchObject({ code: "HAS_APPOINTMENTS" }); });
});
