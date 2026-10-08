import { describe, expect, it } from "vitest";
import { AgendaQuerySchema, addDays, mondayOf, weekDays } from "./agenda.js";

describe("agenda semanal", () => {
  it("normaliza cualquier día de la semana al lunes", () => {
    for (const d of ["2026-10-05", "2026-10-07", "2026-10-10", "2026-10-11"]) expect(mondayOf(d)).toBe("2026-10-05");
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
  });
  it("lista lunes a sábado, sin domingo", () => {
    expect(weekDays("2026-10-08")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"]);
  });
  it("suma días cruzando mes", () => { expect(addDays("2026-10-30", 3)).toBe("2026-11-02"); expect(addDays("2026-10-05", -7)).toBe("2026-09-28"); });
  it("valida la consulta", () => {
    expect(AgendaQuerySchema.safeParse({ week: "2026-13-45" }).success).toBe(false);
    expect(AgendaQuerySchema.safeParse({ week: "hoy" }).success).toBe(false);
    expect(AgendaQuerySchema.safeParse({ week: "2026-10-05", sedeId: "s", staffId: "w" }).success).toBe(true);
    expect(AgendaQuerySchema.safeParse({}).success).toBe(true);
  });
});
