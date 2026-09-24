import type { CareerContent } from "./types";

export const ENFERMERIA: CareerContent = {
  chips: [
    { label: "Fichas de Fármacos y Dilución", docType: "APUNTE", q: "" },
    { label: "Guías de Supervivencia PAE", docType: "PAE", q: "" },
    { label: "Mapas Anatomía/Fisio", docType: "all", q: "mapa" },
    { label: "Simulacros & Balotarios Propios", docType: "BALOTARIO", q: "" },
    { label: "Plantillas de Valoración", docType: "GUIA", q: "" },
  ],
  bazarHint:
    "Libros de farmacología y semiología, scrubs clínicos, tensiómetros y maletines de enfermería.",
  bazarSuggest: "tensiómetro",
  monetizaDesc:
    "Cientos de estudiantes de la UNSA monetizan sus fichas PAE, tablas farmacológicas y manuales clínicos. Cobro semanal directo a Yape o Plin con total transparencia fiscal y cumplimiento legal.",
  digitalEx: "PDF, Guías, Esquemas NANDA",
  fisicoEx: "Bolsos, uniformes, estetoscopios",
  publishTitlePh: "Ej. Fichas PAE Pediátricas con diagnósticos NANDA 2021-2023",
  publishCoursePh: "Ej. Farmacología Clínica II, Cuidados Críticos",
  suggestPrice: 12,
  suggestSales: 45,
  bazarTitlePh: "Ej: Manual de Farmacología Clínica 9na ed.",
  bazarPlaces: ["UNSA Biomédicas", "UNSA Campus Central", "Hospital Honorio Delgado", "Hospital Goyeneche"],
  meetSpots: ["Campus UNSA (Área Biomédicas)", "Hospital Goyeneche (Hall Principal)"],
  meetTimes: ["Lun - Sáb (8:00 - 18:00)", "Cambio de Turno (13:30)"],
  legalDesc: "La formación clínica de enfermería en Arequipa exige rigor ético, tanto frente al paciente como en la producción intelectual. Conoce las fronteras entre el delito de infracción patrimonial y el legítimo derecho a monetizar tus propios resúmenes, esquemas PAE y guías de rotación.",
  visualIcon: "local_hospital",
  ctaTitle: "La colegiatura en el CEP Arequipa bordea los S/ 1,800.",
  ctaBody: "Comienza a generar el fondo hoy con tus apuntes de semestres cursados. Publicar un recurso toma menos de 5 minutos y el cobro se deposita directamente a tu billetera personal.",
  resDigitalTitle: "Apunte Digital / PAE",
  resFisicoTitle: "Material Clínico Físico",
  feeDigitalTitle: "Modelo de retención para Apuntes Digitales",
  feeFisicoTitle: "Modelo para Bazar Clínico Físico",
  feeFisicoBody: "Comisión del 13% por artículo vendido para coordinar el punto de entrega segura en campus o sedes hospitalarias de Arequipa.",
  equivLow: ["Trámites de laboratorio y vacunas de internado", "Juego de tijeras mayo, pinzas de disección y riñonera"],
  equivMid: ["Derecho de matrícula semestral completo", "2 juegos de chaquetas clínicas bordadas"],
  equivHigh: ["Aporte del 50% al derecho de colegiatura del CEP", "Estetoscopio profesional tipo Littmann Classic III"],
  imgQuote: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=70",
};
