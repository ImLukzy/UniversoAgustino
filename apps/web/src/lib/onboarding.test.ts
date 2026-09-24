import { describe, expect, it } from "vitest";
import { UNSA_FACULTIES } from "@hub/shared";
import { careersOf } from "./onboarding";
import { safeReturnPath } from "./authRedirect";

describe("onboarding: facultad → carreras oficiales", () => {
  it("reparte las 19 carreras oficiales entre las facultades, sin OTRA_UNSA", () => {
    const all = UNSA_FACULTIES.flatMap((f) => careersOf(f).map((c) => c.key));
    expect(all).toHaveLength(19);
    expect(all).not.toContain("OTRA_UNSA");
    for (const f of UNSA_FACULTIES) expect(careersOf(f).length).toBeGreaterThan(0);
  });

  it("filtra por facultad", () => {
    expect(careersOf("Facultad de Enfermería").map((c) => c.key)).toEqual(["ENFERMERIA"]);
    expect(careersOf("Facultad de Ingeniería de Producción y Servicios")).toHaveLength(3);
    expect(careersOf("")).toEqual([]);
  });

  it("nunca vuelve a /bienvenida tras completar el perfil", () => {
    expect(safeReturnPath("/bienvenida?next=/")).toBeNull();
    expect(safeReturnPath("/explorar?career=DERECHO")).toBe("/explorar?career=DERECHO");
  });
});
