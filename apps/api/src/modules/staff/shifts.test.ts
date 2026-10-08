import { beforeEach, describe, expect, it } from "vitest";
import { h, resetSchedule, protectedRouter, request } from "./scheduleFixture.js";
import { shiftsRouter } from "./shifts.js";
const router = protectedRouter(shiftsRouter);
const shift = { userId: "worker", sedeId: "sede", weekday: 1, startsMin: 480, endsMin: 780 };
beforeEach(resetSchedule);
describe("turnos", () => {
  it("trabajador solo ve propios aunque pida otro", async () => {
    await request(router, "GET", "/", "moderator:worker", {}, { userId: "other" });
    expect(h.staffShift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "worker" } }));
  });
  it("técnico ve todos", async () => { await request(router, "GET", "/", "admin"); expect(h.staffShift.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} })); });
  it.each(["POST", "PATCH", "DELETE"])("trabajador no escribe %s", async (method) => { expect((await request(router, method, method === "POST" ? "/" : "/shift", "moderator", shift)).status).toBe(403); });
  it("crea turno válido, solape entre sedes y bordes abiertos", async () => {
    expect((await request(router, "POST", "/", "admin", shift)).status).toBe(201);
    expect(h.staffShift.count).toHaveBeenCalledWith({ where: { userId: "worker", weekday: 1, startsMin: { lt: 780 }, endsMin: { gt: 480 } } });
    expect(h.lock.mock.invocationCallOrder[0]).toBeLessThan(h.staffShift.count.mock.invocationCallOrder[0]); expect(h.auditLog.create).toHaveBeenCalled();
  });
  it("solape impide guardar", async () => { h.staffShift.count.mockResolvedValue(1); expect((await request(router, "POST", "/", "admin", shift)).status).toBe(409); expect(h.staffShift.create).not.toHaveBeenCalled(); });
  it("día cerrado no admite turno", async () => { h.openingHours.findUnique.mockResolvedValue(null); expect((await request(router, "POST", "/", "admin", shift)).status).toBe(409); });
  it("fuera del horario no admite turno", async () => { expect((await request(router, "POST", "/", "admin", { ...shift, startsMin: 470 })).status).toBe(409); });
  it("sede inactiva no admite turno", async () => { h.sede.findUnique.mockResolvedValue({ active: false }); expect((await request(router, "POST", "/", "admin", shift)).status).toBe(409); });
  it("usuario sin rol equipo no admite turno", async () => { h.user.findUnique.mockResolvedValue({ role: "student" }); expect((await request(router, "POST", "/", "admin", shift)).status).toBe(409); });
  it("editar excluye el propio id al buscar solape", async () => {
    expect((await request(router, "PATCH", "/shift", "admin", shift)).status).toBe(200);
    expect(h.staffShift.count).toHaveBeenCalledWith({ where: { userId: "worker", weekday: 1, startsMin: { lt: 780 }, endsMin: { gt: 480 }, id: { not: "shift" } } });
  });
  it("borrar turno audita", async () => { expect((await request(router, "DELETE", "/shift", "admin")).status).toBe(200); expect(h.auditLog.create).toHaveBeenCalled(); });
});
