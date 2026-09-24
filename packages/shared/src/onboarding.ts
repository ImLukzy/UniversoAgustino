import { z } from "zod";
import { CareerSchema, type Career } from "./common.js";

// --- Onboarding de primer ingreso (spec 21) ---
// Facultad oficial de cada Escuela Profesional UNSA. El formulario ofrece las
// 19 carreras oficiales (sin OTRA_UNSA) y el backend exige que carrera y
// facultad coincidan.
export const CAREER_FACULTY: Record<Exclude<Career, "OTRA_UNSA">, string> = {
  ENFERMERIA: "Facultad de Enfermería",
  MEDICINA: "Facultad de Medicina",
  PSICOLOGIA: "Facultad de Psicología, Relaciones Industriales y Ciencias de la Comunicación",
  COMUNICACION: "Facultad de Psicología, Relaciones Industriales y Ciencias de la Comunicación",
  BIOLOGIA: "Facultad de Ciencias Biológicas",
  DERECHO: "Facultad de Derecho",
  EDUCACION: "Facultad de Ciencias de la Educación",
  ADMINISTRACION: "Facultad de Administración",
  CONTABILIDAD: "Facultad de Ciencias Contables y Financieras",
  ECONOMIA: "Facultad de Economía",
  ING_SISTEMAS: "Facultad de Ingeniería de Producción y Servicios",
  ING_INDUSTRIAL: "Facultad de Ingeniería de Producción y Servicios",
  ING_MECANICA: "Facultad de Ingeniería de Producción y Servicios",
  ING_CIVIL: "Facultad de Ingeniería Civil",
  ARQUITECTURA: "Facultad de Arquitectura y Urbanismo",
  AGRONOMIA: "Facultad de Agronomía",
  ING_QUIMICA: "Facultad de Ingeniería de Procesos",
  ING_MINAS: "Facultad de Ingeniería Geológica, Geofísica y Minas",
  TURISMO: "Facultad de Ciencias Histórico Sociales",
};

export const UNSA_FACULTIES = [...new Set(Object.values(CAREER_FACULTY))].sort((a, b) => a.localeCompare(b, "es"));

export const OfficialCareerSchema = CareerSchema.exclude(["OTRA_UNSA"]);

// Ciclos académicos (semestres): hasta XIV por Medicina.
export const CYCLES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV"] as const;

// Celular peruano: 9 dígitos empezando en 9; admite +51, espacios y guiones
// al escribir y se guarda normalizado ("9XXXXXXXX").
export const PeruMobileSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+?51(?=9\d{8}$)/, ""))
  .pipe(z.string().regex(/^9\d{8}$/, "Celular de 9 dígitos que empiece con 9"));

export const OnboardingSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(5, "Escribe tus nombres y apellidos completos")
      .max(120)
      .refine((v) => v.split(/\s+/).length >= 2, "Escribe tus nombres y apellidos completos"),
    faculty: z.string().refine((v) => (UNSA_FACULTIES as string[]).includes(v), "Elige tu facultad"),
    career: OfficialCareerSchema,
    cycle: z.enum(CYCLES),
    phone: PeruMobileSchema,
  })
  .refine((v) => CAREER_FACULTY[v.career] === v.faculty, { path: ["career"], message: "La carrera no pertenece a la facultad elegida" });
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
