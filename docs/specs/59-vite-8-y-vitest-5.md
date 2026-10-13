# Especificación: 59 - Actualizar a Vite 8, Vitest 5 y plugin-react 6

## 1. Objetivo
**Problema:** la web compila con Vite 5.4.21 (fijado con un `overrides` en `package.json:10-12`) y los tests usan Vitest 2.1.9. Ambas ramas están fuera de soporte y no reciben parches.
**Resultado esperado:** Vite 8, Vitest 5 y `@vitejs/plugin-react` 6 instalados. La web compila y se comporta igual, con el mismo reparto de chunks diferidos (spec 57) y sin perder rendimiento. Todos los gates y la E2E quedan en verde.

## 2. Fuera de alcance
- React Router, Tailwind, React y cualquier otra dependencia mayor (cada una tendrá su spec).
- Cambios de UI, rutas o lógica de negocio.
- `.github/workflows/*` y `render.yaml`.
- Subir umbrales de presupuesto para «hacer pasar» un gate. Si el bundle crece, se reporta, no se relaja.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `package.json` | modificar | quitar `overrides.vite`; `vitest` ^5; `allowScripts` según `npm install-scripts ls` (quitar `esbuild@0.21.5` si ya no está y aprobar solo lo necesario, con versión fijada) |
| `package-lock.json` | modificar | regenerado con `npm install` (npm 12) |
| `apps/web/package.json` | modificar | `vite` ^8, `@vitejs/plugin-react` ^6 |
| `apps/web/vite.config.ts` | modificar | `build.rollupOptions.output.manualChunks` (objeto, eliminado en Vite 8) → equivalente soportado (`build.rolldownOptions` + `codeSplitting`/grupos) que conserve `vendor-react`, `vendor-query` y `vendor-pdf` |
| `apps/*/vitest.config.*`, `packages/shared/vitest.config.*` | modificar solo si hace falta | Vitest 5 activa `clearMocks: true` por defecto. Corregir los tests que dependan de llamadas acumuladas, no desactivarlo de forma global |
| tests afectados | modificar | solo los que fallen por la migración, con el motivo en el commit |

## 4. Diseño y lógica
- Un único salto. Según Jim, plugin-react 6 exige Vite 8, y Vitest 5 admite Vite ^6.4, ^7 y ^8.
- **Chunks:**
  - El build debe seguir generando `vendor-react`, `vendor-query` y `vendor-pdf` como chunks separados.
  - `pdfjs-dist` y `ExamenInteractivo` no pueden entrar en el chunk inicial.
  - Las secciones de la landing (`LandingSections`) siguen cargándose de forma diferida.
- **Base de comparación**, medida antes de cambiar nada (anotar en el reporte):
  - JS inicial en gzip: los `<script type=module>` y `modulepreload` de `index.html`. Referencia de la spec 57: unos 121 KB.
  - CSS total en gzip.
  - Lista de chunks.
- **Después:** JS inicial ≤ base + 5 %. Si sube más, se reporta como riesgo.
- `allowScripts`: el gate `install-scripts` debe quedar en verde y no se aprueba ningún paquete sin revisar qué script ejecuta.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Versiones | `npm ls vite vitest @vitejs/plugin-react` | vite 8.x, vitest 5.x, plugin-react 6.x; sin `overrides.vite` |
| A2 | Gate | `npm run verify` | en verde (typecheck, lint, test, budgets, install-scripts) |
| A3 | Tests | `npm test` | mismo número de tests o más que antes; ninguno con `.skip` nuevo |
| A4 | Chunks | `npm run build -w apps/web` y listado de `apps/web/dist/assets` | existen vendor-react, vendor-query y vendor-pdf; pdf y examen fuera del inicial |
| A5 | Bundle | JS inicial en gzip, antes y después | ≤ base + 5 % |
| A6 | E2E | `npm run e2e:ci` (Postgres efímero) | 7 suites ✓ (landing, 45, 46, pagos, reembolso, sede) |
| A7 | Iconos y fuentes | `node scripts/subset-icons.mjs --check` + E2E de iconos | verde |

## 6. Checklist de ejecución
- [ ] Tarea 1: medir la base (A5) en `ImLukzy/Claudio` sin cambios.
- [ ] Tarea 2: actualizar dependencias y lockfile; resolver `allowScripts`.
- [ ] Tarea 3: migrar `manualChunks`.
- [ ] Tarea 4: corregir los tests que fallen (en particular por `clearMocks`).
- [ ] Tarea 5: A1–A7 y anotar los números antes y después en el reporte.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
