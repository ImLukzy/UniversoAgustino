import { describe, expect, it } from "vitest";
import { UNSA_CAREERS } from "../data/unsa";
import { DEFAULT_ACCENT, DEFAULT_SOFT, contrastRatio, hexToRgbTriplet, inkFor, themeTokens } from "./themeTokens";

describe("themeTokens", () => {
  it("convierte hex a triplete RGB", () => {
    expect(hexToRgbTriplet("#00685F")).toBe("0 104 95");
    expect(hexToRgbTriplet("#fff")).toBe("255 255 255");
  });

  it("el ink de cada acento cumple AA (>= 4.5) sobre su color", () => {
    for (const c of [{ color: DEFAULT_ACCENT }, ...UNSA_CAREERS]) {
      expect(contrastRatio(c.color, inkFor(c.color))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("el teal por defecto es legible sobre su soft", () => {
    expect(contrastRatio(DEFAULT_ACCENT, DEFAULT_SOFT)).toBeGreaterThanOrEqual(4.5);
  });

  it("genera las tres variables", () => {
    expect(themeTokens(DEFAULT_ACCENT, DEFAULT_SOFT)).toEqual({
      "--hub-p": "0 104 95",
      "--hub-p-soft": "224 240 238",
      "--hub-p-ink": "255 255 255",
    });
  });
});
