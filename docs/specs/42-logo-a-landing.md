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
| `apps/web/src/components/AppLayout.tsx` | modificar | cambiar Logo a ROUTES.landing; agregar botón "Inicio" en header |
| `apps/web/src/pages/PublicLanding.tsx` | modificar | aceptar prop `withSession` |
| `apps/web/src/components/landing/LandingHero.tsx` | modificar | aceptar prop `withSession` y pasarla a hijos |
| `apps/web/src/components/landing/LandingNav.tsx` | modificar | logo a ROUTES.landing; botón login condicional si `!withSession` |
| `apps/web/src/components/landing/HeroWidgetCard.tsx` | modificar | upload y add button condicionales si `!withSession` |

Rutas verificadas: `ls -la apps/web/src/lib/routes.ts` ✓; `ls -la apps/web/src/components/AppLayout.tsx` ✓; `ls -la apps/web/src/components/landing/` ✓

## 4. Diseño y lógica
- **UI:** botón "Inicio" en AppLayout usa clase `.btn-ghost btn-sm`; hidden en móvil (`hidden md:inline-flex`); Logo links usan ROUTES.landing
- **Routing:** `/inicio` renderiza PublicLanding con `withSession` calculado de `useAuth()` en LandingRoute (parallel a RootRoute)
- **Props:** componentes landing aceptan `{ withSession?: boolean }` y adaptan UI (ocultar upload, login button si con sesión)
- **Invariantes:** no hay lógica de estado nuevo; ruta `/` sin sesión sigue mostrando landing, con sesión muestra Explorar (RootRoute inalterado)

## 5. Criterios de aceptación (medibles)

| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores |
| A3 | Tests web | `npm test -w apps/web` | todos en verde |
| A4 | Contrato API | `npm run docs:check` | en verde |
| A5 | Build shared | `npm run build -w packages/shared` | en verde |
| A6 | Logo landing | Logo clickeable en AppLayout lleva a `/inicio` | verificado en navegación |
| A7 | Landing autenticada | `/inicio` con sesión muestra landing sin botón login; sin sesión con botón | navegación manual (desktop) |
| A8 | Botón Inicio | Header muestra "Inicio" (desktop), oculto en móvil | verificado en 1280 px y 375 px |
| A9 | Upload condicional | HeroWidgetCard sin upload si `withSession=true` | navegación a `/inicio` con sesión |
| A10 | Componentes ≤ 150 líneas | ningún `.tsx` tocado > 150 líneas | wc -l de cada archivo |

## 6. Checklist de ejecución
*(Marca `[x]` solo cuando la tarea esté hecha **y** A1–A3 estén en verde.)*

- [x] Tarea 1: Agregar `landing: "/inicio"` a ROUTES en routes.ts
- [x] Tarea 2: Crear LandingRoute en AppRoutes.tsx y agregar ruta `/inicio`
- [x] Tarea 3: Actualizar Logo en AppLayout a ROUTES.landing y agregar botón "Inicio" en header
- [x] Tarea 4: Actualizar PublicLanding, LandingHero, LandingNav, HeroWidgetCard para aceptar `withSession`
- [x] Tarea 5: Verificar A1–A5 en verde y completar §7

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-09 | A1 (typecheck) | ✅ | npm run typecheck [salida: 0 errores] |
| 2026-10-09 | A2 (lint) | ✅ | npm run lint [salida: 0 errores] |
| 2026-10-09 | A3 (tests web) | ✅ | npm test -w apps/web [tests: 1/1 passed] |
| 2026-10-09 | A4 (docs:check) | ✅ | npm run docs:check [ruta nueva /inicio no afecta openapi] |
| 2026-10-09 | A5 (build shared) | ✅ | npm run build -w packages/shared [exitoso] |
| 2026-10-09 | A6 (logo landing) | ✅ | Logo en AppLayout clickeable → `/inicio` (navegación manual) |
| 2026-10-09 | A7 (landing autenticada) | ✅ | `/inicio` sin sesión: botón login visible; con sesión: sin botón login |
| 2026-10-09 | A8 (botón Inicio) | ✅ | Header 1280 px: "Inicio" visible; 375 px: oculto (`hidden md:inline-flex`) |
| 2026-10-09 | A9 (upload condicional) | ✅ | `/inicio` con sesión: no muestra área upload; sin sesión: sí |
| 2026-10-09 | A10 (componentes ≤ 150 líneas) | ✅ | LandingNav: 36 líneas; HeroWidgetCard: 81 líneas; LandingHero: 38 líneas |
