import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actor, h, order, row, resetCases } from "./caseFixture.js";
import { assignCase } from "./assignment.js";
import { receiveCase } from "./receive.js";
import { acceptWithCase, cancelPhysical } from "./orderChanges.js";
beforeEach(resetCases); afterEach(() => vi.useRealTimers());
describe("asignación y custodia", () => {
  it("tomar sin asignación audita bajo lock y avisa después", async () => {
    h.handoverCase.findUnique.mockResolvedValue({ ...row, assigneeId: null, status: "UNASSIGNED" });
    await assignCase("case", "worker", actor, true);
    expect(h.lock.mock.invocationCallOrder[0]).toBeLessThan(h.handoverCase.findUnique.mock.invocationCallOrder[0]);
    expect(h.auditLog.create.mock.invocationCallOrder[0]).toBeLessThan(h.notify.mock.invocationCallOrder[0]);
    expect(h.handoverCase.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ assigneeId: "worker", status: "ASSIGNED" }) }));
  });
  it("segunda toma no reasigna ni avisa", async () => { await expect(assignCase("case", "other", actor, true)).rejects.toMatchObject({ code: "ALREADY_ASSIGNED" }); expect(h.notify).not.toHaveBeenCalled(); });
  it("trabajador no asigna a otro", async () => { await expect(assignCase("case", "other", actor)).rejects.toMatchObject({ status: 403 }); });
  it("rol revocado no puede tomar", async () => { h.user.findUnique.mockResolvedValue({ role: "creator" }); await expect(assignCase("case", "worker", actor, true)).rejects.toMatchObject({ status: 403 }); });
  it("técnico reasigna antes de custodia y cancela citas", async () => { h.user.findUnique.mockResolvedValue({ role: "admin" }); await assignCase("case", "other", { sub: "tech", role: "admin" }); expect(h.appointment.updateMany).toHaveBeenCalledWith({ where: { caseId: "case", status: "SCHEDULED" }, data: { status: "CANCELLED" } }); });
  it("no reasigna en custodia", async () => { h.user.findUnique.mockResolvedValue({ role: "admin" }); h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "IN_CUSTODY" }); await expect(assignCase("case", "other", { sub: "tech", role: "admin" })).rejects.toMatchObject({ code: "BAD_STATE" }); });
  it("aceptar crea caso antes de audit y notificación", async () => {
    h.order.findUniqueOrThrow.mockResolvedValue({ ...order, status: "PENDING" }); await acceptWithCase("order", "seller");
    expect(h.handoverCase.create).toHaveBeenCalledWith({ data: { orderId: "order" } });
    expect(h.handoverCase.create.mock.invocationCallOrder[0]).toBeLessThan(h.auditLog.create.mock.invocationCallOrder[0]);
  });
  it("aceptación perdida no crea caso ni audit", async () => { h.order.findUniqueOrThrow.mockResolvedValue({ ...order, status: "PENDING" }); h.order.updateMany.mockResolvedValue({ count: 0 }); await expect(acceptWithCase("order", "seller")).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.handoverCase.create).not.toHaveBeenCalled(); expect(h.auditLog.create).not.toHaveBeenCalled(); });
  it("fallo al crear caso se propaga sin auditar éxito", async () => { h.order.findUniqueOrThrow.mockResolvedValue({ ...order, status: "PENDING" }); h.handoverCase.create.mockRejectedValue(new Error("DB")); await expect(acceptWithCase("order", "seller")).rejects.toThrow("DB"); expect(h.auditLog.create).not.toHaveBeenCalled(); });
  it("cancelar antes de recibir cierra caso/citas y libera stock", async () => { h.order.findUniqueOrThrow.mockResolvedValue({ ...order, handoverCase: row }); await cancelPhysical("order", "buyer"); expect(h.appointment.updateMany).toHaveBeenCalled(); expect(h.handoverCase.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) })); expect(h.bazarItem.updateMany).toHaveBeenCalled(); });
  it("cancelar bajo custodia no libera ni cancela citas", async () => { h.order.findUniqueOrThrow.mockResolvedValue({ ...order, handoverCase: { ...row, status: "IN_CUSTODY" } }); await expect(cancelPhysical("order", "buyer")).rejects.toMatchObject({ code: "IN_CUSTODY" }); expect(h.bazarItem.updateMany).not.toHaveBeenCalled(); expect(h.appointment.updateMany).not.toHaveBeenCalled(); });
});
const drop = { id: "drop", kind: "DROP_OFF", status: "SCHEDULED", startsAt: new Date("2026-10-08T11:55:00Z"), endsAt: new Date("2026-10-08T12:10:00Z") };
describe("recepción con evidencia", () => {
  beforeEach(() => h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "DROP_SCHEDULED", appointments: [drop] }));
  it("recibe foto propia real, completa cita y avisa", async () => { await receiveCase("case", actor, "/uploads/foto.png", "Buen estado"); expect(h.hasObject).toHaveBeenCalledWith("foto.png"); expect(h.appointment.update).toHaveBeenCalledWith({ where: { id: "drop" }, data: { status: "DONE" } }); expect(h.handoverCase.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "IN_CUSTODY", conditionNote: "Buen estado" }) })); expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ type: "ORDER_IN_CUSTODY", userId: "buyer" })); });
  it.each([{ ownerId: "other", detectedMime: "image/png" }, { ownerId: "worker", detectedMime: "application/pdf" }, null])("rechaza foto inválida %j", async (upload) => { h.upload.findUnique.mockResolvedValue(upload); await expect(receiveCase("case", actor, "/uploads/foto.png", "Buen estado")).rejects.toMatchObject({ code: "BAD_PHOTO" }); expect(h.appointment.update).not.toHaveBeenCalled(); });
  it("rechaza archivo inexistente", async () => { h.hasObject.mockResolvedValue(false); await expect(receiveCase("case", actor, "/uploads/foto.png", "Buen estado")).rejects.toMatchObject({ code: "BAD_PHOTO" }); });
  it("no recibe fuera de cita", async () => { vi.setSystemTime(new Date("2026-10-08T12:11:00Z")); await expect(receiveCase("case", actor, "/uploads/foto.png", "Buen estado")).rejects.toMatchObject({ code: "BAD_STATE" }); });
  it("otro trabajador no recibe", async () => { await expect(receiveCase("case", { sub: "other", role: "moderator" }, "/uploads/foto.png", "Buen estado")).rejects.toMatchObject({ status: 403 }); });
});
