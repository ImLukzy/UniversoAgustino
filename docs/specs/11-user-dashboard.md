# Especificación: 11 - Panel del Estudiante

## 1. Objetivo y Contexto
**Descripción:** La información del estudiante está repartida en `/panel` (`Panel.tsx`, 463 líneas), `/pedidos` (358), `/ventas` (371) y `/publicaciones`, cada una con un estilo distinto.
**Objetivo técnico:** Construir un panel único estilo Studocu con 4 pestañas: **Guardados**, **Mis subidas**, **Mis pedidos** y **Mis ventas**. Las rutas existentes se conservan como deep links a cada pestaña (mapa de `lib/routes.ts`).

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Cabecera:** avatar, nombre, carrera · ciclo y el botón secundario "Subir material" (`bg-primary`). Sin estadísticas inventadas (ni seguidores ni vistas).
- **Tabs:** subrayado animado con `layoutId` en `bg-primary` (color de la carrera) y el conteo real entre paréntesis.
- **Contenido por pestaña:**
  - **Guardados / Mis subidas:** grilla de `DocumentCard` (misma geometría del Home). En Subidas, badge de estado (`PUBLISHED`/`HIDDEN`/…) y un menú ⋯ para editar y eliminar.
  - **Mis pedidos / Mis ventas:**
    - Lista de filas (`orders/BuyerOrderRow`; `PanelOrderRow` fue eliminado) con título en snapshot, monto, chip de estado y la acción contextual.
    - Acciones: Pagar, Confirmar recepción, Confirmar pago, Aceptar alquiler o Cancelar.
    - En ventas, el total neto liberado vs. el retenido en custodia.
- **Empty states:** `EmptyState` compartido con la CTA correspondiente (Explorar / Subir).
- **Motion:** cambio de pestaña con `AnimatePresence mode="wait"` y spring 400/30; skeletons 1:1 por pestaña.

## 3. Arquitectura y Lógica de Negocio
- **API existente:**
  - `GET /documents/mine` y `GET /bazar/mine`.
  - `GET /orders/mine` (comprador) y `GET /orders/sales` (vendedor, polling de 30 s).
  - Acciones `POST /orders/:id/{accept|pay|confirm-payment|confirm-receipt|cancel|refund}` y `PATCH/DELETE /documents/:id`.
- **Guardados:** depende de `SavedDocument` (spec 06). Se añade `GET /documents/saved` paginado, documentado en `openapi.yaml`.
- **Finanzas:** los totales de ventas suman `netCents` de los pedidos `RELEASED` (liberado) y `ESCROW` (retenido), sin recalcular la comisión.
- **Estado:** pestaña activa en la URL (`?tab=saved|uploads|orders|sales`). Las claves de React Query son `["orders", "mine"]`, `["orders", "sales"]`, `["documents", "mine"]` y `["documents", "saved"]`. Las mutaciones invalidan su clave.
- **Rutas:** `/pedidos` → `?tab=orders`, `/ventas` → `?tab=sales` y `/publicaciones` → `?tab=uploads`, como redirects que no rompen enlaces de notificaciones.
- **Componentes** (`components/dashboard/`): `DashboardHeader`, `DashboardTabs`, `SavedTab`, `UploadsTab`, `OrdersTab` y `SalesTab`.

## 4. Checklist de Ejecución
- [ ] Tarea 1: Añadir `GET /documents/saved` sobre `SavedDocument` y actualizar `openapi.yaml` (requiere la spec 06, Tarea 1).
- [ ] Tarea 2: Crear `DashboardHeader` + `DashboardTabs` (`layoutId`, color `primary`, pestaña sincronizada con `?tab=`).
- [ ] Tarea 3: Crear `SavedTab` y `UploadsTab` con la grilla de `DocumentCard`, el menú ⋯ y el `EmptyState`.
- [ ] Tarea 4: Crear `OrdersTab` y `SalesTab` reutilizando `orders/BuyerOrderRow`/`SaleActions` (`PanelOrderRow` ya no existe), con acciones según el estado (7 estados).
- [ ] Tarea 5: Totales de ventas liberado/retenido a partir de `netCents` (sin recalcular).
- [ ] Tarea 6: Redirigir `/pedidos`, `/ventas` y `/publicaciones` a sus pestañas; `Panel.tsx` por debajo de 150 líneas; typecheck, lint, test y `docs:check` en verde.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **No implementado como se especifica.** El refactor fue en sentido contrario: `/panel`, `/pedidos`, `/ventas` y `/publicaciones` siguen siendo **páginas separadas**, unidas por `AppSidebar`, sin pestañas ni `?tab=` ni redirects. No existe `components/dashboard/`.
- **Lo que hay:**
  - `pages/Panel.tsx` (49 líneas) + `components/panel/` (`PanelSummary`, `PanelOrders`, `PanelSpaces`, `usePanelData`).
  - `components/orders/BuyerOrderRow.tsx` compartido por Panel y Pedidos.
  - `components/ventas/` y `components/publicaciones/`.
- **Tarea 1.** No existe `GET /documents/saved` (el modelo `SavedDocument` sí existe).
- **Tarea 5, parcial.** El neto liberado se calcula sumando `netCents` de `RELEASED` (`usePanelData.ts`, `Ventas.tsx`). Falta el total retenido en custodia del lado vendedor.
- **Claves de caché.** `/ventas` usa `["orders","sales","paged"]` para no chocar con la lista completa `["orders","sales"]`.
- **Decisión pendiente:** mantener las páginas separadas (y reescribir esta spec) o implementar las pestañas.
