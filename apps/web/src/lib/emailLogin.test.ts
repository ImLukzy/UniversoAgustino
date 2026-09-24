import { describe, expect, it } from "vitest";
import { completeUnsaEmail, onlyDigits, unsaEmailError } from "./emailLogin";

describe("ingreso con correo UNSA", () => {
  it("completa el dominio cuando solo se escribe el usuario", () => {
    expect(completeUnsaEmail(" RQuispe ")).toBe("rquispe@unsa.edu.pe");
    expect(completeUnsaEmail("Rosa@UNSA.edu.pe")).toBe("rosa@unsa.edu.pe");
    expect(completeUnsaEmail("")).toBe("");
  });

  it("rechaza correos externos o parecidos antes de llamar a la API", () => {
    expect(unsaEmailError("rquispe")).toBeNull();
    expect(unsaEmailError("rosa@unsa.edu.pe")).toBeNull();
    expect(unsaEmailError("Lukas.Melgar@tecsup.edu.pe")).toBeNull();
    expect(unsaEmailError("otro@tecsup.edu.pe")).toBe("Usa tu correo @unsa.edu.pe");
    expect(unsaEmailError("")).toBe("Escribe tu correo institucional");
    for (const e of ["rosa@gmail.com", "rosa@unsa.edu.pe.evil.com", "rosa@notunsa.edu.pe", "rosa@"]) expect(unsaEmailError(e)).toBe("Usa tu correo @unsa.edu.pe");
  });

  it("el código admite solo 6 dígitos", () => {
    expect(onlyDigits("12a 34-567")).toBe("123456");
  });
});
