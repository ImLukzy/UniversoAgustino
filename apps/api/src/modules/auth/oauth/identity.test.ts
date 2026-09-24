import { describe, expect, it } from "vitest";
import { checkGoogleIdentity } from "./identity.js";

const unsa = { sub: "g-1", email: "Rosa.Quispe@UNSA.edu.pe", email_verified: true, hd: "unsa.edu.pe", name: "Rosa Quispe", picture: "https://x/p.png" };

describe("checkGoogleIdentity (puerta UNSA de Google)", () => {
  it("acepta la cuenta institucional verificada y normaliza el correo", () => {
    expect(checkGoogleIdentity(unsa)).toEqual({ ok: true, sub: "g-1", email: "rosa.quispe@unsa.edu.pe", fullName: "Rosa Quispe", avatarUrl: "https://x/p.png" });
  });

  it("rechaza otros dominios con EMAIL_NO_AUTORIZADO", () => {
    for (const email of ["a@gmail.com", "a@unsa.edu.pe.evil.com", "a@notunsa.edu.pe"]) {
      expect(checkGoogleIdentity({ ...unsa, email, hd: undefined })).toMatchObject({ ok: false, code: "EMAIL_NO_AUTORIZADO" });
    }
  });

  it("rechaza un correo @unsa.edu.pe que no pertenece al Workspace UNSA (sin hd)", () => {
    expect(checkGoogleIdentity({ ...unsa, hd: undefined })).toMatchObject({ ok: false, code: "EMAIL_NO_AUTORIZADO" });
    expect(checkGoogleIdentity({ ...unsa, hd: "gmail.com" })).toMatchObject({ ok: false, code: "EMAIL_NO_AUTORIZADO" });
  });

  it("acepta la excepción autorizada (tecsup) aunque no sea del Workspace UNSA", () => {
    expect(checkGoogleIdentity({ ...unsa, email: "Lukas.Melgar@tecsup.edu.pe", hd: "tecsup.edu.pe" })).toMatchObject({ ok: true, email: "lukas.melgar@tecsup.edu.pe" });
    expect(checkGoogleIdentity({ ...unsa, email: "otro@tecsup.edu.pe", hd: "tecsup.edu.pe" })).toMatchObject({ ok: false, code: "EMAIL_NO_AUTORIZADO" });
    expect(checkGoogleIdentity({ ...unsa, email: "lukas.melgar@tecsup.edu.pe", email_verified: false })).toMatchObject({ ok: false, code: "EMAIL_NO_VERIFICADO" });
  });

  it("exige correo verificado por Google y sub", () => {
    expect(checkGoogleIdentity({ ...unsa, email_verified: false })).toMatchObject({ ok: false, code: "EMAIL_NO_VERIFICADO" });
    expect(checkGoogleIdentity({ ...unsa, sub: undefined })).toMatchObject({ ok: false, code: "EMAIL_NO_VERIFICADO" });
    expect(checkGoogleIdentity({})).toMatchObject({ ok: false, code: "EMAIL_NO_VERIFICADO" });
  });

  it("usa el usuario del correo si Google no envía nombre", () => {
    expect(checkGoogleIdentity({ ...unsa, name: " " })).toMatchObject({ ok: true, fullName: "rosa.quispe", avatarUrl: "https://x/p.png" });
  });
});
