# Especificación: 25 - Portada sin esperar a la API

## 1. Objetivo
**Problema:** `/` muestra `<RouteFallback />` mientras `loading` es `true` (`apps/web/src/app/AppRoutes.tsx:56-58`). `loading` solo pasa a `false` cuando responde `GET /auth/me` (`apps/web/src/auth/AuthContext.tsx:33-49`). La API está en Render gratis: tras 15 min sin uso se duerme y la primera petición tarda 30–60 s, así que todo visitante nuevo ve el cargador ~1 min aunque la portada (`PublicLanding`) no necesita la API.
**Resultado esperado:** un visitante sin sesión previa ve la portada al instante, aunque la API esté dormida. Quien tenía sesión sigue entrando al marketplace como hoy.

## 2. Fuera de alcance
- API, cookies, interceptor de `lib/api.ts` (salvo lo indicado en §3), Render/Vercel.
- Cambiar textos o diseño de la portada.
- Otras rutas que sí necesitan datos de la API.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/auth/AuthContext.tsx` | modificar | pista de sesión en `localStorage` |
| `apps/web/src/app/AppRoutes.tsx` | modificar | `RootRoute` no bloquea sin pista |
| `apps/web/src/lib/api.ts` | modificar | solo si hace falta borrar la pista al cerrar sesión forzado (línea ~77) |
| `apps/web/src/auth/*.test.ts(x)` | crear | tests de la pista |
| `apps/web/vitest.config.ts` | modificar | incluir `src/auth/**/*.test.ts(x)` (y `src/app/**` si el test de `RootRoute` vive ahí) |

## 4. Diseño y lógica
- Pista no sensible `localStorage["ua-session-hint"] = "1"` (sin token ni datos): se escribe cuando `/auth/me` devuelve usuario (bootstrap, `login`, `register`, OAuth) y se borra en `logout`, en `auth:logout` y cuando `/auth/me` falla. Todo acceso a `localStorage` dentro de try/catch.
- `AuthContext` expone `hadSession: boolean` (lectura inicial de la pista).
- `RootRoute`: si `loading && !hadSession` → renderiza `<PublicLanding />` de inmediato. Si `loading && hadSession` → `<RouteFallback />` como hoy. Al terminar, si hay `user` → `<Explorar />`.
- El bootstrap de `/auth/me` sigue corriendo en segundo plano (además despierta la API).

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | verdes; +tests: pista se escribe con usuario, se borra en logout/fallo; `RootRoute` sin pista muestra portada con `loading=true` |
| A5 | Tamaño | archivos tocados ≤ 150 líneas | ≤ 150 |
| A11 | Comportamiento | build de web con `VITE_API_URL` apuntando a un puerto sin servidor → abrir `/` sin pista | portada visible < 3 s |
| A12 | Sesión | con pista y API respondiendo usuario → `/` muestra Explorar | pasa |

## 6. Checklist de ejecución
- [x] Pista de sesión en `AuthContext` + `hadSession`.
- [x] `RootRoute` no bloquea sin pista.
- [x] Tests y A1–A12 anotados en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1, A2, A3 | Pendiente: entorno sin dependencias | `npm run typecheck`, `npm run lint`, `npm test`: exit 127; faltan `tsc`, `eslint`, `vitest`. `npm ci --ignore-scripts`: EAI_AGAIN; intento offline: ENOTCACHED yargs. |
| 2026-10-08 | A5 | Pasa | AuthContext 112 líneas; AppRoutes 98; tests de sesión 90; tests RootRoute 26; vitest.config 10. `git diff --check`: exit 0. |
| 2026-10-08 | Build web | Pendiente: entorno sin dependencias | `npm run build -w apps/web`: exit 127, `tsc` ausente. |
| 2026-10-08 | Docs | Pasa con avisos existentes | `npm run docs:check`: exit 0, 24 rutas cubiertas. |
| 2026-10-08 | A11, A12 | Pendiente: verificación de god | God asumió navegador en mensaje 2026-10-08T19-33-48-190Z-00b27c. A4 y A6–A10 no están definidos en esta spec. |
| 2026-10-08 | A1 | Pasa | `npm run typecheck`: exit 0 en API, web y shared, sin errores. |
| 2026-10-08 | A2 | Pasa (producto) | Local: `npm run lint -- --ignore-pattern 'hive/**'`: exit 0 sin warnings. God: `npx eslint . --max-warnings=0 --ignore-pattern 'hive/**' --ignore-pattern 'roster-backups/**'`: exit 0. Lint sin exclusiones falla por archivos operativos del hive ajenos al producto; god aceptó la exclusión (mensaje 2026-10-08T19-37-39-217Z-c0eecc). |
| 2026-10-08 | A3 | Pasa | God ejecutó `npm test` fuera del sandbox con JWT ficticios: API 52/52, web 73/73, shared 42/42; mensaje 2026-10-08T19-36-51-212Z-7cf50b. Web incluye 14 tests de pista y 6 de RootRoute; sin servicios externos. |
| 2026-10-08 | Build web | Pasa | `npm run build -w apps/web`: exit 0, 745 módulos; avisos de importación estática/dinámica de Explorar y Forgot. |
| 2026-10-08 | A11 | Pasa | God, Playwright + Chrome, build de `apps/web` con `VITE_API_URL` hacia una API que nunca responde: sin pista, `/` muestra la portada completa (≈7 400 caracteres) en < 3 s a 375 px y 1280 px; 0 px de scroll horizontal. |
| 2026-10-08 | A12 | Pasa | Con pista y API colgada se mantiene "Cargando página…" (comportamiento esperado); con pista y usuario → Explorar cubierto por `RootRoute.test.tsx`. |
| 2026-10-08 | Auditoría | Pasa | Kelly: APTO sin hallazgos (pista solo '1', borrado en logout/auth:logout/fallo, OnboardingGate intacto). |
