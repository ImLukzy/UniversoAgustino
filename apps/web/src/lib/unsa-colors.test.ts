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

  it("contraste WCAG AA (>= 4.5): color sobre blanco y sobre su soft", () => {
    const channel = (hex: string, i: number) => {
      const v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const luminance = (hex: string) =>
      0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
    const ratio = (a: string, b: string) => {
      const x = luminance(a);
      const y = luminance(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    for (const c of UNSA_CAREERS) {
      expect(ratio(c.color, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      expect(ratio(c.color, c.soft)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
