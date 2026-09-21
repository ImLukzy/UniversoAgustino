# Checklist pre-despliegue — Universo Agustino (Sprint 4, F4-06)

Bloqueante: el release no sale sin los 26 ítems verificados.

## Configuración y secretos
- [ ] `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` rotados, distintos, ≥ 32 bytes (ver `docs/runbook-rotacion.md`).
- [ ] Ningún placeholder `cambia-este-*` en el entorno (`bash scripts/check-secrets.sh` en verde).
- [ ] gitleaks sin hallazgos; `.env` fuera del control de versiones (`git ls-files | grep '^\.env$'` vacío).
- [ ] `WEB_ORIGIN`, `VITE_API_URL` y `DATABASE_URL`/`DIRECT_DATABASE_URL` apuntando a producción.
- [ ] `RESERVATION_TTL_MINUTES` acordado con negocio (actual: 30) y documentado.
- [ ] `ENABLE_JOBS=true` en exactamente una instancia.
- [ ] `CSP_ENFORCE` en `false` (report-only) hasta completar 48 h sin violaciones en consola.

## Base de datos
- [ ] Migraciones aplicadas en staging con datos representativos (`npx prisma migrate status` al día; actual: 8 migraciones).
- [ ] Backfills verificados: `sellerId`/`itemTitle`/`itemPriceCents`/`feeBps` sin nulos; PENDING antiguos en `CANCELLED/TTL_BACKFILL`.
- [ ] Consulta de duplicados vivos por ítem devuelve 0 filas antes de crear `order_active_item_unique`.
- [ ] Índices creados (`order_active_item_unique` solo bazar, `order_status_expires_idx`, `order_seller_created_idx`).
- [ ] Versión de PostgreSQL registrada (`SELECT version()`).
- [ ] Backup tomado inmediatamente antes de migrar + restauración probada.
- [ ] Plan de rollback escrito por cada migración.

## Seguridad
- [ ] Suite de archivos maliciosos rechazada (exe/elf/html/svg/php/zip/jpg truncado/pdf falso/epub falso/0 bytes → 415/400).
- [ ] Cabeceras verificadas: `X-Content-Type-Options: nosniff` en `/uploads/*`, HSTS, `frame-ancestors: none`, `Permissions-Policy`.
- [ ] Rate limits en login (50/15min), global (300/min) y mismos de forgot/uploads al implementarlos.
- [ ] CORS con origen explícito, nunca `*`, y `credentials: true`.
- [ ] Sin access token en `localStorage` (solo memoria + cookie httpOnly).

## Calidad
- [ ] `tsc --noEmit` y `vite build` en verde (api + web + shared).
- [ ] E2E de custodia + Sprint 1A (`node scripts/e2e-sprint1a.mjs base`) en verde contra staging.
- [ ] Prueba de concurrencia de reservas (50 simultáneas → 1 éxito) — ver criterio F1-05.
- [ ] `node scripts/docs-check.mjs` en verde y `/docs` accesible.

## Operación
- [ ] `GET /health` y `GET /ready` responden detrás del balanceador.
- [ ] Logs con `requestId` correlacionable (ver `middleware/errors.ts`).
- [ ] Alertas: tasa 5xx > 1 %, fallo del job de expiración, `refresh_reuse_detected` (al implementar F1-02 completo).
