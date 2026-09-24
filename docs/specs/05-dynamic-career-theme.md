# Especificación: 05 - Tema Dinámico por Carrera (Career Theme v2)

## 1. Objetivo y Contexto
**Descripción:** `CareerThemeProvider` (`apps/web/src/live/careerTheme.tsx`) ya expone `{ career, setCareer, accent }` y escribe la variable CSS `--hub-p` (triplete RGB) en `<html>`. El problema es que los componentes nuevos de estilo Studocu (`StudocuHero`, `HomeRecentDocs`, `DocumentCard`, filtros) usan colores fijos (`zinc`, `blue-600`, `emerald`), así que cambiar de carrera no se refleja en la UI.
**Objetivo técnico:** Establecer una sola fuente de verdad para el color: tokens CSS derivados de la carrera activa, consumidos por Tailwind. Cuando no hay carrera activa (`"all"`), el valor por defecto es Teal `#00685F`.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Base Studocu:** fondos `bg-white` / `bg-zinc-50`, texto `zinc-900/500`, bordes `zinc-100`. El color solo aparece en los **acentos**.
- **Superficies que siguen a la carrera:**
  - Botón primario, anillo de foco del buscador del Hero y chip de filtro activo.
  - Precio en `DocumentCard`, subrayado del tab activo en el sidebar y barra de progreso de los wizards.
- **Tokens a exponer** (todos derivados de `accent.color`):
  - `--hub-p`: color base.
  - `--hub-p-soft`: fondo del chip, mezcla al 10 %.
  - `--hub-p-ink`: texto sobre el color base, blanco o negro según el contraste AA.
- **Transición:** el cambio de carrera anima `background-color` y `color` con una transición CSS de 200 ms, sin reflow. No se animan `width`/`height`.

## 3. Arquitectura y Lógica de Negocio
- **Frontend puro, sin backend.** La carrera por defecto sale de `Profile.career` (Prisma, enum de 15 valores, `CareerSchema` en `@hub/shared`), que ya se lee vía `useAuth().user.profile.career`.
- **Tailwind:** en `tailwind.config`, `primary` y `primary-soft` apuntan a `rgb(var(--hub-p) / <alpha-value>)`. El fallback de `--hub-p` en `:root` es `0 104 95` (Teal).
- **Contraste:** reutilizar el test existente de unicidad y contraste AA de `data/unsa.ts`, y añadir un helper `inkFor(hex)` para decidir `--hub-p-ink`.
- **Pintura inicial:** leer `localStorage.hub_career` en un script inline de `index.html` para fijar `--hub-p` antes de la hidratación. Esto evita el flash de color (FOUC).
- **Límite:** el provider debe quedar por debajo de 150 líneas; si crece, extraer `themeTokens.ts`.

## 4. Checklist de Ejecución
- [x] Tarea 1: Extraer `hexToRgbTriplet` + `inkFor` a `apps/web/src/lib/themeTokens.ts` con tests vitest (contraste AA de los 15 acentos).
- [x] Tarea 2: Escribir `--hub-p`, `--hub-p-soft` y `--hub-p-ink` desde `CareerThemeProvider`, con fallback Teal `#00685F`.
- [x] Tarea 3: Mapear `primary`, `primary-soft` y `primary-ink` en `tailwind.config` sobre las variables CSS.
- [x] Tarea 4: Refactorizar `StudocuHero`, `HomeRecentDocs` y `DocumentCard` para reemplazar `blue-600`/`emerald` por `text-primary`, `ring-primary` y `bg-primary-soft`.
- [x] Tarea 5: Script inline en `index.html` que fija `--hub-p` desde `localStorage` antes del primer paint (sin FOUC).
- [x] Tarea 6: Verificar con `npm run typecheck`, `npm run lint` y `npm test`, y comprobar a ojo que cambiar de carrera no produce layout shift.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Todo implementado.** `lib/themeTokens.ts` (+ test), `live/careerTheme.tsx`, `tailwind.config.js` (`primary`, `primary-soft`, `primary-ink`) y el script inline de `index.html` que valida y aplica `--hub-p*` antes del primer paint.
- **Ampliación.** `/explorar?career=` aplica la carrera al tema global (`lib/useExploreParams.ts`), y `styles/ui.css` consume los mismos tokens.
- **Resto pendiente.** Quedan `blue-600`/`emerald` en `components/landing/FeatureMocks.tsx` (maquetas decorativas); hay que revisar si son acentos. `tailwind.config.js` conserva el alias MD3 `primary-container`.
- **Sin verificación medible** de "sin layout shift"; solo se comprobó a ojo.
