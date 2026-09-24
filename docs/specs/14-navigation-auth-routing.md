# Especificación: 14 - Navegación: `?career=`, Retorno tras Login y Rutas de Auth

> Spec retroactiva: documenta lo implementado en el refactor de septiembre 2026.

## 1. Objetivo
**Problema:**
- `/explorar` ignoraba los parámetros de la URL y los enlaces de carrera no filtraban nada.
- Tras iniciar sesión (sobre todo por OAuth) el usuario volvía siempre al inicio.
- `/login` y `/register` eran páginas sueltas.
- El buscador del encabezado, el Enter del Home y las notificaciones no navegaban.

**Resultado:**
- El estado del catálogo vive en la URL y los enlaces se pueden compartir.
- El usuario regresa a la página donde estaba.
- La autenticación siempre ocurre en el modal global.

## 2. Fuera de alcance
- Reglas de dominio `@unsa.edu.pe` (spec 01) y diseño del modal (spec 10).
- Filtro por carrera en el API: `GET /documents` ya acepta `career`; el bazar no se filtra por carrera.
- Pestañas del panel con `?tab=` (spec 11, decisión pendiente).

## 3. Archivos afectados
| Archivo | Acción |
|---|---|
| `apps/web/src/lib/useExploreParams.ts` | creado |
| `apps/web/src/lib/authRedirect.ts` | creado (`safeReturnPath`, `rememberReturnTo`, `takeReturnTo`) |
| `apps/web/src/app/AppRoutes.tsx` | creado (`LoginOpener`, `RootRoute`, rutas lazy) |
| `apps/web/src/app/ScrollToTop.tsx` | creado |
| `apps/web/src/lib/routes.ts` | mapa de rutas (`ROUTES`) |
| `apps/web/src/pages/Explorar.tsx`, `components/marketplace/CareerFilter.tsx` | `/explorar` + filtro visible |
| `apps/web/src/pages/AuthCallback.tsx` | `refreshMe()` + retorno + mensaje `STATE_INVALIDO` |
| `apps/web/src/components/auth/LoginRequired.tsx`, `detalle/useDetail.ts` | abren el modal en la misma página |
| `apps/web/src/components/AppLayout.tsx`, `home/StudocuHero.tsx`, `landing/HeroWidgetCard.tsx`, `pages/Notificaciones.tsx` | búsqueda y clics que navegan |
| `apps/web/src/components/AppFooter.tsx`, landing, `pages/Perfil.tsx` | enlaces `/explorar?career=<KEY>` |
| `apps/web/src/pages/Login.tsx`, `pages/Register.tsx` | eliminados |
| `apps/api/src/modules/auth/oauth/session.ts` | `state` obligatorio en el callback OAuth |

## 4. Lógica
- **`/explorar?q=&f=&career=`** (`useExploreParams`):
  - `f` ∈ `all | docs | free | bazar`; `career` ∈ claves de `UNSA_CAREERS` o `all`. Los valores inválidos se ignoran.
  - La URL manda: al llegar, o al navegar atrás/adelante, `career` se aplica al tema global (`setCareer`, spec 05) y filtra el catálogo.
  - Los cambios desde la UI reescriben la URL con `replace: true`. Los valores por defecto (`q` vacío, `f=all`, `career=all`) no se escriben.
  - La búsqueda aplica un debounce de 300 ms antes de la consulta.
- **Retorno tras login:**
  - Con el modal por correo no hay salto de página: el usuario se queda donde estaba.
  - Para OAuth, `rememberReturnTo()` guarda la ruta en `sessionStorage['hub_return_to']`; `AuthCallback` llama a `refreshMe()` y navega a `takeReturnTo()`.
  - `safeReturnPath` solo acepta rutas internas: empiezan por `/`, no por `//`, y nunca `/login`, `/register`, `/auth/*`, `/forgot-password` ni `/reset-password`. Así evita redirecciones abiertas.
- **Rutas de auth:** `/login?next=<ruta>` y `/register` montan `LoginOpener`, que abre el modal y navega (con `replace`) a `next` validado, o a `/`.
- **`/`:** `RootRoute` muestra `PublicLanding` sin sesión y el catálogo con sesión. `/explorar` es público para todos.
- **OAuth:** si falta el `state` o no es válido → `STATE_INVALIDO`, con mensaje en español en `AuthCallback`.

## 5. Criterios de aceptación
| # | Criterio | Verificación | Estado |
|---|---|---|---|
| A1 | `/explorar?career=MEDICINA` filtra y recolorea | abrir la URL → chip de Medicina activo, `--hub-p` = acento de Medicina, listado filtrado | ✅ (código; sin prueba E2E) |
| A2 | Parámetros inválidos ignorados | `/explorar?career=XXX&f=zzz` → estado por defecto, sin error | ✅ (código) |
| A3 | Sin redirección abierta | `/login?next=//evil.com` y `?next=https://x` → navega a `/` | ✅ (código) |
| A4 | Retorno OAuth | iniciar OAuth desde `/v/:id` → tras el callback vuelve a `/v/:id` | ⚠️ requiere credenciales OAuth (sin probar E2E) |
| A5 | Compra sin sesión | clic en "Comprar" en `/p/document/:id` → modal abierto, URL sin cambios | ✅ |
| A6 | Tests unitarios de `safeReturnPath` | test en `lib/authRedirect.test.ts` | ❌ no existe (spec 15) |
| A7 | typecheck / lint / test | `npm run typecheck && npm run lint && npm test` | ⚠️ último lote sin reverificar (spec 15, T1) |

## 6. Checklist de ejecución
- [x] Tarea 1: Crear `useExploreParams` con sincronización bidireccional de `q`, `f` y `career`, y aplicar la carrera al tema global.
- [x] Tarea 2: Añadir `CareerFilter` visible en `/explorar` y enlazar las carreras de landing, footer y perfil a `/explorar?career=`.
- [x] Tarea 3: Hacer que el buscador del encabezado, el Enter del Home y los clics de Notificaciones naveguen.
- [x] Tarea 4: Crear `authRedirect.ts` (`safeReturnPath`, `remember`/`take`) y conectarlo a OAuth y a `AuthCallback` (`refreshMe()`).
- [x] Tarea 5: `/login?next=` y `/register` → `LoginOpener`; eliminar `pages/Login.tsx` y `pages/Register.tsx`.
- [x] Tarea 6: `LoginRequired` y "Comprar" sin sesión abren el modal en la misma página.
- [x] Tarea 7: Exigir el `state` en el callback OAuth (`STATE_INVALIDO`).
- [x] Tarea 8: Tests unitarios de `safeReturnPath` y de `useExploreParams`; E2E del retorno OAuth (trasladado a la spec 15). *Unitarios hechos en la spec 15 (T8): `authRedirect.test.ts` (6) y `useExploreParams.test.ts` (5). El E2E del retorno OAuth no se hizo: necesita un proveedor Google/Apple real.*
