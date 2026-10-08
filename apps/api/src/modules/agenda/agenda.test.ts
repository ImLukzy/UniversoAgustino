import express from "express";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => {
  const m = () => ({ findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() });
  return { openingHours: m(), holiday: m(), appointment: m(), staffShift: m(), user: m(), handoverCase: m(), document: m(), bazarItem: m(), report: m() };
});
vi.mock("../../lib/prisma.js", () => ({ prisma: h }));
vi.mock("../../lib/auth.js", () => ({ verifyAccess: (token: string) => ({ sub: "actor", role: token }) }));
import { weekAgenda } from "./week.js";
import { staffMetrics } from "./metrics.js";
import { staffRouter } from "../staff/routes.js";
import { errorHandler } from "../../middleware/errors.js";

const hours = [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opens: 480, closes: weekday === 6 ? 780 : 1080 }));
const person = (id: string, name: string) => ({ id, email: `${id}@unsa.edu.pe`, profile: { fullName: name } });
const appt = { id: "a1", caseId: "c1", kind: "PICKUP", status: "SCHEDULED", startsAt: new Date("2026-10-08T14:00:00Z"), endsAt: new Date("2026-10-08T14:15:00Z"),
  sede: { id: "s1", name: "Ingenierías" }, staff: person("w1", "Ana"), party: person("b1", "Beto"), case: { order: { itemTitle: "Libro" } } };
beforeEach(() => {
  vi.resetAllMocks(); h.openingHours.findMany.mockResolvedValue(hours); h.holiday.findMany.mockResolvedValue([]);
  h.appointment.findMany.mockResolvedValue([appt]); h.staffShift.findMany.mockResolvedValue([]); h.user.findMany.mockResolvedValue([person("w1", "Ana")]);
});
describe("agenda semanal", () => {
  it("normaliza al lunes Lima y lista lunes–sábado", async () => {
    const r = await weekAgenda({ week: "2026-10-10" });
    expect(r.weekStart).toBe("2026-10-05");
    expect(r.days.map((d) => d.date)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
    expect(r.days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6]);
    const range = h.appointment.findMany.mock.calls[0]?.[0].where.startsAt;
    expect(range.gte.toISOString()).toBe("2026-10-05T05:00:00.000Z"); expect(range.lt.toISOString()).toBe("2026-10-11T05:00:00.000Z");
  });
  it("sin parámetro usa la semana actual de Lima", async () => { expect((await weekAgenda({}, new Date("2026-10-08T03:00:00Z"))).weekStart).toBe("2026-10-05"); });
  it("marca feriados y días sin horario como cerrados", async () => {
    h.holiday.findMany.mockResolvedValue([{ date: new Date("2026-10-08T00:00:00Z"), reason: "Feriado" }]);
    h.openingHours.findMany.mockResolvedValue(hours.filter((x) => x.weekday !== 2));
    const r = await weekAgenda({ week: "2026-10-05" });
    expect(r.days[3]).toMatchObject({ open: false, holiday: "Feriado" }); expect(r.days[1]).toMatchObject({ open: false, opens: null }); expect(r.days[5]).toMatchObject({ open: true, opens: 480, closes: 780 });
  });
  it("aplica filtros de sede y trabajador a citas y turnos", async () => {
    await weekAgenda({ week: "2026-10-05", sedeId: "s1", staffId: "w1" });
    expect(h.appointment.findMany.mock.calls[0]?.[0].where).toMatchObject({ sedeId: "s1", staffId: "w1" });
    expect(h.staffShift.findMany.mock.calls[0]?.[0].where).toEqual({ sedeId: "s1", userId: "w1" });
  });
  it("incluye todos los estados con trabajador, sede, parte y producto, con tope 500", async () => {
    const r = await weekAgenda({ week: "2026-10-05" });
    expect(r.appointments[0]).toMatchObject({ status: "SCHEDULED", sede: { name: "Ingenierías" }, staff: { name: "Ana" }, party: "Beto", itemTitle: "Libro" });
    expect(h.appointment.findMany.mock.calls[0]?.[0].take).toBe(500);
    expect(h.appointment.findMany.mock.calls[0]?.[0].where.status).toBeUndefined();
  });
});
describe("métricas", () => {
  it("agrega citas de hoy, casos por estado, custodia por trabajador, faltas y pendientes", async () => {
    h.appointment.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    h.handoverCase.groupBy.mockResolvedValueOnce([{ status: "UNASSIGNED", _count: { _all: 3 } }, { status: "IN_CUSTODY", _count: { _all: 2 } }])
      .mockResolvedValueOnce([{ assigneeId: "w1", _count: { _all: 2 } }]);
    h.document.count.mockResolvedValue(5); h.bazarItem.count.mockResolvedValue(1); h.report.count.mockResolvedValue(7);
    expect(await staffMetrics(new Date("2026-10-08T15:00:00Z"))).toEqual({ todayAppointments: 4, noShowsThisMonth: 2, pendingReviews: 6, openReports: 7,
      casesByStatus: { UNASSIGNED: 3, IN_CUSTODY: 2 }, custodyByStaff: [{ staffId: "w1", name: "Ana", count: 2 }] });
    const month = h.appointment.count.mock.calls[1]?.[0].where.startsAt.gte;
    expect(month.toISOString()).toBe("2026-10-01T05:00:00.000Z");
  });
  it("sin custodia no consulta usuarios", async () => {
    h.appointment.count.mockResolvedValue(0); h.handoverCase.groupBy.mockResolvedValue([]); h.document.count.mockResolvedValue(0); h.bazarItem.count.mockResolvedValue(0); h.report.count.mockResolvedValue(0);
    await staffMetrics(); expect(h.user.findMany).not.toHaveBeenCalled();
  });
});
describe("acceso solo equipo", () => {
  const app = express(); app.use("/staff", staffRouter); app.use(errorHandler);
  let base = ""; let server: ReturnType<typeof app.listen>;
  beforeAll(async () => { server = app.listen(0, "127.0.0.1"); await new Promise((r) => server.once("listening", r)); base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`; });
  afterAll(() => { server.close(); });
  const get = (path: string, role?: string) => fetch(base + path, { headers: role ? { authorization: `Bearer ${role}` } : {} }).then((r) => r.status);
  it.each(["/staff/agenda", "/staff/metrics"])("%s: anónimo 401, estudiante 403", async (path) => { expect(await get(path)).toBe(401); expect(await get(path, "student")).toBe(403); });
  it("trabajador y técnico leen la agenda de todos", async () => { expect(await get("/staff/agenda?week=2026-10-05", "moderator")).toBe(200); expect(await get("/staff/agenda", "admin")).toBe(200); });
  it("semana inválida → 400", async () => { expect(await get("/staff/agenda?week=hoy", "moderator")).toBe(400); });
});
