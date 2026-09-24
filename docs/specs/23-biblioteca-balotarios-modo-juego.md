# Especificación: 23 - Biblioteca de Balotarios y Exámenes Interactivos (Modo Juego)

## 1. Objetivo
**Problema:** la biblioteca de la landing (spec 19, `data/examLibrary.ts`) tiene 10 exámenes de 5 preguntas con enunciados de una línea y explicaciones breves. No hay exámenes de admisión, ni ruta propia, y la explicación aparece como texto suelto bajo las opciones.
**Resultado esperado:** biblioteca ampliada (5 facultades × 4 exámenes — Parcial, Final, Balotario y Admisión — × 6 preguntas rigurosas con explicación pedagógica detallada), jugable en la landing y en la ruta pública `/balotarios` con un único componente `ExamenInteractivo`: filtros por facultad, tarjetas de examen, progreso por segmentos, marcador ✓/✕ en vivo, feedback instantáneo bloqueado, caja desplegable "Explicación experta" y resultados con reintento.

## 2. Fuera de alcance
- Backend: sin endpoints ni persistencia de resultados; la biblioteca sigue siendo estática en el frontend.
- Las preguntas son de tipo examen por curso: no se atribuyen a un examen, año o docente concretos.
- Textos legales, de cobro o de comisión.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/data/examLibrary.ts` | eliminar | reemplazado por `balotariosData.ts` |
| `apps/web/src/data/balotariosData.ts` | crear | tipos, `BALOTARIOS`, `EXAM_KINDS`, `libraryStats()` |
| `apps/web/src/data/balotarios/{salud,ingenierias,derecho,economicas,sociales}.ts` | crear | 4 exámenes × 6 preguntas por facultad |
| `apps/web/src/components/ExamenInteractivo.tsx` | crear | filtros + tarjetas + juego |
| `apps/web/src/components/examen/{ExamList,QuizPractice,QuizOption,QuizResult,ExplanationBox,ScoreBoard}.tsx` | mover / crear | desde `components/landing/quiz/` |
| `apps/web/src/components/landing/LandingFeatures.tsx` | modificar | usa `ExamenInteractivo` + enlace a `/balotarios` |
| `apps/web/src/pages/Balotarios.tsx` | crear | página pública |
| `apps/web/src/app/AppRoutes.tsx`, `lib/routes.ts`, `components/AppSidebar.tsx` | modificar | ruta lazy `/balotarios` y acceso en el menú |
| `apps/web/src/lib/quiz.test.ts` | modificar | valida la biblioteca ampliada |

## 4. Diseño y lógica
- **UI:** clases del sistema (`.card`, `.chip`, `.btn-*`, `.tag`); acentos solo `primary*`; error en rojo semántico existente (`#b91c1c`); motion solo `SPRING`.
- **Juego:** `lib/quiz.ts` sin cambios (una respuesta por pregunta, avance solo tras responder, `tally`).
- **CLS:** tarjeta de juego de altura fija; el cuerpo (enunciado, opciones, explicación) hace scroll interno y el botón queda fijo abajo.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | verde; `quiz.test.ts` › biblioteca ampliada |
| A5 | Tamaño | componentes tocados ≤ 150 líneas | ≤ 150 |
| A7 | Scroll horizontal | `/balotarios` y `/` a 375 px | 0 px |
| A11 | Comportamiento | Playwright: facultad → examen → responder mal → rojo/verde, explicación, bloqueo; terminar → resultados → reintentar | pasa |

## 6. Checklist de ejecución
- [x] T1: `balotariosData.ts` + 5 archivos de facultad (120 preguntas).
- [x] T2: `ExamenInteractivo` y componentes de `components/examen/` (explicación desplegable, marcador, resultados).
- [x] T3: landing + ruta `/balotarios` + menú.
- [x] T4: A1–A11 y registro.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-24 | A1 | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | A2 | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | A3 | ✅ | api 52, web 48, shared 42 (`quiz.test.ts`: 5×4×6 = 120 preguntas, tipos por facultad, carreras válidas, respuestas repartidas en A–D) |
| 2026-09-24 | A5 | ✅ | mayor componente tocado: `QuizPractice.tsx` 53 líneas |
| 2026-09-24 | A7 | ✅ | `/balotarios` y `/` a 375 px: 0 px durante todo el juego (grilla `grid-cols-1` evita el desborde por textos truncados) |
| 2026-09-24 | A11 | ✅ | Playwright 1280/375: Derecho → Derecho Penal → opción errada en rojo, correcta en verde, resto bloqueado, explicación visible (scroll interno) y plegable; altura de tarjeta constante (608/640 px); resultado 1/6 con aciertos/errores; reintentar → "Pregunta 1 de 6"; 0 errores de página |
| 2026-09-24 | Bundle | ✅ | chunk compartido del juego ≈ 7 KB gzip; `Balotarios` 0,8 KB gzip |
