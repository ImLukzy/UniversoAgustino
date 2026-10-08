# Especificación: 27 - Revisión de publicaciones por el equipo

## 1. Objetivo
**Problema:** todo se publica al instante. `POST /documents` (`apps/api/src/modules/documents/listing.ts:42-56`) crea con `PUBLISHED` (`schema.prisma:103`) y `POST /bazar` (`apps/api/src/modules/bazar/routes.ts:24-32`) con `AVAILABLE` (`schema.prisma:139`). Nadie revisa antes de que aparezca en el catálogo.
**Resultado esperado:** las publicaciones de usuarios sin historial entran "En revisión" y solo aparecen en el catálogo cuando un miembro del equipo las aprueba desde `/equipo`. El autor ve el estado y, si se rechaza, el motivo. Tras N aprobaciones el autor publica directo (el equipo puede retirar después).

## 2. Fuera de alcance
- Pagos, entregas, liquidaciones (specs 28–30).
- Retirar (`TAKEDOWN`) sigue como hoy (`manage.ts:80-89`).
- Reescribir estados de stock (`BazarStatus`) o de documento (`DocStatus`): la revisión va en un campo aparte.

**Decisiones de producto que requieren aprobación antes de ejecutar:** umbral `MODERATION_TRUST_AFTER` (por defecto **0** = todo pasa por el equipo, decisión del humano 2026-10-08; `0` = revisar todo siempre, ver §4). El humano puede cambiarlo sin código.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | enum `ReviewStatus { PENDING APPROVED REJECTED }`; en `Document` y `BazarItem`: `reviewStatus ReviewStatus @default(APPROVED)`, `reviewNote String?`, `reviewedAt DateTime?`, `reviewedById String?`; índice `[reviewStatus, createdAt]`; `NotificationType` + `REVIEW_APPROVED REVIEW_REJECTED STAFF_ADDED STAFF_REMOVED` |
| `apps/api/prisma/migrations/<fecha>_revision_publicaciones/` | crear | aditiva; filas existentes quedan `APPROVED` |
| `apps/api/src/env.ts` | modificar | `MODERATION_TRUST_AFTER` (int ≥ 0, por defecto 0) |
| `apps/api/src/lib/moderation.ts` | crear | `initialReview(authorId)` → cuenta aprobadas del autor (docs + bazar) y decide `PENDING`/`APPROVED` |
| `apps/api/src/modules/documents/listing.ts:18,42-56,67-85` | modificar | listado filtra `reviewStatus: APPROVED`; crear usa `initialReview`; detalle no aprobado → 404 salvo dueño o equipo |
| `apps/api/src/modules/documents/manage.ts:34-47` | modificar | editar algo `REJECTED` lo devuelve a `PENDING` |
| `apps/api/src/modules/bazar/routes.ts:14,24-32,43-51,57-70` | modificar | igual que documentos |
| `apps/api/src/modules/orders/documentGuard.ts:10`, `orders/create.ts:47` | modificar | comprar exige además `APPROVED` |
| `apps/api/src/modules/staff/reviews.ts` | crear | `GET /staff/reviews?type=document|bazar`, `POST /staff/reviews/:type/:id/approve`, `POST /staff/reviews/:type/:id/reject {reason}` |
| `apps/api/src/modules/staff/reviews.test.ts` | crear | |
| `apps/api/src/lib/notify.ts`, `apps/api/src/modules/staff/routes.ts` | modificar | tipos nuevos; avisar alta/baja de equipo (pendiente de spec 26) |
| `apps/api/docs/openapi.yaml` | modificar | rutas nuevas + campo `reviewStatus` |
| `packages/shared/src/catalog.ts` | modificar | `ReviewStatus`, `RejectReviewSchema { reason: 10–300 chars }` |
| `apps/api/src/modules/documents/access.ts` | modificar | `moderator` ve el PDF completo como `admin` |
| `apps/api/src/modules/documents/preview.ts` | modificar | vista previa de algo no aprobado → 404 a terceros (dueño/equipo sí), misma guarda que el detalle |
| `apps/api/src/modules/orders/itemOwner.ts` | modificar | traer `reviewStatus` para las guardas de compra |
| `apps/web/src/lib/apiTypes.ts` | modificar | `reviewStatus`/`reviewNote` en tipos de documento y bazar |
| `scripts/docs-check.mjs` | modificar | registrar `/staff/reviews` |
| `apps/api/src/modules/documents/access.test.ts`, `apps/api/src/modules/staff/staff.test.ts` | modificar | fixtures con `reviewStatus` y mock de `notify`; sin debilitar aserciones |
| `apps/web/src/components/equipo/PublicacionesTab.tsx` (+ subcomponentes) | crear | cola con vista previa, Aprobar / Rechazar con motivo |
| `apps/web/src/pages/Equipo.tsx` | modificar | pestaña "Publicaciones" con contador |
| `apps/web/src/components/publicaciones/ListingRow.tsx:24-26`, `apps/web/src/pages/Perfil.tsx:62` | modificar | chips "En revisión" / "Rechazada: <motivo>" |

## 4. Diseño y lógica
- **Al crear:** `initialReview`: si `MODERATION_TRUST_AFTER == 0` → siempre `PENDING`; si el autor tiene menos de N publicaciones `APPROVED` → `PENDING`; si no → `APPROVED`. Equipo (`moderator|admin`) → `APPROVED`.
- **Al editar:** `REJECTED` → `PENDING` (reenvío). Editar algo `APPROVED` no lo saca del catálogo.
- **Aprobar/Rechazar:** solo `moderator|admin`; solo desde `PENDING` (si no, `409 BAD_STATE`). Rellena `reviewedAt`, `reviewedById`, `reviewNote` (rechazo). `AuditLog` (`review.approve|review.reject`) + `notify` al autor con enlace a sus publicaciones.
- **Cola:** orden por antigüedad (FIFO), máximo 50 por página, incluye autor (nombre, correo, cuántas aprobadas tiene), título, tipo, precio y enlace a la vista previa existente (el equipo puede ver el PDF completo como hoy `access.ts:23` permite al admin: ampliar a `moderator`).
- **Público:** listados y búsqueda solo `APPROVED`; detalle de algo no aprobado → 404 para terceros.
- **Migración:** primero en BD de desarrollo `Unsa`; producción solo con OK humano, **antes** del push.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 |
| A2 | Lint | `npm run lint` | 0 / 0 |
| A3 | Tests | `npm test` | verdes; `reviews.test.ts`: autor nuevo → PENDING; con N aprobadas → APPROVED; umbral 0 → PENDING siempre; listado público oculta PENDING/REJECTED; detalle 404 a terceros y 200 a dueño/equipo; comprar PENDING → 409; student no aprueba (403); aprobar/rechazar fuera de PENDING → 409; editar REJECTED → PENDING; rechazo sin motivo → 400 |
| A4 | Contrato | `npm run docs:check` | verde |
| A5 | Tamaño | ≤ 150 líneas por archivo tocado (exentos: `schema.prisma`, `openapi.yaml`) | ≤ 150 |
| A7 | Scroll | `/equipo` pestaña Publicaciones a 375 px | 0 px |
| A11 | E2E | god: usuario nuevo publica → no sale en `/explorar`; moderador aprueba en `/equipo` → sale; otro rechazado muestra motivo al autor | pasa |

## 6. Checklist de ejecución
- [x] Esquema + migración aditiva (aplicada en dev por god).
- [x] `initialReview` + filtros públicos + guardas de compra.
- [x] Endpoints `/staff/reviews` + tests.
- [x] Web: pestaña Publicaciones + chips de estado.
- [x] Gates y §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1–A4 | Pasa | God: typecheck 0 errores, lint y docs:check OK; npm test API 105, web 73, shared 42. |
| 2026-10-08 | A7 | Pasa | God, cola de revisión a 375 px: 0 px de exceso. |
| 2026-10-08 | A11 | Pasa | God contra BD dev: qa-est crea 2 artículos → nacen PENDING, no salen en `GET /bazar`, detalle a terceros 404; qa-mod aprueba uno en `/equipo` → aparece en catálogo; rechaza otro con motivo → no aparece; el autor ve "Rechazada" + motivo en `/publicaciones` y recibe avisos REVIEW_APPROVED y REVIEW_REJECTED. |
| 2026-10-08 | Migración dev | Pasa (god) | SQL nuevo `20261008201300_revision_publicaciones` aplicado por god en Unsa; mensaje 2026-10-08T20-14-57-523Z-d44077. Filas existentes conservan APPROVED. Michael no aplicó migraciones. |
| 2026-10-08 | A1 | Pasa | `npm run typecheck` final local: exit 0. God regeneró cliente Prisma y shared fuera del sandbox; generación local no actualizaba el cliente. |
| 2026-10-08 | A2 | Pasa | `npm run lint -- --ignore-pattern 'hive/**'` final: exit 0, sin warnings. |
| 2026-10-08 | A3 | Pasa en pruebas afectadas; suite completa final solicitada | Reviews 31/31; API final en sandbox excluyendo solo `documents/access.test.ts` (necesita abrir puerto): 95/95. God verificó previamente suite completa API 104/104, web 73/73, shared 42/42 (219), mensaje 2026-10-08T20-21-08-070Z-4df8b7. Después se añadió bloqueo de reserva directa y test 31, y se agruparon counts de la cola; suite completa final solicitada a god. Sin BD ni servicios reales en tests nuevos. |
| 2026-10-08 | A4 | Pasa | `npm run docs:check`: exit 0, 29 rutas cubiertas; archivo reviews.ts y prefijo registrados. OpenAPI sin claves duplicadas, cola/aprobar/rechazar comprobados con bearerAuth y respuestas. |
| 2026-10-08 | A5 | Pasa | Todo código nuevo/tocado ≤150 líneas (access.test.ts 150; reviews.test.ts 132). Schema y OpenAPI exentos por god. Migración nueva 21 líneas. |
| 2026-10-08 | A7, A11 | Pendiente (god) | Medición 375 px y E2E a cargo de god; no se marca verificado sin navegador. |
| 2026-10-08 | Build web | Pasa | `npm run build -w apps/web`: exit 0, 751 módulos; avisos existentes de importaciones Explorar/Forgot. Shared build previo exit 0; `git diff --check`: exit 0. |
| 2026-10-08 | Decisión de producto | Aplicada | Por orden del humano, MODERATION_TRUST_AFTER predeterminado 0: todo usuario va a revisión; equipo publica directo; N configurable y probado. Mensaje 2026-10-08T20-17-39-549Z-079eca. |
| 2026-10-08 | Auditoría | Pasa | Kelly APTO sin hallazgos. Snapshot aislado de la 27 (sin la 35): typecheck 0, tests API 105, web 73, shared 42. |
