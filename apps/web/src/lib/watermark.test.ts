import { describe, expect, it } from "vitest";
import { pageSegments, rangeLabel } from "../components/viewer/pageSegments";
import { watermarkText } from "./watermark";

describe("pageSegments (spec 16)", () => {
  it("intercala las páginas de muestra con los rangos bloqueados", () => {
    expect(pageSegments([2, 5], 7)).toEqual([
      { kind: "locked", from: 1, to: 1 },
      { kind: "page", index: 1, page: 2 },
      { kind: "locked", from: 3, to: 4 },
      { kind: "page", index: 2, page: 5 },
      { kind: "locked", from: 6, to: 7 },
    ]);
  });

  it("acceso completo: todas visibles, ningún bloqueo", () => {
    expect(pageSegments([1, 2, 3], 3).every((s) => s.kind === "page")).toBe(true);
  });

  it("rangeLabel", () => {
    expect(rangeLabel(3, 3)).toBe("3");
    expect(rangeLabel(3, 9)).toBe("3–9");
  });
});

describe("watermarkText", () => {
  const at = new Date(2026, 8, 23, 14, 5);
  it("nombre, correo enmascarado y fecha del lector", () => {
    expect(watermarkText({ email: "anaperez@unsa.edu.pe", profile: { fullName: "Ana Pérez" } }, at)).toBe("Ana Pérez · ana***@unsa.edu.pe · 23/09/2026 14:05");
  });

  it("sin sesión: marca genérica de vista previa", () => {
    expect(watermarkText(null, at)).toBe("Vista previa · Universo Agustino");
  });
});
