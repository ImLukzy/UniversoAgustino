import { describe, expect, it } from "vitest";
import { formatPageRange, parsePageRange, PreviewPagesSchema } from "./pages.js";

describe("parsePageRange (spec 16)", () => {
  it("acepta páginas sueltas y rangos, ordena y quita duplicados", () => {
    expect(parsePageRange("1-3, 7")).toEqual([1, 2, 3, 7]);
    expect(parsePageRange(" 5 ,2,2 ")).toEqual([2, 5]);
  });

  it("rechaza texto vacío, página 0, rangos invertidos o demasiadas páginas", () => {
    for (const bad of ["", "0", "3-1", "a", "1-2-3", "1-40", "1-15, 20-29"]) expect(parsePageRange(bad)).toBeNull();
  });

  it("formatPageRange agrupa corridas consecutivas", () => {
    expect(formatPageRange([7, 1, 2, 3])).toBe("1-3, 7");
    expect(formatPageRange([4])).toBe("4");
  });

  it("PreviewPagesSchema normaliza y exige al menos una página", () => {
    expect(PreviewPagesSchema.parse([3, 1, 3])).toEqual([1, 3]);
    expect(PreviewPagesSchema.safeParse([]).success).toBe(false);
    expect(PreviewPagesSchema.safeParse([0]).success).toBe(false);
  });
});
