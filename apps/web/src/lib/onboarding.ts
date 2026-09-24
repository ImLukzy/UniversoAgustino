import { CAREER_FACULTY } from "@hub/shared";
import { UNSA_CAREERS } from "../data/unsa";

// Onboarding (spec 21): las 19 carreras oficiales (sin "Otra carrera UNSA")
// de una facultad, con la etiqueta visual del catálogo web.
export const facultyOf = (career: string) => (CAREER_FACULTY as Record<string, string>)[career] ?? "";

export function careersOf(faculty: string) {
  return UNSA_CAREERS.filter((c) => c.key !== "OTRA_UNSA" && facultyOf(c.key) === faculty);
}
