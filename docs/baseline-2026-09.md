# Baseline medible — 2026-09-22 (commit `982ab59`)

Objetivos comparativos del roadmap se verifican contra esta tabla.
Método de medición indicado por fila. Lo no medible aquí queda marcado
explícitamente como pendiente (sin estimaciones inventadas).
Reemplaza a la versión del 2026-09-21 (commit `2e5786a`).

## Rendimiento
| Métrica | Valor | Método |
|---|---|---|
| Queries por request `GET /orders/sales` (10 ventas) | **Pendiente** (valor previo: **4**, antes 13) | Requiere API+DB en marcha; `scripts/verify2a.mjs` no existe en `scripts/`; prohibido levantar servidores / escribir DB |
| Queries `GET /orders/mine` + Panel | **Pendiente** (valor previo: 1 + 0 por fila) | Requiere E2E con DB (prohibido: E2E/fixtures escriben DB, puertos 4000/5173 ocupados) |
| Chunk inicial gzip aprox | index 58.72 kB + vendor-react 53.53 kB + vendor-query 12.54 kB + css 9.72 kB (~134.5 kB) | `apps/web/dist/assets` medido 2026-09-22, gzip real (`zlib.gzipSync`), HEAD `982ab59` |
| pdf.js fuera del inicial | Sí (`vendor-pdf` 143.90 kB gzip aparte + `pdf.worker.min` 376.09 kB gzip) | visual del dist (`vendor-pdf-B0yK2GjR.js`, `pdf.worker.min-Dswkl-cV.mjs`) |
| Chunks por ruta | 1.3–7.3 kB gzip c/u (ej. Admin 1.29 kB … Publicaciones 7.27 kB) | dist gzip real, mismo método que chunk inicial (baseline previo no aclaraba gzip: 2.7–41.5 kB) |
| p50/p95 endpoints | Ver `docs/medicion-p95.md` (F0-c 2026-09-22, N=25): `POST /orders` p50 994ms/p95 1189ms; `POST /:id/pay` p50 771ms/p95 856ms; `GET /sales` p50 579ms/p95 1035ms; `GET /mine` p50 193ms/p95 292ms | Tomado de `docs/medicion-p95.md` — no re-medido aquí (requiere API :4000 contra Neon dev, prohibido) |
| Lighthouse Performance/Accessibility | Ver `docs/auditoria-lighthouse.md` (F0-b 2026-09-22): Detalle 83/100, Checkout 99/100, Panel 94/100, Publicar 95/100 | Tomado de `docs/auditoria-lighthouse.md` — no re-medido aquí (requiere build+preview+Chrome) |
| Violaciones axe-core | **0** en Detalle, Checkout, Panel, Publicar (tags wcag2a, wcag2aa, wcag21a, wcag21aa) | Tomado de `docs/auditoria-axe.md` (F0-a 2026-09-22) — no re-medido aquí (requiere Playwright+fixtures que escriben DB, prohibido) |

## Código
| Métrica | Valor | Método |
|---|---|---|
| Página más grande | `Publicaciones.tsx` 681 líneas | `node scripts/check-file-size.mjs` (2026-09-22) |
| Top 3 | Publicaciones 681, Publicar 596, Panel 464 | mismo script |
| Ocurrencias `any` | **0** (tope `.any-budget` = 0) | `node scripts/any-budget.mjs --check` → `any-budget OK: 0 <= 0` |
| `tsc --noEmit` api/web/shared | Verde (los 3 exit 0) | `npx tsc --noEmit -p apps/api|web|shared/tsconfig.json` (2026-09-22) |
| `eslint .` | 0 errores, 13 warnings | `npx eslint .` (2026-09-22) |
| Tests | **51** (api 18, web 9, shared 24) | `npm run test --workspaces --if-present` (vitest run, 2026-09-22) |
| Rutas documentadas | 38/38 | `node scripts/docs-check.mjs` → `docs:check OK (38 rutas cubiertas)` |
| Respuestas 500/día | **Sin instrumentar** | Requiere agregador de logs en producción |

## Datos (Neon dev)
| Métrica | Valor |
|---|---|
| Migraciones aplicadas | **Pendiente** (filesystem: 10 dirs en `apps/api/prisma/migrations`; valor previo 9/9 al 2026-09-21) — requiere `prisma migrate status`/lectura DB, no ejecutado (prohibido migraciones/escritura DB) |
| Pedidos vivos huérfanos | **Pendiente** (valor previo: 0 tras limpieza de 6 sintéticos al 2026-09-21) — requiere consulta DB, no ejecutada (solo-lectura sin tocar DB) |
| TTL reservas | 30 min (`RESERVATION_TTL_MINUTES`) — Código `apps/api/src/env.ts:30` + `modules/orders/reservation.ts:6-7`, test `reservation.test.ts:12` |
