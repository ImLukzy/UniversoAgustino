# Especificación: 15 - Pendientes de la Auditoría (2026-09-23)

## 1. Objetivo
**Problema:** el refactor terminó con un lote sin verificar, restos de código muerto, tokens MD3 heredados de Stitch, una carpeta `stitch/` con nombres engañosos, ninguna prueba visual medible y un visor que entrega el PDF completo a quien no pagó.
**Resultado:** repo en verde; nombres y tokens coherentes con el sistema de diseño (spec 13); regresión visual medida; y el contenido de pago protegido en el servidor.

## 2. Fuera de alcance
- Decisiones abiertas de las specs 08 (wizard) y 11 (pestañas del panel).
- Cambios de diseño visual: T5 y T6 solo renombran o eliminan, sin alterar el aspecto.
- Scripts y devDependencies de `scripts/` (e2e, Lighthouse, migración a R2), aunque knip los marque como sin uso.

**Requiere aprobación antes de ejecutar:** T7 (visor en el servidor) cambia el contrato de `/uploads` y la experiencia del visor.

## 3. Archivos afectados
| Archivo | Tarea | Acción |
|---|---|---|
| `apps/web/src/components/CareerVisual.tsx` | T1 | quitar el import `useState` sin uso |
| `apps/api/src/lib/storage.ts` | T2 | `export interface StorageConfig` → `interface` (solo se usa en el propio archivo; el test usa `resolveStorageConfig`) |
| `<scratchpad>/base` (worktree de git) | T3 | `git worktree remove --force` + `git worktree prune` |
| `scripts/visual-regression.mjs` | T4 | crear |
| `apps/web/src/stitch/*Stitch.tsx` (5) → `apps/web/src/pages/` | T5 | mover y renombrar |
| `apps/web/src/app/AppRoutes.tsx`, `lib/prefetch.ts`, `lib/routes.ts`, `scripts/subset-icons.mjs` | T5 | actualizar imports y rutas |
| `apps/web/src/App.tsx` | T6 | `bg-surface text-on-surface` → `bg-zinc-50 text-zinc-900` |
| `apps/web/tailwind.config.js` | T6 | eliminar los colores MD3 (`surface*`, `on-*`, `*-container`, `tertiary*`, `secondary*`, `inverse*`, `outline*`, `error*`), el alias `primary-container` y las escalas `spacing` Stitch que no se usen |
| `apps/api/src/middleware/serveUploads.ts` | T7 | control de acceso para PDFs de `Document` de pago |
| `apps/api/src/modules/documents/` (nuevo `preview.ts`) | T7 | `GET /documents/:id/preview` |
| `apps/web/src/components/viewer/useDocAccess.ts`, `PdfPages.tsx` | T7 | usar la vista previa si no hay acceso; `isEvalSupported: false` |
| `apps/api/docs/openapi.yaml` | T7 | documentar |

## 4. Diseño y lógica
- **T5, nombres destino:**

  | Actual | Destino |
  |---|---|
  | `MarketplaceStitch` | `pages/Explorar.tsx` (`Explorar`) |
  | `HomeStitch` | `pages/Home.tsx` |
  | `BazarStitch` | `pages/Bazar.tsx` |
  | `LegalStitch` | `pages/Legal.tsx` |
  | `MonetizaStitch` | `pages/Monetiza.tsx` |

  Se elimina la carpeta `stitch/`. Actualizar las menciones en `docs/specs/*.md` y `docs/plan-desarrollo.md`.
- **T6:** antes de borrar un token, `grep` debe dar 0 usos (`bg-|text-|border-|ring-…<token>`). Hoy solo `App.tsx` usa `bg-surface` y `text-on-surface`.
- **T7, protección en el servidor:**
  - `GET /uploads/:name` y `?stream=1`: si `name` pertenece a un `Document` con `priceCents > 0`, exigir usuario autenticado que sea el autor, tenga un `Order` `PAID|ESCROW|RELEASED` o sea admin. Si no → 403 `PAYWALL`.
  - `GET /documents/:id/preview`: devuelve un PDF con las páginas 1–2 (con `pdf-lib` en el servidor, cacheado por `storedName`), `Cache-Control: private`.
  - Web: sin acceso completo, `PdfPages` carga `/documents/:id/preview`; el `Paywall` sigue igual (altura reservada).
  - `GET /documents/:id` no expone `fileUrl` a quien no tenga acceso completo.

## 5. Criterios de aceptación
| # | Criterio | Verificación | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | ≥ 71 existentes en verde + los nuevos de A10–A12 |
| A4 | Contrato | `npm run docs:check` | en verde |
| A5 | Worktrees | `git worktree list` | 1 línea (solo el repo principal) |
| A6 | Scroll horizontal | `scripts/visual-regression.mjs` en `/`, `/explorar`, `/explorar?career=MEDICINA`, `/bazar`, `/p/document/:id`, `/v/:id`, `/checkout/:id`, `/panel`, `/publicar`, `/legal`, `/monetiza` a 1280×800 y 375×812 | `scrollWidth − innerWidth = 0` en las 22 combinaciones |
| A7 | CLS | `PerformanceObserver('layout-shift')` durante la carga + 2 s, en las mismas rutas | < 0.05 por ruta |
| A8 | Capturas | PNG por ruta y ancho en `artifacts/visual/<fecha>/` | 22 archivos |
| A9 | Sin `stitch/` | `ls apps/web/src/stitch` falla; `grep -r "Stitch" apps/web/src` | 0 coincidencias |
| A10 | Sin MD3 | `grep -rE "(bg\|text\|border)-(on-\|surface\|[a-z-]*container)" apps/web/src` | 0 coincidencias |
| A11 | Bundle | `npm run build`: CSS no crece; JS inicial (gzip) | ≤ valor anterior (anotar en §7) |
| A12 | Paywall en el servidor | test de API: sin sesión, `GET /uploads/<pdf-de-pago>?stream=1` → 403; comprador `PAID` → 200/206; autor → 200 | 3 casos en verde |
| A13 | Vista previa | test de API: `/documents/:id/preview` devuelve un PDF de ≤ 2 páginas | `numPages ≤ 2` |
| A14 | Sin `fileUrl` filtrado | test de API: `GET /documents/:id` sin acceso no incluye `fileUrl` | campo ausente |
| A15 | pdf.js endurecido | `grep isEvalSupported apps/web/src/components/viewer/PdfPages.tsx` | `isEvalSupported: false` presente |

## 6. Checklist de ejecución
- [x] Tarea 1: Quitar `useState` de `CareerVisual.tsx`; correr typecheck, lint y test y corregir cualquier residuo del último lote (A1–A3).
- [x] Tarea 2: Quitar el `export` de `StorageConfig` en `apps/api/src/lib/storage.ts` (A1, A3).
- [x] Tarea 3: Eliminar el worktree temporal `scratchpad/base` (A5).
- [x] Tarea 4: Crear `scripts/visual-regression.mjs` (Playwright, chromium-1228) y medir A6–A8. Arrancar Vite limpio; en OneDrive, editar con Edit (no `sed`) para que el watcher recoja los cambios. *20/20 combinaciones (sin `/checkout/:id`: la BD Neon no tiene aplicada la migración `20260924090000_order_pay_proof_url` y `GET /orders/mine` da 500 `P2022`). La primera medición destapó 3 fallos, corregidos: el buscador del header desbordaba 9 px a 375 (`min-w-0`), la rejilla de `/publicar` 54 px (`grid-cols-1` + `min-w-0`), y `LoginRequired` pintaba "Inicia sesión" mientras se rehidrataba la sesión (CLS 0.31 en `/panel` y `/publicar`; ahora reserva la altura). En `/bazar`, la tarjeta de carrera aparecía tarde (CLS 0.066): ahora está siempre, con "Todas las carreras" por defecto.*
- [x] Tarea 5: Mover `stitch/*Stitch.tsx` a `pages/` con los nombres de §4; actualizar los imports y las menciones en los docs (A9, A1–A3). *Solo `MarketplaceStitch` estaba versionado (`git mv`); los otros 4 no estaban en git y se movieron con `mv`.*
- [x] Tarea 6: Sustituir las clases MD3 de `App.tsx` y podar `tailwind.config.js` (A10, A11, sin diferencias visuales en A8). *A8 queda por medir con T4; solo se borraron tokens con 0 usos, así que el CSS generado para las clases en uso no cambia.*
- [x] Tarea 7 *(aprobada 2026-09-23)*: Protección en el servidor del PDF de pago + `/documents/:id/preview` + `isEvalSupported: false`, documentado en `openapi.yaml` (A4, A12–A15). *A15 no aplica: pdf.js 6.3 eliminó la opción `isEvalSupported` (0 coincidencias en `pdfjs-dist/build`) y ya no evalúa código; queda anotado en `PdfPages.tsx`. Fuera de §3 hubo que tocar las descargas (`<a href>` no envía `Authorization` → `DownloadButton` con blob) y las miniaturas de pago del catálogo (`DocumentCard` → vista previa).*
- [x] Tarea 8: Tests unitarios de `safeReturnPath` y de `useExploreParams` (pendiente de la spec 14, T8). *`lib/authRedirect.test.ts` (6) y `lib/useExploreParams.test.ts` (5); sin jsdom, el hook se prueba con un mini render de `useState`/`useRef`/`useEffect` mockeados.*
- [x] Tarea 9: Registrar los resultados en §7 y marcar las specs 13 (T8) y 14 (T8). *En la 14, el E2E del retorno OAuth queda sin hacer (anotado).*

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-23 | A1 | ✅ | `npm run typecheck` (api, web, shared) exit 0 |
| 2026-09-23 | A2 | ✅ | `npm run lint` (`--max-warnings=0`) exit 0 |
| 2026-09-23 | A3 | ✅ | `npm test`: 71/71 (21 + 21 + 29) |
| 2026-09-23 | A5 | ✅ | `git worktree list` → 1 línea |
| 2026-09-23 | A10 | ✅ | grep MD3 en `apps/web/src` → 0 (`App.tsx` → `bg-zinc-50 text-zinc-900`); falta podar `tailwind.config.js` (T6) |
| 2026-09-23 | A10 (T6) | ✅ | `tailwind.config.js`: quitados 54 colores MD3 (incl. `primary-container`), 13 tokens de `spacing` y `maxWidth.container-max`, todos con 0 usos; quedan `primary`, `primary-soft`, `primary-ink` y `space-xs`/`space-md` (usados en `CareerVisual.tsx`). grep MD3 en `apps`, `packages` y `scripts` → 0 |
| 2026-09-23 | A1–A3 (T6) | ✅ | typecheck exit 0; lint exit 0; test 71/71 (21 + 21 + 29) |
| 2026-09-23 | A11 | ⚠️ | `vite build`: CSS 52.60 kB (9.50 kB gzip); JS inicial `index-*.js` 300.48 kB (95.07 kB gzip). No hay una medición previa con la que comparar; queda como referencia |
| 2026-09-23 | A9 (T5) | ✅ | `ls apps/web/src/stitch` falla; `grep -r "Stitch" apps/web/src` → 0. Páginas en `pages/{Explorar,Home,Bazar,Legal,Monetiza}.tsx`; imports en `AppRoutes.tsx` y `prefetch.ts` (se quitó `stitchMods`); comentarios en `routes.ts`, `tokens.css`, `subset-icons.mjs` y `start-todo.ps1`; docs: specs 02, 03, 07, 08, 12 y 14 y `PROJECT_CONTEXT.md` (`StitchFooter` → `AppFooter`). Las menciones históricas de `plan-desarrollo.md` (commits) se dejan |
| 2026-09-23 | A12 (T7) | ✅ | `documents/access.test.ts`: sin sesión → 403 `PAYWALL`; usuario sin pedido → 403; comprador `PAID` → 200 y 206 con `Range`; autor → 200 |
| 2026-09-23 | A13 (T7) | ✅ | `access.test.ts`: `/documents/:id/preview` de un PDF de 5 páginas → `application/pdf`, `Cache-Control: private`, 2 páginas (`pdf-lib` en el servidor, caché por `storedName` de 50 entradas) |
| 2026-09-23 | A14 (T7) | ✅ | `access.test.ts`: `GET /documents/:id` sin acceso → sin `fileUrl`, con `fileType: "pdf"`; comprador → con `fileUrl` |
| 2026-09-23 | A15 (T7) | N/A | pdf.js 6.3.289 ya no tiene `isEvalSupported`; se mantienen `enableXfa: false` y el pintado solo en `<canvas>` |
| 2026-09-23 | A4 (T7) | ✅ | `npm run docs:check` OK (20 rutas); `openapi.yaml`: `/documents/{id}/preview` nuevo; `/uploads/{name}` con `stream`, 206, 302 y 403 `PAYWALL`; `fileType` y `fileUrl` condicional en `/documents/{id}` |
| 2026-09-23 | A1–A3 (T5, T7) | ✅ | typecheck exit 0; lint exit 0; test 78/78 (28 + 21 + 29; +7 en la API) |
| 2026-09-23 | A11 (T5, T7) | ⚠️ | CSS 52.16 kB (9.45 kB gzip, −0.05); JS inicial 300.49 kB (95.12 kB gzip, +0.05 kB por `authHeaders` y `previewUrl` en `api.ts`) |
| 2026-09-24 | A6 (T4) | ✅ | `node scripts/visual-regression.mjs`: `scrollWidth − clientWidth = 0` en 20/20 (10 rutas × 1280 y 375), con sesión; sin sesión a 375 también 0 en 7 rutas. `/checkout/:id` omitida (ver T4) |
| 2026-09-24 | A7 (T4) | ✅ | CLS máximo 0.030 (`/legal` a 375); `/panel` y `/publicar` 0.312 → 0.002; `/bazar` 0.066 → 0.026 |
| 2026-09-24 | A8 (T4) | ⚠️ | 20 PNG + `results.json` en `artifacts/visual/2026-09-24/` (ignorado en git); faltan las 2 de `/checkout/:id` |
| 2026-09-24 | A1–A3 (T4, T8) | ✅ | typecheck exit 0; lint exit 0; test 89/89 (28 + 32 + 29; +11 en web) |
| 2026-09-24 | A11 (T4) | ⚠️ | CSS 52.22 kB (9.48 kB gzip, +0.03 por `min-h-[calc(100vh-4rem)]` y `grid-cols-1`); JS inicial 300.49 kB (95.12 kB gzip, sin cambio) |

## 8. Resumen final
- **Hecho:** repo en verde (typecheck, lint, 89 tests, `docs:check`); `stitch/` → `pages/`; tokens MD3 fuera; PDF de pago protegido en el servidor (403 `PAYWALL`, vista previa de 2 páginas, `fileUrl` solo con acceso); regresión visual medible con 20/20 en verde tras corregir 2 desbordes a 375 y 2 saltos de layout.
- **Pendiente fuera de esta spec:**
  1. Aplicar la migración `20260924090000_order_pay_proof_url` en Neon (`prisma migrate deploy`): sin ella, `GET /orders/mine` y `/checkout/:id` dan 500. Luego medir `/checkout/:id` (A6–A8 quedarían en 22/22).
  2. A11: el bundle creció +0.05 kB gzip de JS (T7) y +0.03 kB gzip de CSS (T4).
  3. `GET /documents` (listado) aún devuelve `fileUrl` de los documentos de pago; no da acceso (el servidor responde 403), pero expone la ruta.
  4. E2E del retorno OAuth (spec 14).
