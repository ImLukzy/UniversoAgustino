# Baseline medible — 2026-09-21 (commit `2e5786a` + trabajo F1-01/F1-08)

Objetivos comparativos del roadmap se verifican contra esta tabla.
Método de medición indicado por fila. Lo no medible aquí queda marcado
explícitamente como pendiente (sin estimaciones inventadas).

## Rendimiento
| Métrica | Valor | Método |
|---|---|---|
| Queries por request `GET /orders/sales` (10 ventas) | **4** (antes: 13) | `verify2a.mjs` con Prisma query-events |
| Queries `GET /orders/mine` + Panel | 1 + 0 por fila | Código (sin `OrderTitle`) + E2E `itemTitle` presente |
| Chunk inicial gzip aprox | index 222 kB + vendor-react 160 kB + vendor-query 41 kB | `apps/web/dist/assets` (build F4-04) |
| pdf.js fuera del inicial | Sí (`vendor-pdf` 471 kB aparte) | visual del dist |
| Chunks por ruta | 2.7–41.5 kB c/u | dist (lazy F4-04) |
| p50/p95 endpoints | **Pendiente** | autocannon pendiente de instalar |
| Lighthouse Performance/Accessibility | **Pendiente** | Sin navegador headless en esta máquina |
| Violaciones axe-core | **Pendiente** | `npx playwright` pendiente |

## Código
| Métrica | Valor | Método |
|---|---|---|
| Página más grande | `Publicaciones.tsx` 664 líneas | `scripts/check-file-size.mjs` |
| Top 3 | Publicar 596, Panel 464 | mismo script |
| Ocurrencias `any` | **3** (tope `.any-budget`) | `scripts/any-budget.mjs` |
| `tsc --noEmit` api/web/shared | Verde | CI `typecheck` |
| `eslint .` | 0 errores, 16 warnings | CI `lint` |
| Tests | **38** (api 15, web 9, shared 14) | `npm run test --workspaces` |
| Rutas documentadas | 39/39 | `scripts/docs-check.mjs` |
| Respuestas 500/día | **Sin instrumentar** | Requiere agregador de logs en producción |

## Datos (Neon dev, 2026-09-21)
| Métrica | Valor |
|---|---|
| Migraciones aplicadas | 9/9 al día |
| Pedidos vivos huérfanos (pre-F1-05) | 0 tras limpieza documentada (6 sintéticos eliminados) |
| TTL reservas | 30 min (`RESERVATION_TTL_MINUTES`) |
