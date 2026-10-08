import { beforeEach, describe, expect, it } from "vitest";
import { h, resetSchedule, protectedRouter, request } from "./scheduleFixture.js";
import { staffSedesRouter } from "./sedes.js";
import { sedesRouter } from "../sedes/routes.js";
const staff = protectedRouter(staffSedesRouter);
beforeEach(resetSchedule);
describe("sedes públicas y permisos", () => {
  it("público lista solo activas sin turnos ni usuarios", async () => {
    expect((await request(sedesRouter, "GET", "/")).status).toBe(200);
    expect(h.sede.findMany).toHaveBeenCalledWith({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, address: true, meetingPoint: true, photoUrl: true } });
  });
  it("feriados públicos desde hoy Lima y máximo 60", async () => {
    await request(sedesRouter, "GET", "/schedule");
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(new Date());
    expect(h.holiday.findMany).toHaveBeenCalledWith({ where: { date: { gte: new Date(`${today}T00:00:00Z`) } }, orderBy: { date: "asc" }, take: 60 });
  });
  it.each([undefined, "student"])("administración exige equipo: %s", async (role) => { expect((await request(staff, "GET", "/", role)).status).toBe(role ? 403 : 401); });
  it("trabajador lee todas las sedes pero no crea", async () => {
    expect((await request(staff, "GET", "/", "moderator")).status).toBe(200);
    expect((await request(staff, "POST", "/", "moderator", { name: "Sede" })).status).toBe(403);
  });
  it("técnico crea bajo lock y auditoría en transacción", async () => {
    expect((await request(staff, "POST", "/", "admin", { name: "Sede" })).status).toBe(201);
    expect(h.lock.mock.invocationCallOrder[0]).toBeLessThan(h.sede.create.mock.invocationCallOrder[0]);
    expect(h.auditLog.create).toHaveBeenCalledWith({ data: { actorId: "actor", action: "sede.create", entity: "sede", entityId: "sede" } });
  });
  it.each(["https://example.test/photo.png", "/uploads/../private", "//evil.test/p.png"])("rechaza foto externa/insegura %s", async (photoUrl) => {
    expect((await request(staff, "POST", "/", "admin", { name: "Sede", photoUrl })).status).toBe(400);
  });
  it("foto interna y modificación parcial válidas", async () => {
    expect((await request(staff, "PATCH", "/sede", "admin", { photoUrl: "/uploads/foto.jpg" })).status).toBe(200);
    expect(h.sede.update).toHaveBeenCalledWith({ where: { id: "sede" }, data: { photoUrl: "/uploads/foto.jpg" } });
  });
  it.each(["DELETE", "PATCH"])("%s no desactiva sede con turnos", async (method) => {
    h.staffShift.count.mockResolvedValue(1);
    expect((await request(staff, method, "/sede", "admin", { active: false })).status).toBe(409);
    expect(h.sede.update).not.toHaveBeenCalled(); expect(h.auditLog.create).not.toHaveBeenCalled();
  });
  it("eliminar desactiva sin borrar sede", async () => {
    expect((await request(staff, "DELETE", "/sede", "admin")).status).toBe(200);
    expect(h.sede.update).toHaveBeenCalledWith({ where: { id: "sede" }, data: { active: false } }); expect(h.sede.delete).not.toHaveBeenCalled();
  });
});
