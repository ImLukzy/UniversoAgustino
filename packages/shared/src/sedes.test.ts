import { describe, expect, it } from "vitest";
import { HolidaySchema, HoursSchema, intervalsOverlap, SedeSchema, ShiftSchema } from "./sedes.js";
describe("esquemas de sedes", () => {
  it("normaliza sede y permite foto interna", () => { expect(SedeSchema.parse({ name: "  Sociales ", photoUrl: "/uploads/foto.png" }).name).toBe("Sociales"); });
  it("no permite URLs externas", () => { expect(SedeSchema.safeParse({ name: "Sede", photoUrl: "https://example.test/p.png" }).success).toBe(false); });
  it("horario debe tener duración positiva", () => { expect(HoursSchema.safeParse({ opens: 480, closes: 480 }).success).toBe(false); });
  it("valida fecha real, incluido año bisiesto", () => {
    expect(HolidaySchema.safeParse({ date: "2026-02-29", reason: "Feriado" }).success).toBe(false);
    expect(HolidaySchema.safeParse({ date: "2028-02-29", reason: "Feriado" }).success).toBe(true);
  });
  it("turno exige día y minutos válidos", () => { expect(ShiftSchema.safeParse({ userId: "u", sedeId: "s", weekday: 7, startsMin: 480, endsMin: 600 }).success).toBe(false); });
  it("intervalos contiguos no solapan, superpuestos sí", () => {
    const a = { startsMin: 480, endsMin: 600 };
    expect(intervalsOverlap(a, { startsMin: 600, endsMin: 700 })).toBe(false);
    expect(intervalsOverlap(a, { startsMin: 599, endsMin: 700 })).toBe(true);
  });
});
