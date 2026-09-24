# Especificación: 07 - Marketplace Híbrido (Studocu + Bazar)

## 1. Objetivo y Contexto
**Descripción:** El catálogo vive hoy en dos mundos visuales:
- `Explorar` (`/explorar`) para los apuntes (`Document`).
- `Bazar` (`/bazar`) para los productos físicos (`BazarItem`: LIBRO | INSTRUMENTO | SCRUB, VENTA | ALQUILER).

El bazar **no se elimina** (ver PROJECT_CONTEXT §0).
**Objetivo técnico:** Integrar el Bazar en el ecosistema Studocu con una grilla limpia y coherente. Los apuntes gratuitos, los de pago y los productos físicos conviven con jerarquía clara, sin parecer una tienda recargada.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Una sola familia de cards, con tres variantes sobre la misma geometría** (`w-48`, cover 4:3, título en 2 líneas):
  - `DocumentCard` gratis: sin precio, con el badge "Gratis" en `zinc`.
  - `DocumentCard` de pago: precio `S/ X.XX` en `text-primary`.
  - `BazarCard`:
    - Foto (`photos[0]`, `object-cover`) y badge `Venta` / `Alquiler`.
    - Si es alquiler, la garantía en `zinc-500`.
    - Estado `RESERVED` → overlay "Reservado" en gris.
- **Studocu atrae al clic:** ninguna card muestra un botón "Comprar"; el clic lleva a `/v/:id` o `/p/bazar/:id`.
- **Filtros:**
  - Pills horizontales `Todo · Apuntes · Gratis · Bazar` y el chip activo con `bg-primary-soft text-primary`.
  - La transición de la grilla usa `AnimatePresence` + `layout` (spring 400/30) solo en el contenedor, sin aplicarlo sobre imágenes lazy.
- **Secciones en Home:** "Añadidos recientemente" (docs) y una fila "Del Bazar" con scroll horizontal y snap, con alto fijo para CLS 0.

## 3. Arquitectura y Lógica de Negocio
- **API existente:**
  - `GET /documents` (filtros `q`, `career`, `university`, paginado).
  - `GET /bazar` (listado), `GET /bazar/:id` y `POST /bazar/:id/reserve`, que crea `Order` `PENDING` con TTL de 30 min (`RESERVATION_TTL_MINUTES`).
- **Sin endpoint unificado en v1:** el cliente combina dos queries de React Query (`["home-docs", …]` y `["bazar", …]`) según el filtro activo. Un endpoint `/catalog` solo se evaluará si p95 lo exige.
- **Precio:**
  - Siempre `priceCents` formateado con `pen()`.
  - Jamás recalcular comisión en la card: la única vía es `computePrice()` de `@hub/shared`, y solo en el checkout.
- **Tipos:** añadir `HubBazarItem` en `lib/api.ts` si falta, espejando el modelo Prisma (grieta de tipos conocida).
- **Prohibido:** ratings, vistas o "más vendidos" inventados.

## 4. Checklist de Ejecución
- [x] Tarea 1: Crear `components/marketplace/BazarCard.tsx` con la misma geometría que `DocumentCard` (w-48, cover fijo, título en 2 líneas).
- [x] Tarea 2: Añadir las variantes Gratis/De pago a `DocumentCard` y el precio en `text-primary`.
- [x] Tarea 3: Crear `CatalogFilters.tsx` (pills Todo/Apuntes/Gratis/Bazar) con el chip activo coloreado por la carrera.
- [x] Tarea 4: Crear `useCatalog(filter, q, career)` que combine `GET /documents` y `GET /bazar` con `keepPreviousData`.
- [x] Tarea 5: Añadir la fila "Del Bazar" (scroll-snap, alto reservado) en `Home` bajo "Añadidos recientemente".
- [x] Tarea 6: Mostrar el overlay "Reservado" para `BazarStatus.RESERVED`; skeletons 1:1; verificar CLS≈0 al cambiar filtros.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Implementado.** `components/marketplace/BazarCard.tsx` (w-48, overlay "Reservado"), `components/DocumentCard.tsx` (w-48, variantes Gratis/De pago), `components/marketplace/CatalogFilters.tsx` (Todo/Apuntes/Gratis/Bazar), `lib/useCatalog.ts` (`keepPreviousData`) y `components/home/HomeBazarRow.tsx` (snap, alto fijo `h-[16rem]`).
- **Diferencia.** El badge "Gratis" usa `bg-[#dcfc6b]` (estética "rudo") en vez de `zinc`.
- **Ruta.** El catálogo vive en `/explorar`, no en `/`, y acepta `?q=`, `?f=` y `?career=`.
- **Sin medición** de "CLS≈0 al cambiar filtros" (falta la regresión visual con Playwright).
