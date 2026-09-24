import type { CareerContent } from "./types";
import { ENFERMERIA } from "./enfermeria";
import { MEDICINA } from "./medicina";
import { PSICOLOGIA } from "./psicologia";
import { BIOLOGIA } from "./biologia";
import { DERECHO } from "./derecho";
import { EDUCACION } from "./educacion";
import { ADMINISTRACION } from "./administracion";
import { CONTABILIDAD } from "./contabilidad";
import { ECONOMIA } from "./economia";
import { ING_SISTEMAS } from "./ing_sistemas";
import { ING_CIVIL } from "./ing_civil";
import { ING_INDUSTRIAL } from "./ing_industrial";
import { ARQUITECTURA } from "./arquitectura";
import { AGRONOMIA } from "./agronomia";
import { OTRA_UNSA } from "./otra_unsa";
import { DEFAULT_CONTENT } from "./default";

const BY_CAREER: Record<string, CareerContent> = {
  ENFERMERIA,
  MEDICINA,
  PSICOLOGIA,
  BIOLOGIA,
  DERECHO,
  EDUCACION,
  ADMINISTRACION,
  CONTABILIDAD,
  ECONOMIA,
  ING_SISTEMAS,
  ING_CIVIL,
  ING_INDUSTRIAL,
  ARQUITECTURA,
  AGRONOMIA,
  OTRA_UNSA,
};

/** Contenido contextual para la carrera elegida ("all" u otra → genérico UNSA). */
export function careerContent(key?: string | null): CareerContent {
  if (key && key !== "all") {
    const c = BY_CAREER[key];
    if (c) return c;
  }
  return DEFAULT_CONTENT;
}

