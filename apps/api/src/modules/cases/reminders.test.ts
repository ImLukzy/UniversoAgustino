import { beforeEach, describe, expect, it, vi } from "vitest";
const h = vi.hoisted(() => ({ appointment: { updateMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  openingHours: { findMany: vi.fn() }, holiday: { findMany: vi.fn() }, notify: vi.fn() }));
vi.mock("../../lib/prisma.js", () => ({ prisma: h }));
vi.mock("../../lib/notify.js", () => ({ notify: h.notify }));
import { reminderDue, reminderInstant, remind, remindIfDue, sendDueReminders } from "./reminders.js";
const hours = [1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, opens: 480, closes: weekday === 6 ? 780 : 1080 }));
const at = (iso: string) => new Date(iso); // Lima = UTC-5
const appt = (startsAt: Date, id = "a") => ({ id, kind: "PICKUP", partyId: "buyer", staffId: "worker", startsAt,
  case: { order: { itemTitle: "Libro" } }, sede: { name: "Campus", address: "Calle 1", meetingPoint: "Puerta" } });
beforeEach(() => {
  vi.resetAllMocks(); h.openingHours.findMany.mockResolvedValue(hours); h.holiday.findMany.mockResolvedValue([]);
  h.appointment.updateMany.mockResolvedValue({ count: 1 });
});
describe("instante del recordatorio", () => {
  it("martes → lunes 08:00 Lima", () => { expect(reminderInstant(at("2026-10-13T15:00:00Z"), hours, []).toISOString()).toBe("2026-10-12T13:00:00.000Z"); });
  it("sábado → viernes 08:00", () => { expect(reminderInstant(at("2026-10-10T15:00:00Z"), hours, []).toISOString()).toBe("2026-10-09T13:00:00.000Z"); });
  it("lunes → sábado (domingo cerrado)", () => { expect(reminderInstant(at("2026-10-12T15:00:00Z"), hours, []).toISOString()).toBe("2026-10-10T13:00:00.000Z"); });
  it("feriado el día previo → último hábil anterior", () => { expect(reminderInstant(at("2026-10-14T15:00:00Z"), hours, ["2026-10-13"]).toISOString()).toBe("2026-10-12T13:00:00.000Z"); });
});
describe("vencimiento", () => {
  const start = at("2026-10-13T15:00:00Z");
  it("antes de la ventana no vence", () => { expect(reminderDue(start, at("2026-10-12T12:59:00Z"), hours, [])).toBe(false); });
  it("tras la ventana vence (atrasados)", () => { expect(reminderDue(start, at("2026-10-12T13:01:00Z"), hours, [])).toBe(true); });
  it("cita ya empezada no vence", () => { expect(reminderDue(start, at("2026-10-13T16:00:00Z"), hours, [])).toBe(false); });
  it("agendada con menos de 24 h vence al agendar", () => { expect(reminderDue(at("2026-10-10T15:00:00Z"), at("2026-10-10T01:00:00Z"), hours, [])).toBe(true); });
});
describe("envío idempotente", () => {
  it("avisa a ambas partes una sola vez", async () => {
    expect(await remind(appt(at("2026-10-13T15:00:00Z")))).toBe(true);
    expect(h.notify.mock.calls.map((c) => c[0].userId).sort()).toEqual(["buyer", "worker"]);
    const call = h.appointment.updateMany.mock.calls[0]?.[0];
    expect(call.where).toEqual({ id: "a", status: "SCHEDULED", reminderSentAt: null });
    expect(call.data.reminderSentAt).toBeInstanceOf(Date);
  });
  it("segunda instancia pierde la marca y no avisa", async () => {
    h.appointment.updateMany.mockResolvedValue({ count: 0 });
    expect(await remind(appt(at("2026-10-13T15:00:00Z")))).toBe(false);
    expect(h.notify).not.toHaveBeenCalled();
  });
  it("la pasada envía solo las vencidas", async () => {
    h.appointment.findMany.mockResolvedValue([appt(at("2026-10-13T15:00:00Z"), "due"), appt(at("2026-10-20T15:00:00Z"), "later")]);
    expect(await sendDueReminders(at("2026-10-12T14:00:00Z"))).toBe(1);
    expect(h.appointment.updateMany).toHaveBeenCalledTimes(1);
  });
  it("agendar con <24 h envía al instante", async () => {
    h.appointment.findUnique.mockResolvedValue({ ...appt(at("2026-10-13T15:00:00Z")), status: "SCHEDULED" });
    await remindIfDue("a", at("2026-10-13T01:00:00Z"));
    expect(h.notify).toHaveBeenCalledTimes(2);
  });
  it("un fallo del gancho no lanza", async () => {
    h.appointment.findUnique.mockRejectedValue(new Error("DB"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(remindIfDue("a")).resolves.toBeUndefined();
  });
});
