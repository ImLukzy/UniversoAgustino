import { describe, expect, it } from "vitest";
import { CAREER_FACULTY, CareerSchema, OnboardingSchema, UNSA_FACULTIES } from "./index.js";

const ok = { fullName: "Rosa Quispe Mamani", faculty: "Facultad de Enfermería", career: "ENFERMERIA", cycle: "VI", phone: "987 654 321" };

describe("OnboardingSchema (perfil obligatorio de primer ingreso)", () => {
  it("cubre las 19 carreras oficiales, cada una con su facultad", () => {
    expect(Object.keys(CAREER_FACULTY)).toHaveLength(19);
    expect(CareerSchema.options.filter((c) => c !== "OTRA_UNSA").sort()).toEqual(Object.keys(CAREER_FACULTY).sort());
    expect(UNSA_FACULTIES.length).toBeGreaterThan(10);
  });

  it("acepta un perfil completo y normaliza el celular", () => {
    expect(OnboardingSchema.parse(ok).phone).toBe("987654321");
    expect(OnboardingSchema.parse({ ...ok, phone: "+51 987-654-321" }).phone).toBe("987654321");
  });

  it("exige nombre y apellidos, celular válido, ciclo y carrera oficial", () => {
    for (const bad of [{ fullName: "Rosa" }, { phone: "054123456" }, { phone: "98765432" }, { cycle: "XX" }, { career: "OTRA_UNSA" }, { faculty: "Facultad de Magia" }]) {
      expect(OnboardingSchema.safeParse({ ...ok, ...bad }).success).toBe(false);
    }
  });

  it("rechaza una carrera que no pertenece a la facultad", () => {
    expect(OnboardingSchema.safeParse({ ...ok, career: "DERECHO" }).success).toBe(false);
    expect(OnboardingSchema.safeParse({ ...ok, faculty: CAREER_FACULTY.DERECHO, career: "DERECHO" }).success).toBe(true);
  });
});
