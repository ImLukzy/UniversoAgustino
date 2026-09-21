// Fachada (Sprint 2B): el contenido por carrera vive en ./career/*.ts.
// Esta fachada conserva la ruta de importación existente.
export type { CareerContent, CareerChip, CareerTesti, DocTypeFilter } from "./career/index";
export { careerContent } from "./career/index";
