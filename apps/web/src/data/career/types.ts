// Tipos del contenido contextual por carrera UNSA (Sprint 2B: módulo de tipos).
// Cuando el filtro global de carrera cambia (live/careerTheme), las páginas
// toman de aquí sus textos, chips, ejemplos y sugerencias, igual que antes
// solo Enfermería tenía contenido a medida. Claves 1:1 con CareerSchema.
type DocTypeFilter = "APUNTE" | "PAE" | "BALOTARIO" | "GUIA" | "all";

export interface CareerChip {
  label: string;
  docType: DocTypeFilter;
  q: string;
}

export interface CareerContent {
  // Marketplace: chips de búsqueda rápida
  chips: CareerChip[];
  // Bazar: banner contextual (los ítems no tienen carrera en el backend)
  bazarHint: string;
  bazarSuggest: string;
  // Monetiza: textos del asistente + valores sugeridos de la calculadora
  monetizaDesc: string;
  digitalEx: string;
  fisicoEx: string;
  publishTitlePh: string;
  publishCoursePh: string;
  suggestPrice: number;
  suggestSales: number;
  bazarTitlePh: string;
  bazarPlaces: [string, string, string, string];
  meetSpots: [string, string];
  meetTimes: [string, string];
  legalDesc: string;
  visualIcon: string;
  ctaTitle: string;
  ctaBody: string;
  imgQuote: string;
  resDigitalTitle: string;
  resFisicoTitle: string;
  feeDigitalTitle: string;
  feeFisicoTitle: string;
  feeFisicoBody: string;
  equivLow: [string, string];
  equivMid: [string, string];
  equivHigh: [string, string];
}

