import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { actor, h, row, resetCases } from "./caseFixture.js";
import { cancelCase } from "./cancel.js";
beforeEach(resetCases); afterEach(() => vi.useRealTimers());
describe("cancelación del equipo antes de custodia", () => {
  it("tras segunda ausencia cancela caso/pedido/citas y libera stock", async () => {
    h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "DROP_SCHEDULED", appointments: [{ kind: "DROP_OFF", status: "NO_SHOW", rescheduledFromId: "first" }] });
    await cancelCase("case", actor);
    expect(h.order.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED", cancelledReason: "TEAM_CANCELLED" }) }));
    expect(h.handoverCase.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) }));
    expect(h.appointment.updateMany).toHaveBeenCalledWith({ where: { caseId: "case", status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    expect(h.bazarItem.updateMany).toHaveBeenCalledWith({ where: { id: "item", status: "RESERVED" }, data: { status: "AVAILABLE" } });
    expect(h.auditLog.create).toHaveBeenCalledTimes(2); expect(h.notify).toHaveBeenCalledTimes(2);
    expect(h.auditLog.create.mock.invocationCallOrder[1]).toBeLessThan(h.notify.mock.invocationCallOrder[0]);
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "buyer", type: "ORDER_CANCELLED" }));
    expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: "seller", type: "ORDER_CANCELLED" }));
  });
  it("técnico cancela caso sin asignar", async () => { h.user.findUnique.mockResolvedValue({ role: "admin" }); h.handoverCase.findUnique.mockResolvedValue({ ...row, status: "UNASSIGNED", assigneeId: null }); await expect(cancelCase("case", { sub: "tech", role: "admin" })).resolves.toMatchObject({ status: "CANCELLED" }); });
  it("trabajador ajeno no cancela", async () => { await expect(cancelCase("case", { sub: "other", role: "moderator" })).rejects.toMatchObject({ status: 403 }); expect(h.order.update).not.toHaveBeenCalled(); });
  it.each(["IN_CUSTODY", "PICKUP_SCHEDULED", "CANCELLED"])("%s no libera stock ni avisa", async (status) => { h.handoverCase.findUnique.mockResolvedValue({ ...row, status }); await expect(cancelCase("case", actor)).rejects.toMatchObject({ code: "IN_CUSTODY" }); expect(h.bazarItem.updateMany).not.toHaveBeenCalled(); expect(h.notify).not.toHaveBeenCalled(); });
  it("pedido que ya cambió no salta canTransition", async () => { h.handoverCase.findUnique.mockResolvedValue({ ...row, order: { ...row.order, status: "RELEASED" } }); await expect(cancelCase("case", actor)).rejects.toMatchObject({ code: "BAD_STATE" }); expect(h.handoverCase.update).not.toHaveBeenCalled(); });
  it("fallo de inventario no audita éxito ni avisa", async () => { h.bazarItem.updateMany.mockRejectedValue(new Error("DB")); await expect(cancelCase("case", actor)).rejects.toThrow("DB"); expect(h.auditLog.create).not.toHaveBeenCalled(); expect(h.notify).not.toHaveBeenCalled(); });
});
