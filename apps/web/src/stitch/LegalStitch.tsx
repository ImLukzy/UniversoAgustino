// GENERADO por scripts/migrate-stitch.mjs desde marco_legal_y_tica_acad_mica_d.l._822/code.html (diseño Stitch 1:1).
// La interactividad original (<script> de Stitch) está re-implementada con React (ver wire*).
import { useState } from "react";
import { StitchHeader } from "../components/StitchHeader";
import { StitchFooter } from "../components/StitchFooter";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/careerContent";
import { CareerPhoto } from "../components/CareerVisual";
import { Accordion } from "../components/Accordion";
/* LIVE-CAREER v1 */
/* LIVE-HEADER v1 */
export function LegalStitch() {
  const { accent, career: liveCareer } = useCareerTheme();
  const cc = careerContent(liveCareer);
  const [openFaq, setOpenFaq] = useState(-1);
  return (
    <>
<StitchHeader active="legal" /><main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">
{/*Top Compliance Alert Banner*/}
<section className="w-full bg-surface-container-high py-space-sm px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="max-w-container-max mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-title-lg" style={{fontVariationSettings: "'FILL' 1"}}>policy</span>
<span className="font-label-md text-label-md font-semibold">Portal Oficial de Transparencia Jurídica &amp; Propiedad Intelectual</span>
</div>
<div className="flex items-center gap-space-xs">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Revisión Semestral 2024-II Vigente • Área Salud Arequipa</span>
</div>
</div>
</section>
{/*Main Headline Block with Academic Architecture*/}
<section className="w-full py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop relative overflow-hidden">
<div className="max-w-container-max mx-auto relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-8 flex flex-col gap-space-md">
<div className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container rounded-full w-fit">
<span className="material-symbols-outlined text-primary text-title-md" style={accent ? { color: accent.color } : undefined}>gavel</span>
<span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>Regulación Nacional D.L. 822</span>
</div>
<h1 className="font-display text-display text-on-surface tracking-tight leading-tight">
            Guía de Cumplimiento Legal y Ética Académica en el Perú:
            <span className="text-primary block mt-space-xs" style={accent ? { color: accent.color } : undefined}>Estudia, Comparte y Emprende con Total Seguridad</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
            {cc.legalDesc}
          </p>
{/*Formal Endorsement Badges*/}
<div className="flex flex-wrap items-center gap-space-sm pt-space-sm">
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm">
<span className="material-symbols-outlined text-tertiary text-title-md" style={accent ? { color: accent.color, fontVariationSettings: "'FILL' 1" } : {fontVariationSettings: "'FILL' 1"}}>verified</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm font-bold text-on-surface">Auditado bajo normativa INDECOPI</span>
<span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-none">Dirección de Derecho de Autor</span>
</div>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm">
<span className="material-symbols-outlined text-secondary text-title-md" style={accent ? { color: accent.color, fontVariationSettings: "'FILL' 1" } : {fontVariationSettings: "'FILL' 1"}}>account_balance</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm font-bold text-on-surface">Ley Universitaria N° 30220</span>
<span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-none">Tribunales de Honor UNSA</span>
</div>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-sm rounded-xl shadow-sm">
<span className="material-symbols-outlined text-primary text-title-md" style={accent ? { color: accent.color, fontVariationSettings: "'FILL' 1" } : {fontVariationSettings: "'FILL' 1"}}>shield</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm font-bold text-on-surface">Escudo Protector de Autores</span>
<span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-none">Safe Harbor DMCA / Perú</span>
</div>
</div>
</div>
</div>
<div className="lg:col-span-4 flex flex-col gap-space-md">
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md relative overflow-hidden">
<div className="flex items-center justify-between mb-space-sm">
<span className="font-label-md text-label-md font-bold text-primary uppercase" style={accent ? { color: accent.color } : undefined}>Ecosistema Seguro</span>
<span className="font-label-sm text-label-sm bg-surface-container px-space-xs py-space-xxs rounded-md text-on-surface-variant">Métricas 2024</span>
</div>
<div className="grid grid-cols-2 gap-space-md mb-space-md">
<div className="p-space-sm bg-surface-container-low rounded-lg">
<span className="font-headline-md text-headline-md text-on-surface font-bold block" style={accent ? { color: accent.color } : undefined}>{cc.metricAValue}</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">{cc.metricALabel}</span>
</div>
<div className="p-space-sm bg-surface-container-low rounded-lg">
<span className="font-headline-md text-headline-md text-tertiary font-bold block" style={accent ? { color: accent.color } : undefined}>{cc.metricBValue}</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">{cc.metricBLabel}</span>
</div>
</div>
<div className="relative h-44 rounded-lg overflow-hidden bg-surface-container">
<CareerPhoto src={cc.imgMetrics} alt={cc.metricsCaption} className="absolute inset-0 h-full w-full" />
<div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent flex items-end p-space-sm pointer-events-none">
<span className="font-label-sm text-label-sm text-surface-container-lowest font-medium">{cc.metricsCaption}</span>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/*Side-by-Side Visual Comparison Matrix*/}
<section className="w-full py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop bg-surface-container-low">
<div className="max-w-container-max mx-auto flex flex-col gap-space-xl">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
<div>
<span className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">Matriz de Cumplimiento Binario</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">
            ¿Qué puedes compartir legalmente y qué constituye falta grave?
          </h2>
</div>
<p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          El Decreto Legislativo 822 protege la obra del profesor y sanciona la comercialización no autorizada de evaluaciones creadas por la cátedra.
        </p>
</div>
{/*Matrix Cards*/}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
{/*COLUMNA ROJA: Prohibido e Ilegal*/}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 left-0 right-0 h-2 bg-error"></div>
<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center">
<span className="material-symbols-outlined text-title-lg" style={{fontVariationSettings: "'FILL' 1"}}>block</span>
</div>
<div>
<span className="font-label-sm text-label-sm text-error font-bold uppercase tracking-wider">Infracción Punible</span>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Prohibido e Ilegal: Exámenes Oficiales</h3>
</div>
</div>
<span className="px-space-sm py-space-xxs bg-error-container text-on-error-container rounded-full font-label-sm text-label-sm font-bold">
                Tolerancia Cero
              </span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              La reproducción o venta de exámenes institucionales vulnera la propiedad intelectual del catedrático y atenta contra el Estatuto Universitario.
            </p>
<div className="flex flex-col gap-space-sm">
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
<span className="material-symbols-outlined text-error text-title-md shrink-0">cancel</span>
<div>
<strong className="font-title-md text-title-md text-on-surface block">Filtrar o vender pruebas tomadas por profesores</strong>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                    Fotografías a espaldas del aula o copias de parciales tomados en la UNSA.
                  </p>
</div>
</div>
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
<span className="material-symbols-outlined text-error text-title-md shrink-0">cancel</span>
<div>
<strong className="font-title-md text-title-md text-on-surface block">Utilizar el nombre o imagen del docente en el documento</strong>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                    Títulos como "Examen resuelto del Dr. Morales" o menciones directas lesionan el derecho moral a la paternidad de la obra y derecho al honor.
                  </p>
</div>
</div>
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
<span className="material-symbols-outlined text-error text-title-md shrink-0">cancel</span>
<div>
<strong className="font-title-md text-title-md text-on-surface block">PDFs de libros escaneados completos (Piratería Médica)</strong>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                    Distribución con fines de lucro de ediciones de Elsevier, Panamericana o McGraw-Hill sin licencia editorial.
                  </p>
</div>
</div>
</div>
</div>
{/*Sanciones Reales Box*/}
<div className="mt-space-lg p-space-md bg-error-container/30 rounded-lg flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs text-error">
<span className="material-symbols-outlined text-title-md font-bold">warning</span>
<span className="font-label-md text-label-md font-bold">Sanciones Reales Tipificadas</span>
</div>
<ul className="font-body-sm text-body-sm text-on-surface-variant list-disc pl-5 space-y-1">
<li><strong>Expulsión universitaria o suspensión de matrícula</strong> por falta grave según el Reglamento Disciplinario Estudiantil.</li>
<li><strong>Denuncias ante INDECOPI:</strong> Multas coercitivas de hasta 180 UIT por infracción al D.L. 822.</li>
<li><strong>Inhabilitación de cuenta</strong> y reporte automático de IP a las secretarías académicas de Arequipa.</li>
</ul>
</div>
</div>
{/*COLUMNA VERDE: 100% Legal y Permitido*/}
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 left-0 right-0 h-2 bg-tertiary"></div>
<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between pb-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
<span className="material-symbols-outlined text-title-lg" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
</div>
<div>
<span className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-wider">Creación Legítima</span>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">100% Legal y Permitido: Obra Derivada y Resumen</h3>
</div>
</div>
<span className="px-space-sm py-space-xxs bg-tertiary-fixed text-on-tertiary-fixed rounded-full font-label-sm text-label-sm font-bold">
                Autoría Propia
              </span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Eres dueño de tus apuntes y del esfuerzo cognitivo que empleas para sintetizar la ciencia del cuidado. ¡Monetizar tu pedagogía es un derecho!
            </p>
<div className="flex flex-col gap-space-sm">
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
<span className="material-symbols-outlined text-tertiary text-title-md shrink-0">task_alt</span>
<div>
<strong className="font-title-md text-title-md text-on-surface block">Simulacros de preguntas redactadas por el propio alumno</strong>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                    Casos ficticios con retroalimentación original basados en objetivos de aprendizaje del currículo de enfermería.
                  </p>
</div>
</div>
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
<span className="material-symbols-outlined text-tertiary text-title-md shrink-0">task_alt</span>
<div>
<strong className="font-title-md text-title-md text-on-surface block">Resúmenes, mnemotecnias, esquemas y cuadros comparativos</strong>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                    Fichas farmacológicas ilustradas, diagramas de flujo del Proceso de Atención de Enfermería (PAE) y mapas mentales propios.
                  </p>
</div>
</div>
<div className="p-space-md bg-surface-container-low rounded-lg flex items-start gap-space-sm">
<span className="material-symbols-outlined text-tertiary text-title-md shrink-0">task_alt</span>
<div>
<strong className="font-title-md text-title-md text-on-surface block">Guías prácticas de orientación para guardias hospitalarias</strong>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xxs">
                    Manuales de supervivencia hospitalaria en Honorio Delgado o Goyeneche creados por internos para alumnos de ciclos inferiores.
                  </p>
</div>
</div>
</div>
</div>
{/*Beneficios Legales Box*/}
<div className="mt-space-lg p-space-md bg-tertiary/10 rounded-lg flex flex-col gap-space-xs">
<div className="flex items-center gap-space-xs text-tertiary">
<span className="material-symbols-outlined text-title-md font-bold">verified_user</span>
<span className="font-label-md text-label-md font-bold">Respaldo Jurídico para Creadores</span>
</div>
<ul className="font-body-sm text-body-sm text-on-surface-variant list-disc pl-5 space-y-1">
<li><strong>Protección de Derechos Morales:</strong> Tu firma y reconocimiento como autor quedan registrados permanentemente.</li>
<li><strong>Comisiones directas (80%-85%)</strong> pagadas vía Yape/Plin con liquidación instantánea por descarga.</li>
<li><strong>Certificado digital de autor estudiante</strong> emitido por Universo Agustino.</li>
</ul>
</div>
</div>
</div>
</div>
</section>
{/*Visual Break / Image & Stats Callout*/}
<section className="w-full py-space-xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="max-w-container-max mx-auto bg-primary text-on-primary rounded-2xl p-space-xl relative overflow-hidden shadow-lg" style={accent ? { backgroundColor: accent.color } : undefined}>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center relative z-10">
<div className="lg:col-span-7 flex flex-col gap-space-sm">
<span className="font-label-md text-label-md bg-surface-container-lowest/20 w-fit px-space-sm py-space-xxs rounded-full font-semibold uppercase tracking-wider text-on-primary">
            {cc.quoteEyebrow}
          </span>
<h2 className="font-headline-lg text-headline-lg font-bold leading-tight">
            &ldquo;{cc.quoteText}&rdquo;
          </h2>
<p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
            {cc.quoteBody}
          </p>
<div className="pt-space-xs flex items-center gap-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-title-lg">verified</span>
<span className="font-label-sm text-label-sm font-semibold">{cc.quoteBy1}</span>
</div>
<span className="text-on-primary/40">•</span>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-title-lg">lock</span>
<span className="font-label-sm text-label-sm font-semibold">{cc.quoteBy2}</span>
</div>
</div>
</div>
<div className="lg:col-span-5 flex justify-center">
<div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-surface-container-lowest p-space-xs">
<CareerPhoto src={cc.imgQuote} alt={cc.quoteCardTitle} className="w-full h-56 rounded-lg" />
<div className="p-space-sm flex justify-between items-center text-on-surface">
<div>
<span className="font-label-sm text-label-sm text-tertiary font-bold block" style={accent ? { color: accent.color } : undefined}>{cc.quoteCardTitle}</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">{cc.quoteCardSub}</span>
</div>
<span className="font-label-sm text-label-sm bg-surface-container px-space-sm py-space-xxs rounded-full font-bold text-primary" style={accent ? { color: accent.color } : undefined}>{cc.quoteCardPrice}</span>
</div>
</div>
</div>
</div>
</div>
</section>
{/*Decálogo de Términos y Condiciones para Creadores*/}
<section className="w-full py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="max-w-container-max mx-auto flex flex-col gap-space-xl">
<div className="text-center max-w-2xl mx-auto">
<span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">Pacto de Confianza Estudiantil</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xxs">
          Decálogo de Términos y Condiciones para Estudiantes Creadores
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
          Reglas claras y vinculantes que protegen a quien comparte sus apuntes y salvaguardan la reputación universitaria de nuestra comunidad.
        </p>
</div>
{/*Bento Grid for Decálogo Clauses*/}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
{/*Cláusula 1*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-headline-sm font-bold">
              01
            </div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Cláusula de Originalidad y Derechos Morales</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              El estudiante creador conserva la titularidad moral inalienable sobre sus obras. Al publicar en la plataforma, declaras bajo juramento haber redactado los resúmenes, esquemas y cuadros por cuenta propia sin copia servil ni plagio.
            </p>
</div>
<div className="mt-space-md pt-space-xs flex items-center gap-space-xs text-primary font-label-sm text-label-sm font-bold">
<span className="material-symbols-outlined text-title-sm">verified</span>
            D.L. 822 Art. 21 y 22
          </div>
</div>
{/*Cláusula 2*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary font-headline-sm font-bold">
              02
            </div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Licencia de Distribución No Exclusiva</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Otorgas a Universo Agustino una licencia no exclusiva, revocable en cualquier momento, para alojar, comprimir y comercializar tus documentos en la red universitaria. Eres libre de publicar tus notas en otros medios personales.
            </p>
</div>
<div className="mt-space-md pt-space-xs flex items-center gap-space-xs text-secondary font-label-sm text-label-sm font-bold">
<span className="material-symbols-outlined text-title-sm">share</span>
            Libertad Intelectual
          </div>
</div>
{/*Cláusula 3*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-error-container/50 flex items-center justify-center text-error font-headline-sm font-bold">
              03
            </div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Prohibición Estricta de Escudos y Sellos</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Está categóricamente prohibido estampar logotipos, isotipos o sellos oficiales de la UNSA, EsSalud o MINSA en tus archivos a menos que cuentes con autorización institucional expresa. Se debe identificar como apunte independiente.
            </p>
</div>
<div className="mt-space-md pt-space-xs flex items-center gap-space-xs text-error font-label-sm text-label-sm font-bold">
<span className="material-symbols-outlined text-title-sm">shield_moon</span>
            Uso Indebido de Marca
          </div>
</div>
{/*Cláusula 4*/}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed font-headline-sm font-bold">
              04
            </div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">Política Take-Down en menos de 24 Horas</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Si un docente, autor o institución detecta que un material compromete datos restringidos o propiedad ajena, Universo Agustino retira preventivamente el documento en menos de 24 horas hábiles tras la solicitud formal con sustento.
            </p>
</div>
<div className="mt-space-md pt-space-xs flex items-center gap-space-xs text-tertiary font-label-sm text-label-sm font-bold">
<span className="material-symbols-outlined text-title-sm">timer</span>
            Respuesta Ágil &lt; 24h
          </div>
</div>
</div>
{/*Extended Secondary Clauses (colapsables para escaneo rápido)*/}
<div className="pt-space-xs">
<Accordion
  items={[
    {
      id: "anonimizacion",
      icon: "fingerprint",
      title: "5. Anonimización de Casos Clínicos",
      body: (
        <p>
          Bajo la Ley N° 29733 (Protección de Datos Personales), jamás incluyas nombres, DNI ni números de cama de pacientes reales del Goyeneche o Honorio Delgado.
        </p>
      ),
    },
    {
      id: "precios",
      icon: "price_change",
      title: "6. Precios Transparentes y Comisiones Justas",
      body: (
        <p>
          El creador fija el precio (rango sugerido S/ 2.50 a S/ 15.00). La retención de plataforma oscila entre el 15% y 20% para sustentar costos de servidor y verificación.
        </p>
      ),
    },
    {
      id: "calificacion",
      icon: "rate_review",
      title: "7. Calificación por Pares y Calidad",
      body: (
        <p>
          Los compradores evalúan la exactitud biomédica. Documentos con errores graves de cálculo farmacológico son pausados para revisión médica de emergencia.
        </p>
      ),
    },
  ]}
/>
</div>
</div>
</section>
{/*Interactive Legal FAQ*/}
<section className="w-full py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop bg-surface-container-low">
<div className="max-w-container-max mx-auto">
<div className="flex flex-col lg:flex-row gap-space-2xl">
<div className="lg:w-1/3 flex flex-col gap-space-md">
<span className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold">Consultorio Jurídico Rápido</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">
            Preguntas Frecuentes de la Comunidad de Enfermería
          </h2>
<p className="font-body-md text-body-md text-on-surface-variant">
            Respuestas redactadas en colaboración con asesores de propiedad intelectual y estudiantes de Derecho de Arequipa.
          </p>
<div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col gap-space-sm mt-space-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold">¿Tienes una duda específica de tu ciclo?</span>
<span className="font-title-md text-title-md text-on-surface font-bold">Contacta con el Comité de Ética</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              Revisamos tus fichas antes de ponerlas a la venta para certificar que cumples con D.L. 822.
            </p>
<button className="w-full mt-space-xs py-space-sm px-space-md bg-secondary text-on-secondary rounded-lg font-label-lg text-label-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-space-xs">
<span className="material-symbols-outlined text-title-md">send</span>
              Enviar Consulta Previa
            </button>
</div>
</div>
<div className="lg:w-2/3 flex flex-col gap-space-sm" id="faq-accordion-container">
{/*FAQ 1*/}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden faq-item">
<button className="w-full p-space-lg text-left flex items-center justify-between gap-space-md faq-btn" onClick={() => setOpenFaq(openFaq === 0 ? -1 : 0)} aria-expanded={openFaq === 0}>
<span className="font-title-lg text-title-lg text-on-surface font-bold">
                ¿Puedo citar la dosis de medicamentos, el NANDA o las Guías Clínicas del MINSA?
              </span>
<span className="material-symbols-outlined text-primary text-headline-sm transition-transform duration-200 shrink-0 icon-arrow" style={{ transform: openFaq === 0 ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
</button>
<div className={`px-space-lg pb-space-lg pt-0 text-on-surface-variant font-body-md text-body-md leading-relaxed ${openFaq === 0 ? "" : "hidden"} faq-content`}>
<div className="pt-space-xs space-y-2">
<p>
<strong>Sí, totalmente legal.</strong> Según el Art. 44 del D.L. 822, el derecho de cita autoriza la reproducción de extractos con fines docentes y de investigación, siempre que indiques la fuente original (ej. <em>Taxonomía NANDA-I 2021-2023</em> o <em>Guía de Práctica Clínica MINSA R.M. 345</em>).
                </p>
<p>
                  Lo que no puedes hacer es copiar capítulos enteros de manuales comerciales sin agregar un análisis personal, mapa conceptual o contextualización hospitalaria propia.
                </p>
</div>
</div>
</div>
{/*FAQ 2*/}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden faq-item">
<button className="w-full p-space-lg text-left flex items-center justify-between gap-space-md faq-btn" onClick={() => setOpenFaq(openFaq === 1 ? -1 : 1)} aria-expanded={openFaq === 1}>
<span className="font-title-lg text-title-lg text-on-surface font-bold">
                ¿Qué sucede si un docente de mi facultad reconoce su caso clínico en mis notas?
              </span>
<span className="material-symbols-outlined text-primary text-headline-sm transition-transform duration-200 shrink-0 icon-arrow" style={{ transform: openFaq === 1 ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
</button>
<div className={`px-space-lg pb-space-lg pt-0 text-on-surface-variant font-body-md text-body-md leading-relaxed ${openFaq === 1 ? "" : "hidden"} faq-content`}>
<div className="pt-space-xs space-y-2">
<p>
                  Las ideas científicas, los diagnósticos y los síntomas médicos <strong>no son susceptibles de monopolio intelectual</strong> según la legislación peruana. Sin embargo, la redacción exacta de un problema dictado por un catedrático sí tiene tutela.
                </p>
<p>
<strong>Nuestra recomendación obligatoria:</strong> Refrasea y adapta los escenarios clínicos. Si un profesor notifica que se reprodujo un ejercicio literal con sus datos particulares, se activa el protocolo <em>Take-Down</em> de 24 horas y se te asesora para reformularlo limpiamente sin sanción disciplinaria.
                </p>
</div>
</div>
</div>
{/*FAQ 3*/}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden faq-item">
<button className="w-full p-space-lg text-left flex items-center justify-between gap-space-md faq-btn" onClick={() => setOpenFaq(openFaq === 2 ? -1 : 2)} aria-expanded={openFaq === 2}>
<span className="font-title-lg text-title-lg text-on-surface font-bold">
                ¿Cómo emitir boleta o recibo por honorarios si mis ventas mensuales superan los S/ 1,500?
              </span>
<span className="material-symbols-outlined text-primary text-headline-sm transition-transform duration-200 shrink-0 icon-arrow" style={{ transform: openFaq === 2 ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
</button>
<div className={`px-space-lg pb-space-lg pt-0 text-on-surface-variant font-body-md text-body-md leading-relaxed ${openFaq === 2 ? "" : "hidden"} faq-content`}>
<div className="pt-space-xs space-y-2">
<p>
                  Universo Agustino liquida las ganancias directamente a tu billetera digital (Yape o Plin). Cuando tus ingresos por material digital excedan el monto de exención de SUNAT o requieras justificar ingresos para bancarización:
                </p>
<ul className="list-disc pl-5 space-y-1">
<li>Puedes tramitar tu RUC 10 con régimen tributario especial de rentas de capital (Regalías por derechos de autor, gravadas con tasa preferencial del 5%).</li>
<li>O emitir <em>Recibo por Honorarios Electrónico</em> bajo el concepto de "Asesoría y elaboración pedagógica de material biomédico".</li>
</ul>
<p>
                  Ofrecemos una guía contable en PDF para estudiantes creadores dentro del panel 'Vender &amp; Monetizar'.
                </p>
</div>
</div>
</div>
{/*FAQ 4*/}
<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden faq-item">
<button className="w-full p-space-lg text-left flex items-center justify-between gap-space-md faq-btn" onClick={() => setOpenFaq(openFaq === 3 ? -1 : 3)} aria-expanded={openFaq === 3}>
<span className="font-title-lg text-title-lg text-on-surface font-bold">
                ¿Puedo usar grabaciones de voz de las clases teóricas para transcribir resúmenes?
              </span>
<span className="material-symbols-outlined text-primary text-headline-sm transition-transform duration-200 shrink-0 icon-arrow" style={{ transform: openFaq === 3 ? "rotate(180deg)" : "rotate(0deg)" }}>expand_more</span>
</button>
<div className={`px-space-lg pb-space-lg pt-0 text-on-surface-variant font-body-md text-body-md leading-relaxed ${openFaq === 3 ? "" : "hidden"} faq-content`}>
<div className="pt-space-xs space-y-2">
<p>
<strong>No directamente como transcripción literal.</strong> La voz y la clase magistral del docente forman parte de su patrimonio intelectual y esfera de privacidad.
                </p>
<p>
                  Está permitido utilizar lo escuchado para redactar con tus propias palabras, agregar referencias bibliográficas de libros acreditados y estructurar un cuadro didáctico. El contenido final debe ser el resultado de tu propia comprensión y redacción.
                </p>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/*Notice of Take-Down Action Protocol (Step-by-Step)*/}
<section className="w-full py-space-2xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
<div className="max-w-container-max mx-auto flex flex-col gap-space-lg">
<div className="flex flex-col gap-space-xs">
<span className="font-label-md text-label-md uppercase tracking-wider text-error font-bold">Canal de Denuncia &amp; Reclamos</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">
          Protocolo de Retiro Inmediato (Notice &amp; Takedown)
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Procedimiento sumario para catedráticos, autores y representantes de universidades que soliciten la suspensión de un recurso en línea.
        </p>
</div>
<div className="max-w-3xl">
<Accordion
  items={[
    {
      id: "paso-1",
      icon: "mark_email_read",
      eyebrow: "Paso 1",
      title: "Recepción del Reclamo",
      body: (
        <p>
          El docente o titular remite un reporte desde el Centro de soporte (Gestión de Ventas) adjuntando el enlace del recurso e indicando el fragmento o titularidad vulnerada.
        </p>
      ),
    },
    {
      id: "paso-2",
      icon: "block",
      eyebrow: "Paso 2",
      title: "Baja Preventiva (< 24h)",
      body: (
        <p>
          El archivo es desindexado automáticamente del marketplace y se retiene el balance generado mientras la comisión de ética efectúa la compulsa jurídica.
        </p>
      ),
    },
    {
      id: "paso-3",
      icon: "rule",
      eyebrow: "Paso 3",
      title: "Descargo y Resolución",
      body: (
        <p>
          Se otorga 48 horas al creador para sustentar autoría. Si se confirma copia no autorizada, se elimina el archivo y se notifica la sanción al usuario.
        </p>
      ),
    },
  ]}
/>
</div>
</div>
</section>
{/*Final Affirmation / Call to Action*/}
<section className="w-full py-space-xl px-margin-mobile md:px-margin-tablet lg:px-margin-desktop bg-surface-container-high/60">
<div className="max-w-container-max mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-lg">
<div className="flex items-center gap-space-md">
<div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shrink-0 shadow-sm">
<span className="material-symbols-outlined text-headline-sm">draw</span>
</div>
<div>
<h3 className="font-title-lg text-title-lg text-on-surface font-bold">¿Listo para subir tus fichas originales?</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Revisamos tu archivo en menos de 2 horas antes de activarlo para la venta.</p>
</div>
</div>
<div className="flex items-center gap-space-sm w-full sm:w-auto">
<a className="w-full sm:w-auto px-space-xl py-space-sm bg-primary text-on-primary rounded-lg font-label-lg text-label-lg font-bold text-center hover:bg-primary-container transition-colors shadow-sm" data-path="vender-y-monetizar" href="#" style={accent ? { backgroundColor: accent.color } : undefined}>
          Comenzar a Monetizar Éticamente
        </a>
</div>
</div>
</section>
</div>
</main><StitchFooter />
    </>
  );
}

/* LIVE-ACCENT v1 */
