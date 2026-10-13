# Especificación: 61 - Página 404 para rutas inexistentes

## 1. Objetivo
**Problema:** `apps/web/src/app/AppRoutes.tsx` no tiene ruta comodín (`*`). Una dirección que no existe, como un enlace mal escrito o uno antiguo, muestra una página **en blanco**, también en producción. El panel del equipo ya trata sus secciones inexistentes («Sección no disponible»), pero el resto de la web no.
**Resultado esperado:** cualquier ruta que no exista muestra, dentro del layout normal, una página clara: «Esta página no existe», una frase de ayuda y botones para volver a Inicio y para ir a Explorar.

## 2. Fuera de alcance
- Cambiar rutas existentes, redirecciones o el comportamiento de `/panel/*`, que ya tiene su propio aviso.
- Configurar el servidor (Vercel) para devolver el código HTTP 404: la SPA responde 200 y eso no cambia aquí.
- Textos legales u otras páginas.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (aprobada por el humano el 2026-10-13).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/pages/NotFound.tsx` | crear | < 150 líneas; usa `EmptyState` y `AppLayout` |
| `apps/web/src/app/AppRoutes.tsx` | modificar | `<Route path="*" element={<NotFound />} />` al final, cargado como las demás páginas (lazy si las demás lo son) |
| `apps/web/src/pages/NotFound.test.tsx` | crear | render estático: título, enlaces a Inicio y Explorar |
| `tests/e2e/landing.mjs` | modificar | añadir la comprobación de una ruta inexistente a 1440 y 375 px |
| subset de iconos | modificar si el icono es nuevo | `node scripts/subset-icons.mjs --write` y `--check` |

## 4. Diseño y lógica
- **UI:** `EmptyState` con un icono de búsqueda sin resultados (por ejemplo `search_off`) y estos textos exactos:
  - Título: «Esta página no existe».
  - Ayuda: «Puede que el enlace esté mal escrito o que la página se haya movido.»
  - Acciones: botón principal «Ir al inicio», a la ruta raíz `/`, y botón secundario «Explorar apuntes», a `/explorar`, con las clases `.btn-*` del sistema.
- **Accesibilidad:** el título va en `<h1>`, `document.title` es «Página no encontrada · Universo Agustino», y axe no debe dar violaciones.
- **CLS = 0:** a 375 px no puede haber scroll horizontal.
- **Sin cambios de sesión:** la página funciona igual con sesión y sin ella, y no hace llamadas a la API propias.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Gate | `npm run verify` | en verde |
| A2 | Test unitario | `NotFound.test.tsx` | título y los dos enlaces (`href="/"` y `href="/explorar"`) |
| A3 | E2E | `npm run e2e:ci`: `landing.mjs` comprueba que `/esta-ruta-no-existe` muestra el h1 «Esta página no existe» a 1440 y 375 px, sin scroll horizontal y con axe en 0 | 7 suites ✓ |
| A4 | Rutas existentes intactas | E2E completa + `/panel/inexistente` sigue mostrando «Sección no disponible» | sin cambios |
| A5 | Tamaño | `wc -l` de los archivos nuevos | < 150 |

## 6. Checklist de ejecución
- [x] Tarea 1: `NotFound.tsx` + test.
- [x] Tarea 2: ruta comodín en `AppRoutes.tsx`.
- [x] Tarea 3: E2E en `landing.mjs` e iconos si hace falta.
- [x] Tarea 4: A1–A5.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A1 | ✅ | `npm run verify` en verde (Michael bdd40f8 y Claudio tras integrar) |
| 2026-10-13 | A2 | ✅ | `apps/web/src/app/NotFound.test.tsx`: h1, textos exactos, `href="/"` y `href="/explorar"` |
| 2026-10-13 | A3 | ✅ | `npm run e2e:ci`: `landing.mjs` comprueba `/esta-ruta-no-existe` a 1440 y 375 px (h1, sin scroll horizontal, axe 0); 7 suites ✓. Capturas `/tmp/spec61-notfound-{1440,375}.png` |
| 2026-10-13 | A4 | ✅ | Rutas existentes intactas (E2E completa); `/panel/*` sin cambios (TeamPanel no se tocó) |
| 2026-10-13 | A5 | ✅ | `NotFound.tsx` 35 líneas; `EmptyState` acepta `titleAs` (por defecto `p`, sin cambios para el resto de usos) |
| 2026-10-13 | Revisión | ✅ | Cambio de UI sin lógica: revisado por Claudio (práctica acordada), sin auditoría de Kelly |
