# Especificación: 46 - Moderación de publicaciones y reporte del vendedor

> Depende de la spec 45 (`pausedAt`, ya integrada): los filtros combinan pausa y retiro.

## 1. Objetivo
**Problema:** si un vendedor no se presenta o no lleva el producto, el comprador no tiene una forma directa de reportarlo: `ReportsCenter.tsx` pide escribir el ID a mano y `PaymentClaim.tsx` solo aparece en ciertos estados. En el panel, "Publicaciones" (`components/equipo/PublicacionesTab.tsx`) solo muestra la cola de revisión pendiente: el trabajador no ve todas las publicaciones ni puede retirarlas. "Denuncias" (`DenunciasTab.tsx:12-69`) no muestra denunciante, dueño ni fecha, y `POST /reports/:id/action` (`apps/api/src/modules/extra/routes.ts:45-58`) acepta cualquier texto como decisión y solo retira apuntes (`document.status=TAKEDOWN`), nunca artículos del bazar. El `TAKEDOWN` actual no guarda motivo, no avisa al dueño y no se puede restaurar.
**Resultado esperado:** el comprador reporta al vendedor desde su pedido con un motivo ("no se presentó", "no llevó el producto"…). El reporte llega a "Denuncias" con todo el contexto. El trabajador ve todas las publicaciones en una sección nueva del panel, retira cualquiera con motivo (el dueño recibe aviso), y sanciona al vendedor (advertencia o suspensión). El técnico puede restaurar lo retirado.

## 2. Fuera de alcance
- Eliminar definitivamente publicaciones ajenas (decisión: se **retira**, no se borra).
- Cancelar o reembolsar automáticamente pedidos en curso al retirar (decisión: siguen su flujo; reclamo/reembolso de spec 38/40).
- Cambiar el flujo de ausencias en citas (`cases/appointments.ts`, `sanctions/strikes.ts`): sigue igual.
- Cambiar `canTransition`, `computePrice`, payouts o cobros.
- La pausa del dueño (spec 45) — solo se combina con sus filtros.

**Decisiones de producto (aprobadas por el humano 2026-10-12):**
- D1. El trabajador **retira** (oculta, sin compras nuevas, con motivo, aviso al dueño, restaurable por el técnico). Los compradores previos conservan su acceso.
- D2. Pedidos en curso de una publicación retirada **siguen su flujo**; no se cancelan solos.
- D3. Sanciones: el **trabajador** puede aplicar WARNING y **SUSPENSION (1–30 días)**; **BAN** sigue siendo solo del técnico. Levantar sanciones y perdonar faltas sigue siendo solo del técnico.
- D4. Restaurar una publicación retirada: solo el técnico (admin).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | `removedAt DateTime?`, `removedReason String?`, `removedById String?` en `Document` y `BazarItem`; `category String?` en `Report`; `NotificationType` + `PUBLICATION_REMOVED`, `PUBLICATION_RESTORED` |
| `apps/api/prisma/migrations/<fecha>_moderation_listings/migration.sql` | crear | `ADD COLUMN` nullable + `ALTER TYPE "NotificationType" ADD VALUE` ×2. Sin backfill |
| `apps/api/src/lib/moderationListing.ts` + `.test.ts` | crear | retirar / restaurar común (doc y bazar): permisos, motivo, auditLog, notify |
| `apps/api/src/modules/staff/listings.ts` + `.test.ts` | crear | `GET /staff/listings`, `POST /staff/listings/:type/:id/remove`, `POST /staff/listings/:type/:id/restore` |
| `apps/api/src/modules/staff/routes.ts` | modificar | montar `listings` |
| `apps/api/src/modules/documents/listing.ts`, `apps/api/src/modules/bazar/routes.ts` | modificar | catálogo `removedAt: null` (además de `pausedAt: null`); detalle devuelve `removed: boolean` |
| `apps/api/src/modules/orders/itemOwner.ts`, `apps/api/src/modules/orders/create.ts` | modificar | 409 `LISTING_REMOVED` "Esta publicación fue retirada por moderación" |
| `apps/api/src/modules/documents/manage.ts` | modificar | `POST /documents/:id/takedown` pasa a usar `moderationListing` (exige motivo, notifica) |
| `apps/api/src/modules/extra/routes.ts` | modificar | `GET /reports` paginado y enriquecido; `POST /reports/:id/action` validado con zod (`ACTIONED` / `DISMISSED`) |
| `packages/shared/src/extra.ts` | modificar | `CreateReportSchema.category` opcional (`NO_SHOW`, `NO_PRODUCT`, `NOT_AS_DESCRIBED`, `OTHER`); `ReportActionSchema`; `RemoveListingSchema` (`reason` 10–500) |
| `packages/shared/src/sanctions.ts` | modificar | `canApplySanction`: moderator → WARNING y SUSPENSION; BAN solo admin |
| `packages/shared/src/notifications.ts`, `apps/api/src/lib/criticalMail.ts` | modificar | tipos nuevos; `PUBLICATION_REMOVED` por correo crítico |
| `apps/api/docs/openapi.yaml` | modificar | rutas nuevas y cambios de contrato |
| `apps/web/src/components/teamPanel/navigation.ts`, `PanelSection.tsx` | modificar | sección nueva `catalogo` ("Todas las publicaciones", grupo Moderación) |
| `apps/web/src/components/equipo/CatalogoTab.tsx` (+ subcomponentes si pasa de 150 líneas) | crear | lista paginada con filtros (tipo, estado activa/pausada/retirada, búsqueda), dueño, nº de reportes, acciones Retirar / Restaurar (admin) |
| `apps/web/src/components/equipo/DenunciasTab.tsx` | modificar | muestra denunciante, dueño, publicación, categoría, fecha, paginación; acciones Retirar publicación, Sancionar vendedor, Desestimar |
| `apps/web/src/components/equipo/SanctionForm.tsx` | modificar | trabajador elige WARNING o SUSPENSION (días); BAN solo admin |
| `apps/web/src/components/orders/BuyerOrderRow.tsx` (+ `ReportSellerForm.tsx` nuevo) | modificar / crear | botón "Reportar al vendedor" con motivo (categoría + detalle ≥ 10) para pedidos no `PENDING` |
| `apps/web/src/components/detalle/BuyPanel.tsx` | modificar | aviso "Retirada por moderación" sin comprar si `removed` |
| Tests web en `apps/web/src/**` | crear | navegación, formulario de reporte, permisos de SanctionForm |

## 4. Diseño y lógica
- **Estados combinados:** una publicación es *activa* si `pausedAt = null` y `removedAt = null` (y además `PUBLISHED`/`AVAILABLE` + `APPROVED` como hoy). Retirada manda sobre pausada. Un apunte con `status = TAKEDOWN` legado se trata como retirado.
- **Retirar** `POST /staff/listings/:type/:id/remove` (`type` = `document|bazar`; moderator|admin; body `{ reason }` 10–500): fija `removedAt`, `removedReason`, `removedById`; idempotente; auditLog `listing.remove`; `notify` al dueño `PUBLICATION_REMOVED` con el motivo y link `/publicaciones`. No toca pedidos en curso (D2). Si el dueño es staff, igual se permite (es contenido, no persona).
- **Restaurar** `POST /staff/listings/:type/:id/restore` (solo admin): limpia los tres campos; si era `TAKEDOWN` legado vuelve a `PUBLISHED`; auditLog `listing.restore`; notify `PUBLICATION_RESTORED`.
- **Listado staff** `GET /staff/listings?type&state&q&page&pageSize`: `{ data, page, pageSize, total }`; cada fila con id, tipo, título, precio, estado (activa/pausada/retirada/pendiente de revisión), dueño (id, nombre, correo), nº de reportes abiertos, fecha. Paginación con `ListQuerySchema` (máx. 50).
- **Reportes:** `POST /reports` acepta `category` opcional. `GET /reports?status&page` devuelve reporter (nombre), dueño resuelto (doc → `authorId`, bazar → `sellerId`, order → `sellerId`, user → el propio), título de la publicación y `createdAt`. `POST /reports/:id/action` valida `decision ∈ {ACTIONED, DISMISSED}`; con `ACTIONED` y body `{ reason }` retira la publicación asociada (documento, bazar, o la del pedido); resuelto → `notify` al denunciante `REPORT_RESOLVED`.
- **Botón del comprador:** en cada pedido no `PENDING`, "Reportar al vendedor" abre un formulario: categoría (No se presentó / No llevó el producto / No es lo anunciado / Otro) + detalle. Envía `POST /reports { targetType: "order", targetId, category, reason }` (reusa la congelación de payout existente en `payouts/claims.ts`).
- **Sanciones (D3):** `canApplySanction(role, kind)`: admin todo; moderator WARNING y SUSPENSION; BAN → 403 "Solo el Técnico aplica bloqueos". Desde una denuncia, "Sancionar vendedor" abre `SanctionForm` del usuario dueño.
- **Detalle y pedidos:** detalle de una retirada → `removed: true`; la web muestra aviso y oculta comprar. `POST /orders` → 409 `LISTING_REMOVED`. `hasFullAccess` no cambia.
- **UI:** clases `.card .btn-* .chip .tag .input`; acentos `primary*`; error `#b91c1c`; motion `SPRING`; CLS 0 con `PanelLoading`; componentes < 150 líneas.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | en verde; nuevos: retirar (moderator ok, estudiante 403, motivo corto 400, idempotente, notifica) · restaurar (admin ok, moderator 403) · catálogo excluye retiradas · `POST /orders` 409 `LISTING_REMOVED` · `GET /reports` enriquecido · `action` rechaza decisión inválida · moderator SUSPENSION ok y BAN 403 |
| A4 | Contrato API | `npm run docs:check` | en verde |
| A5 | Tamaño | ningún `.ts/.tsx` tocado > 150 líneas | ≤ 150 |
| A7 | Scroll horizontal | `/panel/catalogo`, `/panel/denuncias`, `/pedidos` a 375 px | 0 px |
| A10 | Accesibilidad | axe en esas rutas a 1280 y 375 px | 0 serias/críticas |
| A11 | Comportamiento | E2E: comprador reporta "No se presentó" desde `/pedidos` → aparece en `/panel/denuncias` con comprador, vendedor y publicación → trabajador retira con motivo → desaparece del catálogo, el dueño recibe notificación, `POST /orders` da 409 → trabajador suspende 7 días al vendedor → técnico restaura y vuelve al catálogo | pasa |
| A12 | Migración | `prisma migrate deploy` en BD dev sin errores | OK |

## 6. Checklist de ejecución
- [x] D1–D4 aprobadas por el humano (2026-10-12).
- [x] Tarea 0: integrar spec 45 en `ImLukzy/Claudio` (prerrequisito; publicada 2026-10-12, 34ed1ea).
- [x] Tarea 1 (API): schema + migración; `moderationListing`; `/staff/listings` (listar, retirar, restaurar); filtros catálogo/detalle/pedidos; takedown legado; tests; openapi.
- [x] Tarea 2 (API): reportes enriquecidos, `category`, acción validada que retira; `canApplySanction` (D3); notificaciones; tests; openapi.
- [x] Tarea 3 (web): sección "Todas las publicaciones" y aviso de retirada (Dwight, 81c043f + d9c6ae4); Denuncias con contexto y acciones y SanctionForm (Michael, 011cae2 + 30b2ff2); tests.
- [x] Tarea 4 (web): "Reportar al vendedor" en `/pedidos` (Michael, e7a88f5 + 30b2ff2); tests.
- [x] Tarea 5: verificar A1–A12 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-12 | Tarea 1 (API) | OK; suite completa verde. Migración manual y Prisma Client generado; no aplicada a BD según el alcance. Los criterios UI/E2E y la migración real quedan para tareas posteriores. | `npm run build -w packages/shared`; `npm run typecheck`; ESLint global; `npm run docs:check` (115 rutas); `JWT_ACCESS_SECRET=ci-only-fictitious-access-secret-32-chars-xx JWT_REFRESH_SECRET=ci-only-fictitious-refresh-secret-32-chars-x npm test` (API 614, web 156, shared 132); `node scripts/any-budget.mjs --check`; todos en verde. Verificación de tamaño de archivos TS API modificados: ≤150 líneas. |
| 2026-10-12 | Tarea 2 (API) | OK; reportes enriquecidos y acciones ACTIONED/DISMISSED implementados; sanciones D3 verificadas. Suite completa verde; quedan pendientes UI/E2E y validación de migración de la Tarea 1. | `npm run build -w packages/shared`; `npm run typecheck`; ESLint global; `npm run docs:check` (115 rutas); `node scripts/any-budget.mjs --check`; `node scripts/check-file-size.mjs`; `JWT_ACCESS_SECRET=ci-only-fictitious-access-secret-32-chars-xx JWT_REFRESH_SECRET=ci-only-fictitious-refresh-secret-32-chars-x npm test` (API 623, web 156, shared 132); todos en verde. Archivos TypeScript tocados: ≤150 líneas. |
| 2026-10-12 | Tarea 3 (web), primera mitad | Implementadas sección `catalogo`, filtros/paginación, retiro con motivo, restauración solo admin y aviso de retirada en detalle; Denuncias y `SanctionForm` pendientes. | `npm run build -w packages/shared`; `npm run typecheck -w apps/web`; `npx eslint apps/web/src --max-warnings=0`; `npm test -w apps/web` (161 tests, antes 156); `node scripts/subset-icons.mjs --check`; `node scripts/any-budget.mjs --check`; `node scripts/check-file-size.mjs`; todo en verde. |
| 2026-10-12 | Auditoría (Kelly) | OK en T1 (6d343ab), T2 (04a0ccd), web Dwight (81c043f), reportar vendedor (e7a88f5), denuncias/sanciones (011cae2). Hallazgos corregidos y re-auditados: confirmación previa a sancionar (IMPORTANTE, 30b2ff2), contador sin aria-live y búsqueda con retardo 300 ms (MENORES, 30b2ff2/d9c6ae4) | revisión de diffs + gates |
| 2026-10-12 | A12 migración | OK en BD dev (`ep-orange-mountain`); producción pendiente de OK humano | `prisma migrate deploy` |
| 2026-10-12 | A11 E2E (QA Pam) | OK: reporte NO_SHOW desde /pedidos (201) → denuncia con contexto en panel (estudiante 403) → retiro con motivo: fuera de catálogo y búsqueda, PUBLICATION_REMOVED al dueño, REPORT_RESOLVED al denunciante, POST /orders 409 LISTING_REMOVED, detalle "Retirada por moderación", repetir 409 → trabajador suspende 7 días tras confirmar (BAN 403, sin opción) → técnico restaura (PUBLICATION_RESTORED); comprador previo conserva fullAccess | Playwright + API local contra BD dev, commit ca6234a; datos restaurados y sanción levantada |
| 2026-10-12 | A7 / A10 | OK: 0 px de exceso a 375 px y 0 violaciones serias/críticas a 1280 y 375 px en /panel/catalogo, /panel/denuncias y /pedidos | axe-core + Playwright (Pam) |
| 2026-10-12 | Integración | OK: API 623, web 167, shared 132; typecheck, lint, docs:check, any-budget, check-file-size, subset-icons en verde | rama `ImLukzy/Claudio` (ca6234a) |
