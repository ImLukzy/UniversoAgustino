# Especificación: 62 - Actualizar a Tailwind 4

## 1. Objetivo
**Problema:** la web usa `tailwindcss` 3.4.19 con PostCSS y `autoprefixer` (`apps/web/postcss.config.js`, `apps/web/tailwind.config.js`). La rama 3 ya no recibe mejoras.
**Resultado esperado:** `tailwindcss` 4.3.x integrado con `@tailwindcss/vite`. La web se ve igual que antes a 1440 y 375 px, con todos los gates y la E2E en verde. Solo se aceptan diferencias imperceptibles de color, porque la paleta por defecto de v4 pasa a oklch.

## 2. Fuera de alcance
- Rediseños, cambios de textos, nuevas clases de componentes o cambios de tokens de marca (`primary*`, `--hub-*`).
- React, React Router, Vite u otras dependencias mayores; `.github/workflows/*` y `render.yaml`.
- Subir umbrales de presupuesto para «hacer pasar» un gate. Si el CSS crece, se reporta.
- Modo oscuro, plugins de Tailwind nuevos.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (Tailwind 4 aprobado por el humano el 2026-10-13).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/package.json` | modificar | `tailwindcss` ^4.3, `@tailwindcss/vite` ^4.3; quitar `autoprefixer` y `postcss` si nada más los usa |
| `package-lock.json` | modificar | regenerado (npm 12) |
| `package.json` (raíz) | modificar solo si hace falta | `allowScripts`: no aprobar nada sin revisar el script (p. ej. `@tailwindcss/oxide`), versión fijada |
| `apps/web/vite.config.ts` | modificar | añadir el plugin `tailwindcss()`; no tocar `codeSplitting` |
| `apps/web/postcss.config.js` | eliminar | v4 con el plugin de Vite no lo necesita |
| `apps/web/tailwind.config.js` | eliminar o reducir | migrar a `@theme` en CSS (preferido). Si algo no se puede expresar, `@config` y explicarlo |
| `apps/web/src/styles/tokens.css`, `ui.css` | modificar | `@tailwind …` → `@import "tailwindcss"`; tema en `@theme`; mantener el orden de cascada actual (`ui.css` en `@layer components`, `@font-face`, vars `--hub-*`) |
| `apps/web/src/**/*.tsx` | modificar | solo renombres de utilidades de v4 |

## 4. Diseño y lógica
- **Herramienta oficial:** se puede usar `npx @tailwindcss/upgrade` desde `apps/web`, en la rama de trabajo. Su resultado se revisa a mano, archivo por archivo.
- **Renombres que nos afectan** (exploración de Jim más el grep de Claudio). Todos deben quedar migrados y con el mismo aspecto:
  - `shadow-sm` → `shadow-xs` (3) y `shadow` sin sufijo → `shadow-sm` (1).
  - `rounded` sin sufijo (7): ojo, tenemos `borderRadius.DEFAULT` propio. Hay que conservar el mismo radio.
  - `blur` → `blur-sm` (1), `backdrop-blur-sm` → `backdrop-blur-xs` (1) y `backdrop-blur` → `backdrop-blur-sm` (2).
  - `outline-none` → `outline-hidden` (3 en `@apply` de `ui.css` y 4 en tsx).
  - `bg-gradient-to-b` → `bg-linear-to-b` (`Paywall.tsx`).
- **Revisión manual obligatoria:**
  - **`space-y-*` (10 archivos) y `divide-*` (6):** v4 cambió el selector. Comprobar que no haya hijos ocultos ni márgenes dobles.
  - **Anillos:** el ancho por defecto de `ring` pasa a 1 px. Hoy todos son explícitos (`ring-2`), así que solo hay que verificarlo.
  - **Botones:** v4 quita `cursor: pointer`. Para no cambiar el comportamiento, se añade en la capa base `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }`.
  - **Borde por defecto:** v4 usa `currentColor`. Según Jim, todos nuestros `border` fijan un color. Comprobarlo con grep y, si aparece alguno sin color, ponerle el color que tenía (`zinc-200`).
  - **Placeholder:** v4 cambia el color por defecto. Comprobar que todos los campos sigan con el color explícito.
- **Tema:** `--color-primary`, `--color-primary-soft` y `--color-primary-ink` deben seguir leyendo las vars `--hub-p*`, con soporte de opacidad (`bg-primary/10` sigue funcionando). También hay que conservar radios, espaciados, las 14 familias y los 14 tamaños tipográficos con su `lineHeight`, `letterSpacing` y `fontWeight`.
- **Base de comparación**, medida antes de cambiar nada:
  - CSS en gzip (unos 10,2 KB).
  - JS inicial en gzip.
  - Capturas a 1440 y 375 px de `/`, `/explorar`, `/balotarios`, `/bazar`, `/login`, `/esta-ruta-no-existe`, un detalle de documento y, con sesión E2E, el panel del equipo.
- **Después:**
  - CSS en gzip ≤ base + 25 % (el límite inicial era +10 %; el humano aceptó la excepción el 2026-10-13: Tailwind 4 añade unos 2,5 KB fijos de `@property` y variables de tema).
  - JS inicial ≤ base + 2 %.
  - Las capturas, comparadas una a una, sin diferencias de maquetación (posiciones, tamaños, saltos de línea).

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Versiones | `npm ls tailwindcss @tailwindcss/vite` | 4.3.x; sin `autoprefixer` ni `postcss.config.js` |
| A2 | Gate | `npm run verify` | en verde |
| A3 | Sin clases v3 | grep de `shadow-sm`, `outline-none`, `bg-gradient-to-`, `@tailwind ` en `apps/web/src` | 0 restos v3 (salvo los ya renombrados con su nuevo sentido) |
| A4 | Tamaño | CSS gzip y JS inicial gzip antes/después | CSS ≤ +25 % (excepción aprobada), JS ≤ +2 % |
| A5 | Visual | capturas antes/después (páginas y anchos de §4) | sin diferencias de maquetación; 0 px de scroll horizontal a 375 |
| A6 | E2E y axe | `npm run e2e:ci` | 7 suites ✓ (axe en 0 incluido) |
| A7 | Iconos y fuentes | `node scripts/subset-icons.mjs --check`; fuentes locales cargan | verde |

## 6. Checklist de ejecución
- [ ] Tarea 1: medir la base (A4) y capturas «antes».
- [ ] Tarea 2: dependencias, plugin de Vite, quitar PostCSS/autoprefixer.
- [ ] Tarea 3: CSS (`@import "tailwindcss"`, `@theme`, base de cursor).
- [ ] Tarea 4: renombres de utilidades y revisión de `space-*`/`divide-*`/bordes.
- [ ] Tarea 5: A1–A7 y anotar números antes/después.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
