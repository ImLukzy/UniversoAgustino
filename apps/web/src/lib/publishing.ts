import { careerContent } from "../data/career";

// Constantes y reglas compartidas por los flujos de publicación
// (/publicar y /subir-material). Valores 1:1 con los esquemas de @hub/shared.
export const MAX_UPLOAD_MB = 25;
export const UPLOAD_ACCEPT = ".pdf,.jpg,.jpeg,.png,.epub";
export { CYCLES } from "@hub/shared";

const DOC_TYPE_LABEL: Record<string, string> = {
  APUNTE: "Apunte / Resumen",
  PAE: "Guía PAE",
  BALOTARIO: "Balotario",
  GUIA: "Guía de estudio",
};

export const BAZAR_KINDS = [
  { label: "Libros y manuales", value: "LIBRO" },
  { label: "Instrumental y herramientas", value: "INSTRUMENTO" },
  { label: "Uniformes y vestimenta", value: "SCRUB" },
] as const;

export const mbOf = (f: File) => `${(f.size / 1048576).toFixed(1)} MB`;
export const tooBig = (f: File) => f.size > MAX_UPLOAD_MB * 1048576;

// Tipos de material de una carrera: salen de sus chips contextuales (PAE solo
// existe en Enfermería); si la carrera no trae ninguno, las 4 del enum.
export function docTypeOptions(career: string, labelFromChip = true): { v: string; l: string }[] {
  const seen = new Map<string, string>();
  for (const chip of careerContent(career).chips) {
    if (chip.docType === "all" || seen.has(chip.docType)) continue;
    seen.set(chip.docType, labelFromChip ? chip.label : (DOC_TYPE_LABEL[chip.docType] ?? chip.docType));
  }
  const entries = seen.size ? [...seen] : Object.entries(DOC_TYPE_LABEL);
  return entries.map(([v, l]) => ({ v, l }));
}
