# Especificación: 02 - Refactor UI/UX "Taste & Motion" (Explorar)

## 1. Contexto y Objetivo
**Descripción:** El componente principal `Explorar.tsx` (~500 líneas) está sobrecargado. Vamos a refactorizarlo aplicando las 3 reglas de oro del diseño: Jerarquía Impecable (Paul Bakaus), Animaciones Fluidas (Emil Kowalski) y Estética Moderna y Minimalista (Taste).
**Objetivo Técnico:** Dividir el monolito en 3 sub-componentes (Header, Filters, Grid) y envolver la interfaz en animaciones de Framer Motion, manteniendo React Query para el fetching.

## 2. Referencias de Diseño (Taste Skill)
- **Look & Feel:** Inspirado en Vercel/Linear. Interfaz muy limpia, elegante y simple. Fondos claros (`bg-zinc-50`), bordes sutiles (`border-zinc-200`).
- **Cards de Documentos:** En lugar de cajas pesadas, usar un estilo "Notion-like". Título fuerte, metadatos sutiles, hover state que eleve la card suavemente.
- **Tipografía:** Usar la fuente Inter/Jakarta. Jerarquía clara: `text-zinc-900` para títulos, `text-zinc-500` para detalles (universidad, ciclo).

## 3. UI, Animaciones y Layout (Kowalski & Bakaus)
**Reglas de Animación (Framer Motion):**
- Usar SIEMPRE configuraciones tipo "spring" para interacciones naturales.
  `const springTransition = { type: "spring", stiffness: 400, damping: 30 };`
- Las cards del catálogo deben entrar en "stagger" (cascada) al cargar.

**Estructura de Componentes a crear en `apps/web/src/components/marketplace/`:**
1. `MarketplaceHeader.tsx`: Título y buscador principal (sticky, con efecto de desenfoque `backdrop-blur`).
2. `CatalogFilters.tsx` + `CareerFilter.tsx` (antes `MarketplaceFilters.tsx`): Badges de carrera/ciclo. Al hacer clic, deben usar `layoutId` de Framer Motion para animar el indicador activo.
3. `apps/web/src/components/DocumentCard.tsx` (compartido, fuera de `marketplace/`): Re-diseño de la card individual con estética minimalista y micro-interacciones en el botón de precio.
4. `Explorar.tsx`: Quedará como el "Smart Component" (menos de 100 líneas) que solo maneja React Query y une los 3 componentes visuales.

## 4. Lógica (React Query)
- Mantener la lógica de `useQuery` para el fetching de `/api/v1/documents`.
- No alterar los endpoints, enfocarse **exclusivamente** en la división del archivo y la experiencia visual (UI/UX).

## 5. Checklist de Tareas Granulares
*(Agente Opencode: Eres un experto en UI/UX. No rompas la lógica de negocio, tu trabajo es hacer que la UI sea hermosa, limpia, elegante y fluida).*

- [x] Tarea 1: Crear la carpeta `apps/web/src/components/marketplace/` si no existe.
- [x] Tarea 2: Extraer la lógica de la Card actual hacia `DocumentCard.tsx`. Aplicar estilos modernos (bordes finos, padding balanceado, textos grises para metadatos) y agregar un hover con Framer Motion (`whileHover={{ y: -2 }}`).
- [x] Tarea 3: Extraer los filtros hacia `MarketplaceFilters.tsx`. Los botones activos deben tener la clase `bg-teal-600 text-white`, los inactivos `text-zinc-600 hover:bg-zinc-100`.
- [x] Tarea 4: Extraer la cabecera hacia `MarketplaceHeader.tsx`, asegurando que los inputs tengan `ring-teal-500` on focus y un padding generoso.
- [x] Tarea 5: Limpiar `Explorar.tsx`. Eliminar todo el JSX extenso y reemplazarlo por la importación de los 3 nuevos componentes, pasándoles los datos de React Query por props.
- [ ] Tarea 6: Envolver el Grid (la lista de DocumentCards) en una animación de entrada (Framer Motion `variants` con `staggerChildren: 0.1`).

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Estructura real.** `components/marketplace/` contiene `MarketplaceHeader`, `CatalogFilters`, `CareerFilter`, `CatalogGrid` y `BazarCard`. `DocumentCard` vive en `components/DocumentCard.tsx`. `Explorar.tsx` tiene 39 líneas (cumple < 100) y se sirve en `/explorar`, no en `/`.
- **Tarea 2.** El hover se hace con la clase CSS `card-hover` del sistema de diseño (`styles/ui.css`), no con `whileHover` de Framer Motion.
- **Tareas 3 y 4.** Las clases `bg-teal-600` y `ring-teal-500` se sustituyeron por `chip-active`, `.searchbar` y los tokens `primary` (spec 05, que prevalece).
- **Tarea 6 desmarcada.** No hay `staggerChildren`. `CatalogGrid` usa `AnimatePresence mode="popLayout"` + `layout` con `SPRING`, sin entrada en cascada.
- **Sin `layoutId`** en el indicador activo de los filtros (lo pedía la sección 3).
