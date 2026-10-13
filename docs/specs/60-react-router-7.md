# Especificación: 60 - Actualizar a React Router 7

## 1. Objetivo
**Problema:** la web usa `react-router-dom` 6.30.6. La rama 6 ya no recibe mejoras y es la base desde la que se migra a la 7.
**Resultado esperado:** `react-router-dom` 7.18.x (con `react-router` 7.x). La navegación, la carga diferida de páginas (spec 57), las redirecciones de sesión y el reparto del bundle se comportan igual, y todos los gates y la E2E quedan en verde.

## 2. Fuera de alcance
- **React Router 8:** exige React ≥ 19.2.7 y `react-router-dom` no tiene versión 8, así que queda descartado hasta migrar a React 19.
- Pasar al modo framework o a data routers (`createBrowserRouter`, loaders), y refactorizar `TeamPanel` a rutas anidadas.
- React, Tailwind u otras dependencias mayores; `.github/workflows/*` y `render.yaml`.
- Subir umbrales de presupuesto.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/package.json` | modificar | `react-router-dom` ^7.18 (mantener el paquete; reexporta `react-router`) |
| `package-lock.json` | modificar | regenerado; una sola versión de `react-router` |
| `apps/web/vite.config.ts` | modificar | el regex de `vendor-react` también debe cubrir `node_modules/react-router/` (en la v7 el código vive ahí) |
| `apps/web/src/**/*.test.tsx` | modificar solo si hace falta | 7 tests usan `StaticRouter` de `react-router-dom/server`; ajustar el import si cambia en la v7 |
| otros `apps/web/src/**` | modificar solo si el typecheck lo exige | sin cambios de comportamiento |

## 4. Diseño y lógica
- Exploración de Jim: solo usamos APIs declarativas (`BrowserRouter`, `Routes`/`Route`, `Link` 54 veces, `useNavigate` 17, `useSearchParams` 8, `Navigate` 6, `useLocation` 4, `useParams` 3, `NavLink` 1). No hay data APIs, ni future flags, ni enlaces relativos.
- **v7 envuelve la navegación en `startTransition`.** Hay que comprobar que las páginas diferidas (lazy de `AppRoutes.tsx` y `prefetch.ts`) cargan sin pantallas en blanco ni parpadeos. Con un mismo `Suspense`, ahora puede mantenerse la página anterior mientras carga la nueva. Es aceptable, pero si cambia algo visible hay que reportarlo.
- **Base de comparación**, medida antes de cambiar nada:
  - JS inicial en gzip (unos 118,6 KB tras la spec 59).
  - Lista de chunks.
  - Que `vendor-react` contenga el router.
- **Después:**
  - JS inicial ≤ base + 5 %.
  - El router dentro de `vendor-react`, no en `index`.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Versiones | `npm ls react-router-dom react-router` | 7.18.x, una sola versión de cada uno |
| A2 | Gate | `npm run verify` | en verde |
| A3 | Tests | `npm test` | mismo número o más; ningún `.skip` nuevo |
| A4 | Bundle | build y gzip del JS inicial, antes y después; el router dentro de `vendor-react` | ≤ base + 5 % |
| A5 | E2E | `npm run e2e:ci` | 7 suites ✓ |
| A6 | Navegación | Playwright: `/` → `/explorar` → detalle → atrás; `/balotarios` → examen; ruta inexistente; `/panel` sin sesión → redirige; con sesión QA de moderador → `/panel/pagos-por-verificar` | sin errores de consola ni pantallas en blanco |

## 6. Checklist de ejecución
- [x] Tarea 1: medir la base (A4).
- [x] Tarea 2: actualizar dependencias y lockfile.
- [x] Tarea 3: ajustar el regex de `vendor-react` y los imports de tests si hace falta.
- [x] Tarea 4: A1–A6 y anotar los números antes y después en el reporte.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A1 | ✅ | react-router-dom y react-router 7.18.4, una versión de cada uno (Dwight de30ab7) |
| 2026-10-13 | A2–A3 | ✅ | `npm run verify` en verde (Dwight y Claudio tras `npm ci`); tests antes = después: API 630, web 171, shared 132, scripts 6. Cambios: `void navigate(...)` (v7 devuelve promesa) e import de `StaticRouter` desde `react-router-dom` |
| 2026-10-13 | A4 | ✅ | JS inicial gzip 119 645 → 124 654 B (+4,19 %, ≤ 5 %); el router queda en `vendor-react` (regex con `react-router`) |
| 2026-10-13 | A5 | ✅ | `npm run e2e:ci` en la rama integrada: 7 suites ✓ |
| 2026-10-13 | A6 | ✅ | Dwight: 5 rutas OK; la ruta inexistente queda en blanco igual en v6 y v7 (preexistente, también en producción) → spec 61. Pam: 11 flujos OK a 1280 y 375 px (atrás/adelante, `?next=`, onboarding, vendedor, panel del moderador, F5 en rutas profundas); 0 errores no capturados |
| 2026-10-13 | Auditoría | ✅ | Kelly (task_ec7d8e67e427): APROBADO; sin `await` críticos omitidos; el aumento de bundle es del router v7 |
