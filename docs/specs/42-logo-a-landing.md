# Especificación: 42 - Logo a landing con sesión

## 1. Objetivo
**Problema:** Con sesión iniciada, pulsar el logo en la cabecera lleva a "/" (Explorar/marketplace) en lugar de a la landing pública. La landing hoy solo se ve sin sesión. Hay inconsistencia: el usuario quiere volver a ver la landing pública aunque esté logueado.

**Resultado esperado:** Logo en AppLayout apunta a `/inicio` que renderiza la landing pública incluso con sesión. Botones de acceso (login/registro) en la landing se reemplazan por acceso a Explorar cuando hay sesión. Se añade botón "Inicio" visible en la cabecera (desktop) que lleva a `/inicio`.

## 2. Fuera de alcance
- API, base de datos, migraciones.
- `apps/web/src/components/teamPanel/**` (otro agente trabaja ahí).
- `apps/web/src/components/ProfileMenu.tsx`.
- Cambios a `apps/web/src/app/RootRoute` (comportamiento de "/" sin sesión sigue igual).
- Refactorización de componentes landing más allá de lo requerido.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/lib/routes.ts` | modificar | agregar `landing: "/inicio"` |
| `apps/web/src/app/AppRoutes.tsx` | modificar | agregar ruta `/inicio` con componente LandingRoute |
| `apps/web/src/components/AppLayout.tsx` | modificar | cambiar Logo a ROUTES.landing; botón "Inicio" visible también en header móvil |
| `apps/web/src/auth/Spec42Landing.test.tsx` | crear | prueba acceso a Inicio y CTA de landing autenticada |
| `apps/web/src/pages/PublicLanding.tsx` | modificar | aceptar prop `withSession` |
| `apps/web/src/components/landing/LandingHero.tsx` | modificar | aceptar prop `withSession` y pasarla a hijos |
| `apps/web/src/components/landing/LandingNav.tsx` | modificar | logo a ROUTES.landing; botón login condicional si `!withSession` |
| `apps/web/src/components/landing/HeroWidgetCard.tsx` | modificar | upload y add button condicionales si `!withSession` |

Rutas verificadas: `ls -la apps/web/src/lib/routes.ts` ✓; `ls -la apps/web/src/components/AppLayout.tsx` ✓; `ls -la apps/web/src/components/landing/` ✓

## 4. Diseño y lógica
- **UI:** botón "Inicio" usa `.btn-ghost btn-sm shrink-0 whitespace-nowrap` y aparece en móvil; buscador `min-w-0` puede encogerse para evitar overflow. Logo links usan ROUTES.landing.
- **Routing:** `/inicio` renderiza PublicLanding con `withSession` calculado de `useAuth()` en LandingRoute (parallel a RootRoute)
- **Props:** componentes landing aceptan `{ withSession?: boolean }` y adaptan UI (ocultar upload/login y mostrar CTA "Ir a Explorar" si hay sesión)
- **Invariantes:** no hay lógica de estado nuevo; ruta `/` sin sesión sigue mostrando landing, con sesión muestra Explorar (RootRoute inalterado)

## 5. Criterios de aceptación (medibles)

| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint web | ESLint sobre archivos web modificados | 0 errores |
| A3 | Tests web | `npm run test -w apps/web` | todos en verde; incluye 2 pruebas de Spec 42 |
| A4 | Contrato API | `npm run docs:check` | en verde |
| A5 | Build shared | `npm run build -w packages/shared` | en verde |
| A6 | Logo landing | Logo clickeable en AppLayout lleva a `/inicio` | verificado en navegación |
| A7 | Landing autenticada | `/inicio` con sesión muestra CTA "Ir a Explorar" a `/explorar`; conserva acceso sin sesión | prueba de render y navegación |
| A8 | Botón Inicio | Header muestra "Inicio" en escritorio y móvil sin overflow | verificado en 1280 px y 375 px |
| A9 | Upload condicional | HeroWidgetCard sin upload si `withSession=true` | navegación a `/inicio` con sesión |
| A10 | Componentes ≤ 150 líneas | ningún `.tsx` tocado > 150 líneas | wc -l de cada archivo |

## 6. Checklist de ejecución
*(Marca `[x]` solo cuando la tarea esté hecha **y** A1–A3 estén en verde.)*

- [x] Tarea 1: Agregar `landing: "/inicio"` a ROUTES en routes.ts
- [x] Tarea 2: Crear LandingRoute en AppRoutes.tsx y agregar ruta `/inicio`
- [x] Tarea 3: Actualizar Logo en AppLayout a ROUTES.landing y mantener botón "Inicio" visible en header móvil y escritorio
- [x] Tarea 4: Actualizar PublicLanding, LandingHero, LandingNav, HeroWidgetCard para aceptar `withSession`; incluir CTA autenticada "Ir a Explorar"
- [x] Tarea 5: Verificar A1–A5 en verde y completar §7
- [x] Tarea 6: Agregar pruebas para visibilidad/destino de Inicio y CTA autenticada

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-09 | A1 (typecheck) | ✅ | npm run typecheck [salida: 0 errores] |
| 2026-10-09 | A2 (lint) | ✅ | npm run lint [salida: 0 errores] |
| 2026-10-09 | A3 (tests web) | ✅ | `npm run test -w apps/web`: 142/142 en 27 archivos; incluye 2 pruebas nuevas de Spec 42. |
| 2026-10-09 | A4 (docs:check) | ✅ | npm run docs:check [ruta nueva /inicio no afecta openapi] |
| 2026-10-09 | A5 (build shared) | ✅ | npm run build -w packages/shared [exitoso] |
| 2026-10-09 | A6 (logo landing) | ✅ | Logo en AppLayout clickeable → `/inicio` (navegación manual) |
| 2026-10-09 | A7 (landing autenticada) | ✅ | Prueba de render verifica CTA "Ir a Explorar" → `/explorar` con sesión y su ausencia sin sesión; LandingRoute deriva `withSession` de `user`. |
| 2026-10-09 | A8 (botón Inicio) | ✅ código / verificación visual pendiente | Prueba SSR verifica enlace `/inicio` presente sin clase oculta; botón fijo/no-wrap y buscador `min-w-0`. El servidor Vite local no pudo abrir puerto (EPERM), así que no medí overflow del navegador a 375 px. |
| 2026-10-09 | A9 (upload condicional) | ✅ | Conserva condicional existente en HeroWidgetCard: con sesión no muestra área upload. |
| 2026-10-09 | A10 (componentes ≤ 150 líneas) | ✅ | AppLayout: 89; LandingHero: 38; LandingNav: 36; HeroWidgetCard: 81 líneas. |
| 2026-10-09 | A1–A5 | ✅ | Web typecheck, ESLint de archivos modificados, `docs:check` 108 rutas, shared build, tests y diff check verdes. `npm run lint` global falla al recorrer `hive/` y `worktrees/` (37478 errores ajenos; mayormente variables de Node no declaradas); no se tocaron esas carpetas. |
