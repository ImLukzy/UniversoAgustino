import { UNSA_CAREERS, type UnsaCareer } from "./unsa";

// Escuelas del showcase de la landing (spec 17): área, icono y cursos típicos.
// Cada tarjeta abre /explorar?career=KEY (tema + filtro vía useExploreParams).
export const AREAS = ["Todas", "Salud", "Ingenierías", "Sociales", "Negocios"] as const;
export type Area = (typeof AREAS)[number];

const META: Record<string, { area: Exclude<Area, "Todas">; icon: string; courses: string }> = {
  ENFERMERIA: { area: "Salud", icon: "local_hospital", courses: "PAE · Farmacología · Enfermería básica" },
  MEDICINA: { area: "Salud", icon: "stethoscope", courses: "Anatomía · Semiología · Fisiología" },
  PSICOLOGIA: { area: "Salud", icon: "psychology", courses: "Desarrollo · Psicometría · Clínica" },
  BIOLOGIA: { area: "Salud", icon: "biotech", courses: "Genética · Microbiología · Ecología" },
  ING_SISTEMAS: { area: "Ingenierías", icon: "code", courses: "Programación · Estructuras de datos · BD" },
  ING_CIVIL: { area: "Ingenierías", icon: "construction", courses: "Estática · Resistencia · Concreto" },
  ING_INDUSTRIAL: { area: "Ingenierías", icon: "factory", courses: "Procesos · Investigación operativa · Costos" },
  ING_MECANICA: { area: "Ingenierías", icon: "settings", courses: "Termodinámica · Dibujo mecánico · Máquinas" },
  ING_QUIMICA: { area: "Ingenierías", icon: "science", courses: "Química orgánica · Balance de materia · Fisicoquímica" },
  ING_MINAS: { area: "Ingenierías", icon: "landscape", courses: "Geología · Voladura · Topografía" },
  ARQUITECTURA: { area: "Ingenierías", icon: "architecture", courses: "Taller de diseño · Urbanismo · Construcción" },
  AGRONOMIA: { area: "Ingenierías", icon: "agriculture", courses: "Edafología · Botánica · Riego" },
  DERECHO: { area: "Sociales", icon: "gavel", courses: "Derecho Civil · Constitucional · Penal" },
  EDUCACION: { area: "Sociales", icon: "school", courses: "Didáctica · Currículo · Psicopedagogía" },
  COMUNICACION: { area: "Sociales", icon: "campaign", courses: "Redacción · Periodismo · Semiótica" },
  TURISMO: { area: "Negocios", icon: "luggage", courses: "Patrimonio · Hotelería · Guiado" },
  ADMINISTRACION: { area: "Negocios", icon: "business_center", courses: "Marketing · Finanzas · Gestión" },
  CONTABILIDAD: { area: "Negocios", icon: "calculate", courses: "Contabilidad General · Tributación · Costos" },
  ECONOMIA: { area: "Negocios", icon: "account_balance", courses: "Microeconomía · Macroeconomía · Econometría" },
};

export type ShowcaseCareer = UnsaCareer & (typeof META)[string];

export const SHOWCASE: ShowcaseCareer[] = UNSA_CAREERS.flatMap((c) => (META[c.key] ? [{ ...c, ...META[c.key] }] : []));

export const byArea = (area: Area) => (area === "Todas" ? SHOWCASE : SHOWCASE.filter((c) => c.area === area));

// Búsquedas rápidas bajo la grilla de escuelas (antes "Cursos destacados").
export const TOP_COURSES = ["Anatomía", "Farmacología", "Fisiología", "Cálculo I", "Física I", "Programación", "Derecho Civil", "Microeconomía", "Estadística", "Bioquímica", "Contabilidad General", "Psicología del Desarrollo"];
