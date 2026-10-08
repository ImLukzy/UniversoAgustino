import { beforeEach, describe, expect, it } from "vitest";
import { h, resetSchedule, protectedRouter, request } from "./scheduleFixture.js";
import { scheduleRouter } from "./schedule.js";
const router = protectedRouter(scheduleRouter);
beforeEach(resetSchedule);
describe("horarios y feriados", () => {
  it("trabajador consulta pero no modifica", async () => {
    expect((await request(router, "GET", "/", "moderator")).status).toBe(200);
    expect((await request(router, "PUT", "/hours/1", "moderator", { opens: 480, closes: 1080 })).status).toBe(403);
  });
  it("guarda sábado especial y audita", async () => {
    expect((await request(router, "PUT", "/hours/6", "admin", { opens: 480, closes: 780, special: true })).status).toBe(200);
    expect(h.openingHours.upsert).toHaveBeenCalledWith({ where: { weekday: 6 }, create: { weekday: 6, opens: 480, closes: 780, special: true }, update: { opens: 480, closes: 780, special: true } });
    expect(h.auditLog.create).toHaveBeenCalled();
  });
  it.each([{ opens: 600, closes: 500 }, { opens: -1, closes: 500 }, { opens: 480.5, closes: 600 }])("rechaza horario %j", async (body) => {
    expect((await request(router, "PUT", "/hours/1", "admin", body)).status).toBe(400);
  });
  it.each(["PUT", "DELETE"])("%s no invalida turnos existentes", async (method) => {
    h.staffShift.count.mockResolvedValue(1);
    expect((await request(router, method, "/hours/1", "admin", { opens: 480, closes: 900 })).status).toBe(409);
    expect(h.openingHours.upsert).not.toHaveBeenCalled(); expect(h.openingHours.delete).not.toHaveBeenCalled();
  });
  it("domingo se puede cerrar sin turnos", async () => {
    expect((await request(router, "DELETE", "/hours/0", "admin")).status).toBe(200); expect(h.auditLog.create).toHaveBeenCalled();
  });
  it("crea feriado de fecha real y audita", async () => {
    expect((await request(router, "POST", "/holidays", "admin", { date: "2026-12-25", reason: "Navidad" })).status).toBe(201);
    expect(h.holiday.create).toHaveBeenCalledWith({ data: { date: new Date("2026-12-25T00:00:00Z"), reason: "Navidad" } });
  });
  it("fecha inexistente rechazada", async () => { expect((await request(router, "POST", "/holidays", "admin", { date: "2026-02-30", reason: "Feriado" })).status).toBe(400); });
  it("borra feriado con auditoría", async () => { expect((await request(router, "DELETE", "/holidays/holiday", "admin")).status).toBe(200); expect(h.auditLog.create).toHaveBeenCalled(); });
});
