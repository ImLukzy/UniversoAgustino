# Especificación: 17 - Landing funcional: quizzes, carreras UNSA, multidispositivo y FAQ

## 1. Objetivo
**Problema:** en la landing pública (`pages/PublicLanding.tsx`) el quiz es una sola pregunta de adorno (`FeatureMocks.tsx › QuizMock`), "Explora lo que estudian en la UNSA" (`LandingShowcase.tsx`) lista 16 temas en 5 áreas que abren `?q=` y no la carrera, las filas "Nunca te pierdas nada" (`FeatureRows.tsx`) y "Lleva tus apuntes" (`LandingStats.tsx`) usan pasteles, sombras suaves y colores fijos (`#2e8bff`, `#264a0c`) fuera del sistema rudo, y el FAQ (`LandingFAQ.tsx`) tiene 5 preguntas, una de ellas desactualizada ("se desbloquea al pagar" → hoy exige pago verificado, spec 16).
**Resultado esperado:** el visitante practica con un quiz real (varias preguntas por área, aciertos/errores en vivo, explicación, resultado y reinicio); explora todas las escuelas UNSA (20, 5 nuevas) con tarjetas que abren `/explorar?career=KEY`; las secciones de características y multidispositivo siguen la estética rudo (borde `zinc-900`, sombra dura); el FAQ responde 10 preguntas clave alineadas con el backend.

## 2. Fuera de alcance
- Cambiar la comisión, la máquina de estados o las reglas de reembolso (el FAQ solo las describe).
- Persistir resultados de quizzes o crear quizzes en el backend.
- Contenido contextual (`data/career/*.ts`) para las escuelas nuevas: usan el genérico UNSA.
- Home con sesión (`pages/Home.tsx`).

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (la ampliación de escuelas la pidió el usuario; `career` es `String` en Prisma, sin migración).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `packages/shared/src/common.ts` | modificar | `CareerSchema` + ING_MECANICA, ING_QUIMICA, ING_MINAS, TURISMO, COMUNICACION |
| `apps/web/src/data/unsa.ts`, `lib/unsa-colors.test.ts` | modificar | 20 escuelas, colores únicos AA |
| `apps/web/src/lib/quiz.ts` (+ `quiz.test.ts`) | crear | estado puro del quiz |
| `apps/web/src/data/quizzes.ts` | crear | bancos por área (5 × 5) con explicación |
| `apps/web/src/data/{landingCareers,landingFaq}.ts` | crear | datos del showcase y del FAQ (en `data/` para que `subset-icons` lea sus iconos) |
| `scripts/subset-icons.mjs` | modificar | detecta iconos en `motion.span` y en props `icon="…"` (faltaba `expand_more` del acordeón) |
| `apps/web/src/components/landing/quiz/*` | crear | `QuizPractice`, `QuizOption`, `QuizResult` |
| `apps/web/src/components/landing/{LandingFeatures,FeatureMocks,FeatureRows}.tsx` | modificar | quiz real en `#practica`; filas rudo |
| `apps/web/src/components/landing/{LandingDevices,DevicesMock}.tsx` | crear | "Lleva tus apuntes" rudo |
| `apps/web/src/components/landing/LandingStats.tsx` | modificar | solo cifras |
| `apps/web/src/components/landing/LandingShowcase.tsx` | modificar | tarjetas por escuela → `?career=` |
| `apps/web/src/components/landing/LandingFAQ.tsx` | modificar | 11 preguntas |
| `apps/web/src/pages/PublicLanding.tsx` | modificar | orden de secciones |
| `apps/web/index.html` | modificar | subset de iconos |
| `docs/PROJECT_CONTEXT.md` | modificar | enum de 20 |

## 4. Diseño y lógica
- **Quiz:** `startQuiz(n)`, `answer(s, i)` (una sola vez por pregunta), `next(s)`, `tally(questions, picks)`; al pasar la última pregunta se muestra el resultado con reinicio. Acierto = `primary`/`primary-soft`; error = rojo semántico `#b91c1c`. Huecos de pregunta y explicación con `min-h` (CLS ≈ 0).
- **Escuelas:** filtro por área (Todas, Salud, Ingenierías, Sociales, Negocios); cada tarjeta = icono con el color identidad de la escuela, facultad y 3 cursos; enlace `/explorar?career=KEY` (el hook `useExploreParams` aplica tema y filtro).
- **Rudo:** `.card`/`.sheet` o `border-2 border-zinc-900` + sombra `rgb(var(--ua-ink))`; CTAs `.btn-primary`; motion con `SPRING`.
- **FAQ:** pagos (Yape/Plin manual + Mercado Pago si está activo), comisión 13 % (`PLATFORM_FEE_PCT`), custodia y liberación, entregas del bazar, correo `@unsa.edu.pe`, desbloqueo (muestra elegida por el vendedor + pago verificado), reembolsos (moderación, pedidos PAID/ESCROW, reporte < 48 h), reserva de 30 min, marca de agua, cómo vender.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores |
| A3 | Tests | `npm test` | verde; nuevos en `quiz.test.ts`; `unsa-colors.test.ts` con 20 |
| A5 | Tamaño | `.ts/.tsx` tocados ≤ 150 líneas | ≤ 150 |
| A6 | CLS / visual | `scripts/visual-regression.mjs` | sin fallos |
| A11 | Comportamiento | landing: responder, ver contador, terminar, reiniciar; tarjeta → `/explorar?career=MEDICINA` | pasa |

## 6. Checklist de ejecución
- [x] T1: 5 escuelas nuevas en `CareerSchema` y `UNSA_CAREERS` (+ test de colores).
- [x] T2: lógica `lib/quiz.ts` + tests y bancos `data/quizzes.ts`.
- [x] T3: `QuizPractice` en la landing (`#practica`), reemplaza `QuizMock`.
- [x] T4: showcase de escuelas con `?career=`.
- [x] T5: filas de características y "Lleva tus apuntes" en estética rudo.
- [x] T6: FAQ de 10 preguntas.
- [x] T7: A1–A11 y registro en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-09-24 | A1 | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | A2 | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | A3 | ✅ | api 37, web 41 (+4 `quiz.test.ts`), shared 34 |
| 2026-09-24 | A5 | ✅ | máx. tocado: `FeatureRows.tsx` 88 |
| 2026-09-24 | A6 | ✅ | `visual-regression.mjs` 22/22; CLS `/` 0.007 (1280) / 0.011 (375) |
| 2026-09-24 | A11 | ✅ | Playwright 1280 y 375: respuesta → contador 0✓/1✗ + explicación; 5 preguntas → "1/5"; reiniciar → "Pregunta 1 de 5"; 19 tarjetas; clic Medicina → `/explorar?career=MEDICINA`; 11 FAQ; 0 px de scroll horizontal; 0 errores de consola |
