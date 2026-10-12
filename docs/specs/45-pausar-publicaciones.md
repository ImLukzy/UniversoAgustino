# Especificación: 45 - Pausar y reactivar publicaciones

## 1. Objetivo
**Problema:** el dueño de un apunte o de un artículo del bazar solo puede editarlo o eliminarlo (`apps/api/src/modules/documents/manage.ts:51`, `apps/api/src/modules/bazar/routes.ts:79`, UI en `apps/web/src/components/publicaciones/useListingEditor.ts:34-35`). No existe forma de retirarlo temporalmente: `DocStatus` (`DRAFT|REVIEW|PUBLISHED|TAKEDOWN`) y `BazarStatus` (`AVAILABLE|RESERVED|SOLD|RENTED`) en `apps/api/prisma/schema.prisma:23-35` los controla el sistema/moderación, no el dueño. Para sacar algo un tiempo hay que borrarlo y volver a publicarlo (y pasar otra vez por revisión).
**Resultado esperado:** en "Mis publicaciones" (`/publicaciones`) el dueño pausa una publicación propia y la reactiva cuando quiera. Mientras está pausada no aparece en el catálogo ni en búsquedas y nadie puede iniciar un pedido nuevo; quien ya la compró conserva su acceso. Reactivar no la manda de nuevo a revisión.

## 2. Fuera de alcance
- Cambiar `DocStatus`, `BazarStatus`, `canTransition` ni el ciclo de pedidos.
- Moderación (`TAKEDOWN`, `reviewStatus`): pausar no la sustituye ni la evita; un moderador sigue pudiendo retirar una publicación pausada.
- Retiro físico de un artículo en custodia del equipo (casos/agenda de spec 39/RFC 0002): sigue su flujo actual.
- Pausar en lote, programar pausas o pausar desde el panel del equipo.
- Textos legales, de cobro o de comisión.

**Decisiones de producto (aprobadas por el humano 2026-10-12: D1 = página con aviso, D2 = bloquear con 409):**
- D1. **Detalle de una publicación pausada** para quien no es dueño ni equipo: la página carga y muestra "Pausada por su autor", sin botón de comprar (recomendado; no rompe enlaces compartidos ni guardados). Alternativa: 404.
- D2. **Pausar con pedidos en curso** (`PENDING`, `ACCEPTED`, `PAID`, `ESCROW`): se bloquea con 409, igual que eliminar (recomendado). Alternativa: permitir pausar y dejar terminar los pedidos abiertos.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | `pausedAt DateTime?` en `Document` y `BazarItem` |
| `apps/api/prisma/migrations/20261012000000_pause_listings/migration.sql` | crear | solo `ADD COLUMN "pausedAt"` en ambas tablas; nullable, sin backfill |
| `apps/api/src/lib/pause.ts` | crear | lógica común: permiso de dueño, chequeo de pedidos activos, set/clear `pausedAt`, `auditLog` |
| `apps/api/src/lib/pause.test.ts` | crear | tests unitarios de la lógica común |
| `apps/api/src/modules/documents/manage.ts` | modificar | `POST /documents/:id/pause` y `POST /documents/:id/resume` |
| `apps/api/src/modules/bazar/routes.ts` | modificar | `POST /bazar/:id/pause` y `POST /bazar/:id/resume` (si supera 150 líneas, registrar desde un archivo nuevo `apps/api/src/modules/bazar/pause.ts`) |
| `apps/api/src/modules/documents/listing.ts` | modificar | catálogo público filtra `pausedAt: null`; detalle devuelve `paused` |
| `apps/api/src/modules/orders/itemOwner.ts` | modificar | incluir `pausedAt` en el select |
| `apps/api/src/modules/orders/create.ts` | modificar | rechazar pedido si el ítem está pausado: 409 `LISTING_PAUSED` |
| `apps/api/docs/openapi.yaml` | modificar | 4 rutas nuevas, campo `pausedAt`/`paused`, código `LISTING_PAUSED` |
| `apps/web/src/components/publicaciones/useListingEditor.ts` | modificar | acciones `pause()` y `resume()` |
| `apps/web/src/components/publicaciones/EditorActions.tsx` | modificar | botón "Pausar" / "Reactivar" |
| `apps/web/src/components/publicaciones/ListingRow.tsx` | modificar | etiqueta `.tag` "Pausada" |
| `apps/web/src/components/detalle/BuyPanel.tsx` | modificar | en `/p/:type/:id`: aviso "Pausada por su autor" y sin botón de comprar si `paused` (D1) |

## 4. Diseño y lógica
- **Datos:** `pausedAt: DateTime?` (null = activa). Es ortogonal a `status` y `reviewStatus`: no se tocan al pausar ni al reactivar.
- **API:**
  - `POST /documents/:id/pause`, `POST /documents/:id/resume`, `POST /bazar/:id/pause`, `POST /bazar/:id/resume`. Requieren sesión.
  - Permiso: solo el dueño (`authorId` / `sellerId`). Admin y moderador **no** pausan (usan moderación). 403 `FORBIDDEN` si no es el dueño, 404 si no existe.
  - Pausar con pedidos en curso → 409 `CONFLICT_ACTIVE_ORDERS` (mismo shape que eliminar) según D2.
  - Idempotente: pausar algo ya pausado o reactivar algo activo devuelve 200 con el estado actual.
  - Respuesta `{ data: { id, pausedAt } }`. `auditLog` con `action: "document.pause" | "document.resume" | "bazar.pause" | "bazar.resume"`.
  - Catálogo `GET /documents` y `GET /bazar`: `where.pausedAt = null`. `GET /documents/mine` y `GET /bazar/mine` siguen devolviendo todo (incluye `pausedAt`).
  - Detalle (`GET /documents/:id`, `GET /bazar/:id`): añade `paused: boolean` (D1).
  - `POST /orders`: si `pausedAt` no es null → 409 `LISTING_PAUSED` "Esta publicación está pausada por su autor".
- **Accesos ya concedidos:** un comprador con pedido `ESCROW`/`RELEASED` o con `DocumentAccessGrant` activo sigue viendo y descargando el documento pausado (`hasFullAccess` no cambia).
- **Reactivar:** solo limpia `pausedAt`; no llama a `resubmitReview` ni cambia `reviewStatus`.
- **UI:** en `/publicaciones`, botón `.btn-secondary` "Pausar" / "Reactivar" junto a Eliminar, sin confirmación para reactivar y con confirmación breve para pausar. Fila pausada con `.tag` "Pausada". Errores con `apiError`. Acentos solo `primary*`; motion solo `SPRING`.
- **Invariantes:** comisión vía `computePrice()` sin cambios; pedidos solo vía `canTransition`.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | todos en verde; nuevos en `apps/api/src/lib/pause.test.ts`: dueño pausa/reactiva · no-dueño 403 · pedidos en curso 409 · idempotencia · reactivar no toca `reviewStatus` |
| A4 | Contrato API | `npm run docs:check` | en verde |
| A5 | Tamaño | ningún `.ts/.tsx` tocado > 150 líneas (`wc -l`) | ≤ 150 |
| A7 | Scroll horizontal | `/publicaciones` a 375 px | 0 px de exceso |
| A10 | Accesibilidad | axe en `/publicaciones` y detalle pausado, 1280 y 375 px | 0 violaciones serias/críticas |
| A11 | Comportamiento | E2E: dueño pausa un apunte → no sale en `/explorar` ni en búsqueda → otro usuario abre el enlace y ve "Pausada", sin comprar → `POST /orders` da 409 `LISTING_PAUSED` → un comprador previo sigue descargando → dueño reactiva → vuelve al catálogo con el mismo `reviewStatus` | pasa |
| A12 | Migración | `prisma migrate deploy` en BD dev aplica sin errores; columnas nullable | OK |

## 6. Checklist de ejecución
- [x] D1 y D2 aprobadas por el humano (2026-10-12).
- [ ] Tarea 1: schema + migración fechada; aplicar en dev; regenerar cliente Prisma.
- [ ] Tarea 2: `lib/pause.ts` + tests; rutas pause/resume en documentos y bazar.
- [ ] Tarea 3: filtros de catálogo, `paused` en detalle, bloqueo en `POST /orders`; openapi.
- [ ] Tarea 4: UI en `/publicaciones` (botón y etiqueta) y aviso en el detalle.
- [ ] Tarea 5: verificar A1–A12 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
