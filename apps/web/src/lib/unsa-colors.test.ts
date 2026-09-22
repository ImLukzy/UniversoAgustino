import { describe, expect, it } from "vitest";
import { UNSA_CAREERS } from "../data/unsa";

// Colores identidad únicos: cada carrera debe distinguirse a simple vista en
// filtros, badges y acentos. Falla si dos carreras comparten color o fondo.
describe("UNSA career identity colors", () => {
  it("15 carreras con key, color y soft únicos", () => {
    expect(UNSA_CAREERS).toHaveLength(15);
    const keys = UNSA_CAREERS.map((c) => c.key);
    const colors = UNSA_CAREERS.map((c) => c.color.toLowerCase());
    const softs = UNSA_CAREERS.map((c) => c.soft.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(colors).size).toBe(colors.length);
    expect(new Set(softs).size).toBe(softs.length);
  });

  it("colores con formato hexadecimal válido", () => {
    for (const c of UNSA_CAREERS) {
      expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.soft).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
