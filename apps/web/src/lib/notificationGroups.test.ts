import { describe, expect, it } from "vitest";
import { notificationGroup } from "../components/notificaciones/groups";
describe("grupos de avisos", () => {
  const now = new Date(2026, 9, 8, 15);
  it.each([[8, "Hoy"], [7, "Ayer"], [5, "Esta semana"], [4, "Antes"]])("día %s corresponde a %s", (day, label) => {
    expect(notificationGroup(new Date(2026, 9, Number(day), 10).toISOString(), now)).toBe(label);
  });
  it("ayer mantiene su grupo al cruzar semana y mes", () => {
    expect(notificationGroup(new Date(2026, 10, 1, 23).toISOString(), new Date(2026, 10, 2, 8))).toBe("Ayer");
  });
});
