// Catálogo UNSA-only: carreras (Escuelas Profesionales), sedes y colores.
// Las claves `key` deben coincidir 1:1 con `CareerSchema` en packages/shared/src/index.ts.
// Cada carrera tiene un color identidad que se usa en filtros, badges y
// personalización automática de la UI según la carrera filtrada.
export interface UnsaCareer {
  key: string;
  label: string;
  faculty: string;
  color: string;
  soft: string;
}

export const UNSA_CAREERS: UnsaCareer[] = [
  { key: "ENFERMERIA", label: "Enfermería", faculty: "Facultad de Enfermería", color: "#0f766e", soft: "#ccfbf1" },
  { key: "MEDICINA", label: "Medicina Humana", faculty: "Facultad de Medicina", color: "#1d4ed8", soft: "#dbeafe" },
  { key: "PSICOLOGIA", label: "Psicología", faculty: "Facultad de Psicología", color: "#7c3aed", soft: "#ede9fe" },
  { key: "BIOLOGIA", label: "Biología", faculty: "Fac. de Ciencias Biológicas", color: "#047857", soft: "#d1fae5" },
  { key: "DERECHO", label: "Derecho", faculty: "Facultad de Derecho", color: "#b45309", soft: "#fef3c7" },
  { key: "EDUCACION", label: "Educación", faculty: "Facultad de Educación", color: "#0369a1", soft: "#e0f2fe" },
  { key: "ADMINISTRACION", label: "Administración", faculty: "Fac. de Administración", color: "#a16207", soft: "#fef9c3" },
  { key: "CONTABILIDAD", label: "Contabilidad", faculty: "Fac. de Contabilidad", color: "#0e7490", soft: "#cffafe" },
  { key: "ECONOMIA", label: "Economía", faculty: "Facultad de Economía", color: "#b91c1c", soft: "#fee2e2" },
  { key: "ING_SISTEMAS", label: "Ing. de Sistemas", faculty: "Fac. de Ing. de Producción y Servicios", color: "#4338ca", soft: "#e0e7ff" },
  { key: "ING_CIVIL", label: "Ing. Civil", faculty: "Facultad de Ing. Civil", color: "#c2410c", soft: "#ffedd5" },
  { key: "ING_INDUSTRIAL", label: "Ing. Industrial", faculty: "Fac. de Ing. de Producción y Servicios", color: "#475569", soft: "#e2e8f0" },
  { key: "ARQUITECTURA", label: "Arquitectura", faculty: "Facultad de Arquitectura", color: "#be123c", soft: "#ffe4e6" },
  { key: "AGRONOMIA", label: "Agronomía", faculty: "Fac. de Agronomía", color: "#4d7c0f", soft: "#ecfccb" },
  { key: "OTRA_UNSA", label: "Otra carrera UNSA", faculty: "UNSA", color: "#57534e", soft: "#f5f5f4" },
];

const byKey: Record<string, UnsaCareer> = Object.fromEntries(UNSA_CAREERS.map((c) => [c.key, c]));

export function careerOf(key?: string | null): UnsaCareer | null {
  if (!key) return null;
  return byKey[key] ?? null;
}

export function careerLabel(key?: string | null): string {
  return careerOf(key)?.label ?? "UNSA";
}

export function careerColor(key?: string | null): string {
  return careerOf(key)?.color ?? "#0f766e";
}

export function careerSoft(key?: string | null): string {
  return careerOf(key)?.soft ?? "#ccfbf1";
}
