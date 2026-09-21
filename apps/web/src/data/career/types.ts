// Tipos del contenido contextual por carrera UNSA (Sprint 2B: módulo de tipos).
// Cuando el filtro global de carrera cambia (live/careerTheme), las páginas
// toman de aquí sus textos, chips, ejemplos y sugerencias, igual que antes
// solo Enfermería tenía contenido a medida. Claves 1:1 con CareerSchema.
export type DocTypeFilter = "APUNTE" | "PAE" | "BALOTARIO" | "GUIA" | "all";

export interface CareerChip {
  label: string;
  docType: DocTypeFilter;
  q: string;
}

export interface CareerContent {
  // Marketplace: héroe + buscador + sección de recursos
  heroLead: string;
  heroDesc: string;
  searchPlaceholder: string;
  chips: CareerChip[];
  sectionTitle: string;
  sectionSub: string;
  emptyHint: string;
  // Bazar: banner contextual (los ítems no tienen carrera en el backend)
  bazarHint: string;
  bazarSuggest: string;
  // Monetiza: textos del asistente + valores sugeridos de la calculadora
  monetizaDesc: string;
  digitalEx: string;
  fisicoEx: string;
  publishTitlePh: string;
  publishCoursePh: string;
  cycleFocus: [string, string, string, string, string, string, string];
  suggestPrice: number;
  suggestSales: number;
  bazarTitlePh: string;
  bazarPlaces: [string, string, string, string];
  impactTitle: string;
  impactBody: string;
  impactStats: [
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
  ];
  mapLabel: string;
  meetSpots: [string, string];
  meetTimes: [string, string];
  footerTitle: string;
  footerLinks: [string, string, string];
  footerSedes: [string, string];
  legalDesc: string;
  visualIcon: string;
  quoteEyebrow: string;
  quoteText: string;
  quoteBody: string;
  quoteBy1: string;
  quoteBy2: string;
  quoteCardTitle: string;
  quoteCardSub: string;
  quoteCardPrice: string;
  metricAValue: string;
  metricALabel: string;
  metricBValue: string;
  metricBLabel: string;
  metricsCaption: string;
  ctaTitle: string;
  ctaBody: string;
  testiIntro: string;
  testi: [CareerTesti, CareerTesti, CareerTesti];
  imgMetrics: string;
  imgQuote: string;
  visorTemario: Array<{ t: string; d: string }>;
  resDigitalTitle: string;
  resFisicoTitle: string;
  feeDigitalTitle: string;
  feeFisicoTitle: string;
  feeFisicoBody: string;
  equivLow: [string, string];
  equivMid: [string, string];
  equivHigh: [string, string];
}

export interface CareerTesti {
  name: string;
  meta1: string;
  meta2: string;
  price: string;
  priceNote: string;
  quote: string;
  downloads: string;
  tag: string;
}
