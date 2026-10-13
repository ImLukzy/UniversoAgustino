# Especificación: 49 - Reportar desde la publicación (sin escribir IDs)

## 1. Objetivo
**Problema:** `apps/web/src/components/ventas/ReportsCenter.tsx` (en `/ventas`, `pages/Ventas.tsx`) obliga a escribir a mano el tipo y el ID de lo que se reporta. Desde la spec 46 los pedidos tienen "Reportar al vendedor", pero una publicación (apunte o artículo del bazar) solo se puede reportar con ese formulario de IDs.
**Resultado esperado:** en el detalle de cualquier publicación (`/p/:type/:id`) un usuario con sesión, que no sea el dueño, tiene "Reportar publicación" con motivo. "Mis reportes" deja de pedir IDs: solo lista los reportes enviados y su estado.

## 2. Fuera de alcance
- API: `POST /reports` ya acepta `targetType` document|bazar, `category` y `reason` (spec 46); no se cambia.
- Panel del equipo, Denuncias, "Reportar al vendedor" de `/pedidos`.

**Decisiones de producto:** aprobadas por el humano 2026-10-12 (mejora "Mis reportes"). Categorías para publicaciones: "No es lo anunciado" `NOT_AS_DESCRIBED`, "Contenido inapropiado o copiado" `OTHER` con detalle, "Otro" `OTHER`. Si se prefiere una categoría nueva, sería otra spec (requiere cambio de API).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/components/detalle/ReportListingForm.tsx` | crear | categoría + detalle (10–2000), `POST /reports { targetType, targetId, category, reason }`, sin doble envío, éxito/error |
| `apps/web/src/components/detalle/BuyPanel.tsx` (o `pages/Detalle.tsx` si encaja mejor) | modificar | enlace/botón "Reportar publicación" que abre el formulario; oculto para el dueño y sin sesión (sin sesión: invita a iniciar sesión) |
| `apps/web/src/components/ventas/ReportsCenter.tsx` | modificar | quitar el formulario de tipo + ID; conservar la lista y filtros; texto que explique dónde reportar (en la publicación o en el pedido) |
| tests en `apps/web/src/**` | crear | botón visible solo a no dueños con sesión; formulario con categorías y labels; ReportsCenter sin campos de ID |

## 4. Diseño y lógica
- Reutilizar el patrón de `components/orders/ReportSellerForm.tsx` (fieldset/legend, label, contador sin aria-live, apiError, busy). Si conviene, extraer un componente común; sin duplicar lógica.
- UI estricta de CLAUDE.md; componentes < 150 líneas; 0 px de scroll a 375 px.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | Tests nuevos | ver §3 | pasan |
| A7/A10 | `/p/document/<id>` y `/ventas` a 375 px y 1280 px | scroll 0 px; axe 0 serias/críticas | OK |
| A11 | E2E: usuario no dueño reporta un apunte desde su detalle → aparece en `/panel/denuncias` con la publicación; el dueño no ve el botón | QA | pasa |

## 6. Checklist de ejecución
- [ ] Tarea 1: formulario + botón en detalle + ReportsCenter sin IDs + tests.
- [ ] Tarea 2: verificar A1–A11 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
