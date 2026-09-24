# Especificación: 18 - Limpieza y unificación visual (rudo)

## 1. Objetivo
**Problema:** convivían dos versiones del mismo bloque: `.card-flat` (borde zinc-200) junto a `.card` o reescrita a mano como `card-flat border-2 border-zinc-900`; estados vacíos como texto suelto o envueltos a mano; dos filas de chips-pestaña copiadas; paneles de la landing con la sombra dura inline; "Lo mejor para los mejores" (`LandingUniversities`) repetía el listado de escuelas del showcase con estilo pastel (`shadow-sm`, blobs fijos); la cifra "+45 escuelas" contradecía las 19 del showcase; enlace azul fijo (`#2563eb`) en el hero.
**Resultado esperado:** una sola versión rudo por bloque, sin componentes duplicados ni huérfanos.

## 2. Fuera de alcance
- Colores semánticos de error/éxito (`#b91c1c`, `#dcfce7`…) y la identidad del hero/footer (`#28132c`).
- Controles segmentados (`PayMethodPanel`, `HeroWidgetCard`).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `styles/ui.css` | modificar | − `.card-flat`; + `.card-dashed`, `.panel` |
| `components/EmptyState.tsx` | modificar | prop `boxed` (caja punteada) + `className` |
| `components/landing/ChipTabs.tsx` | crear | chips-pestaña con `layoutId` |
| `components/landing/LandingUniversities.tsx` | eliminar | duplicado del showcase |
| `components/landing/{LandingShowcase,LandingFeatures,FeatureRows,LandingDevices,LandingStats,LandingNav,LandingFooter,HeroWidgetCard}.tsx`, `data/landingCareers.ts`, `pages/PublicLanding.tsx` | modificar | `ChipTabs`, `.panel`, cursos destacados en el showcase, anclas `#carreras`, cifra real |
| `Accordion`, `Skeleton`, `bazar/EscrowSteps`, `detalle/BuyPanel`, `orders/BuyerOrderRow`, `publicaciones/{ListingEditor,SalesOverview}`, `publicar/PublishPreview`, `ventas/ReportsCenter`, `pages/{Admin,Bazar,Cuenta,Notificaciones,Pedidos,Perfil,Publicaciones,Ventas}` | modificar | `.card` / `.card-dashed` / `EmptyState boxed` |
| `apps/web/index.html` | modificar | subset de iconos |

## 4. Checklist de ejecución
- [x] T1: `.card-flat` → `.card` / `.card-dashed`; skeletons con la misma caja que su tarjeta.
- [x] T2: estados vacíos unificados en `EmptyState boxed`.
- [x] T3: `ChipTabs` compartido y `.panel` en la landing.
- [x] T4: eliminar `LandingUniversities` (cursos destacados pasan al showcase; anclas a `#carreras`).
- [x] T5: huérfanos: ningún módulo sin importar en `apps/web/src`.
- [x] T6: typecheck, lint, test y visual-regression.

## 5. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-09-24 | Tipos | ✅ | `npm run typecheck` exit 0 |
| 2026-09-24 | Lint | ✅ | `npm run lint` exit 0 |
| 2026-09-24 | Tests | ✅ | api 37, web 41, shared 34 |
| 2026-09-24 | Visual / CLS | ✅ | `visual-regression.mjs` 22/22; `/` CLS 0.011 (375) |
| 2026-09-24 | Iconos | ✅ | `subset-icons --check` OK (113) |
