# Especificación: 13 - Sistema de Diseño "Stetik / Rudo"

> Spec retroactiva: documenta lo implementado en el refactor de septiembre 2026.

## 1. Objetivo
**Problema:** cada página definía sus propios botones, tarjetas, modales y transiciones (unas 40 constantes de spring distintas: 350/32, 500/30, 120/20…), mezclaba `slate-*` con `zinc-*` y tenía tres implementaciones de modal y dos de acordeón.
**Resultado:** una sola fuente de estilos base, una sola transición y componentes únicos para modal, acordeón y fila de pedido, usados en todas las rutas.

## 2. Fuera de alcance
- Tokens de carrera (`--hub-p*`): siguen definidos por la spec 05.
- Clases MD3 heredadas de Stitch y renombrado de `stitch/`: ver spec 15.
- Rojos de error (`red-*`): son color semántico, no acento.

## 3. Archivos afectados
| Archivo | Acción |
|---|---|
| `apps/web/src/styles/ui.css` | creado (importado desde `styles/tokens.css`) |
| `apps/web/src/lib/motion.ts` | creado: exporta `SPRING` |
| `apps/web/src/components/ui/Modal.tsx` | creado: modal único |
| `apps/web/src/components/Accordion.tsx` | modificado: variantes `cards` / `rows` |
| `apps/web/src/components/orders/BuyerOrderRow.tsx` | creado: fila de pedido única |
| `ConfirmModal`, `publicaciones/QrModal`, `AuthModalHost` | migrados a `ui/Modal` |
| `auth/AuthModal`, `PanelOrderRow`, `PanelTabs`, `PanelLayout`, `StitchLayout`, `StitchHeader`, `StitchFooter` | eliminados |
| ~25 páginas y componentes (Explorar, Panel, Ventas, Pedidos, Cuenta, Ajustes, Detalle, Publicar, Bazar, Legal, Monetiza, Admin, AppLayout, AppSidebar, AppFooter, ProfileMenu, Toast, EmptyState…) | migrados a las clases del sistema |

## 4. Diseño
- **Estética "rudo":** borde 2 px `zinc-900` y sombra dura desplazada, sin desenfoque. Tokens en `ui.css`: `--ua-ink` (24 24 27) y `--ua-paper` (251 250 247).
- **Clases base (`ui.css`, 73 líneas):**
  - Botones: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-dark`, `.btn-ghost`, `.btn-icon`, `.btn-sm`, `.btn-lg`. Hover: desplazamiento de −1 px con sombra de 4 px; active: +2 px con sombra de 1 px; disabled con 50 % de opacidad y sin movimiento.
  - Tarjetas: `.card`, `.card-hover` (−2 px, sombra de 6 px), `.card-flat`.
  - Formularios: `.input` y `.searchbar`.
  - Etiquetas y texto: `.chip`, `.chip-active`, `.tag`, `.eyebrow`, `.h-display` y `.price`.
- **Acento:** siempre `primary` / `primary-soft` / `primary-ink` (spec 05). Neutros solo `zinc-*`.
- **Motion:** `SPRING = { type: "spring", stiffness: 400, damping: 30 }` es la única transición. No se escriben literales `stiffness` fuera de `lib/motion.ts`.
- **Modal (`ui/Modal.tsx`):** focus trap con Tab, Esc y clic en el backdrop cierran (salvo `locked`), `aria-modal`, foco inicial en `[data-autofocus]` y retorno del foco al disparador al cerrar.
- **Iconos:** subset de Material Symbols regenerado (96 iconos, `scripts/subset-icons.mjs`); umbral del test `materialIcons` bajado a 50.

## 5. Criterios de aceptación
| # | Criterio | Verificación | Estado |
|---|---|---|---|
| A1 | Un solo literal de spring | `grep -rl stiffness apps/web/src` → solo `lib/motion.ts` | ✅ 2026-09-23 |
| A2 | Un solo modal | `role="dialog"` solo en `ui/Modal.tsx` y en el menú móvil de `AppLayout.tsx` (drawer, no modal de contenido) | ✅ |
| A3 | Sin `slate-*` | `grep -rwE "[a-z]+-slate-[0-9]+" apps/web/src` → 0 (un grep simple de `slate-` coincide con `translate-`) | ✅ |
| A4 | Componentes ≤ 150 líneas | `wc -l` sobre `apps/web/src/**/*.ts(x)` | ✅ |
| A5 | typecheck / lint / test | `npm run typecheck && npm run lint && npm test` | ⚠️ último lote sin reverificar (spec 15, T1) |
| A6 | CLS < 0.05 y sin scroll horizontal a 375 px | Playwright | ❌ pendiente (spec 15, T4) |

## 6. Checklist de ejecución
- [x] Tarea 1: Crear `styles/ui.css` con botones, tarjetas, inputs, buscador, chips, tags y tipografía, sobre `--ua-ink` / `--ua-paper`.
- [x] Tarea 2: Crear `lib/motion.ts` (`SPRING`) y sustituir todas las constantes de spring locales (~40).
- [x] Tarea 3: Crear `ui/Modal.tsx` y migrar a él el modal de auth, `ConfirmModal` y `QrModal`; eliminar `auth/AuthModal`.
- [x] Tarea 4: Unificar `Accordion` (variantes `cards` / `rows`) para el FAQ de la landing, `/monetiza` y `/legal`.
- [x] Tarea 5: Crear `orders/BuyerOrderRow` para Panel y Pedidos; eliminar `PanelOrderRow`; migrar `SaleActions`, `RentalCard`, `DocumentCard` y `BazarCard` a `.card`.
- [x] Tarea 6: Migrar las páginas y el layout (AppLayout, AppSidebar, AppFooter, ProfileMenu, Toast, EmptyState) al sistema; `slate-*` → `zinc-*`.
- [x] Tarea 7: Regenerar el subset de iconos y ajustar el test `materialIcons`.
- [x] Tarea 8: Verificación visual medible (A6), trasladada a la spec 15. *Hecha en la spec 15 (T4): `scripts/visual-regression.mjs`, 20/20 combinaciones sin scroll horizontal y CLS < 0.05.*
