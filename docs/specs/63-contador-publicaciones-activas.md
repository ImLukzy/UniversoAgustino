# Especificación: 63 - Contador de publicaciones activas

## 1. Objetivo
**Problema:** el contador «Publicaciones activas» suma todo lo que tiene `status` `PUBLISHED` (apuntes) o `AVAILABLE` (bazar), aunque esté pausado por el dueño, retirado por el equipo, pendiente de revisión o rechazado. Caso real en producción: un vendedor con un apunte activo y otro pausado ve «Publicaciones activas 2». Pasa en dos sitios:
- `apps/web/src/pages/Publicaciones.tsx:53`, cabecera de Mis publicaciones.
- `apps/web/src/components/panel/usePanelData.ts:25-27` (`pubDocs`, `pubBazar`, `pubsActive`), que alimenta `PanelSummary` («Publicaciones activas» y «N apuntes · M bazar») y `PanelSpaces` («N activas»).

**Resultado esperado:** «activa» significa que un comprador puede verla y comprarla ahora: estado publicado o disponible, revisión aprobada, no pausada y no retirada. Las tres vistas muestran la misma cifra.

## 2. Fuera de alcance
- La API, la base de datos y las reglas de pausa, retiro o revisión, que ya funcionan (specs 45–47).
- Los textos y el diseño de las tarjetas. El único cambio en la cabecera son los números.
- Otros contadores (pedidos, ventas, custodia).

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (aprobada por el humano el 2026-10-13).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/web/src/lib/listingState.ts` | crear | `isActiveListing(item)` para `HubDocument \| HubBazarItem` |
| `apps/web/src/lib/listingState.test.ts` | crear | casos de §4 |
| `apps/web/src/pages/Publicaciones.tsx` | modificar | `stats.active` usa `isActiveListing` |
| `apps/web/src/components/panel/usePanelData.ts` | modificar | `pubDocs`, `pubBazar` y `pubsActive` usan `isActiveListing` |

## 4. Diseño y lógica
`isActiveListing(item, kind)` devuelve `true` solo si se cumplen las cuatro condiciones:
1. `status === "PUBLISHED"` para un apunte, o `status === "AVAILABLE"` para el bazar.
2. No está pausada: ni `item.paused` es `true` ni `item.pausedAt` tiene valor.
3. No está retirada: `item.removed` no es `true`.
4. `reviewStatus` es `"APPROVED"`, o es `undefined`, por compatibilidad con respuestas antiguas que no traían el campo.

Antes de implementar, hay que comprobar en `apps/api/src/modules/documents/listing.ts` y `apps/api/src/modules/bazar/routes.ts` (rutas `/mine`) qué campos devuelve la API (`pausedAt`, `paused`, `removed`, `reviewStatus`) y usar los que vengan de verdad. Si `removed` no viene, se reporta en lugar de inventarlo.

Las tres vistas deben usar la misma función, para que no vuelvan a divergir.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Gate | `npm run verify` | en verde |
| A2 | Unitarios | `listingState.test.ts` | casos activa; pausada (por `pausedAt` y por `paused`); retirada; `PENDING`; `REJECTED`; borrador o vendido (`status` distinto); bazar `AVAILABLE` |
| A3 | Vistas | test de render o del hook: 1 activa + 1 pausada | «Publicaciones activas» = 1 en Mis publicaciones y en el panel |
| A4 | E2E | `npm run e2e:ci` | 7 suites ✓ |

## 6. Checklist de ejecución
- [ ] Tarea 1: confirmar los campos de `/documents/mine` y `/bazar/mine`.
- [ ] Tarea 2: `listingState.ts` y sus tests.
- [ ] Tarea 3: usarlo en `Publicaciones.tsx` y `usePanelData.ts`.
- [ ] Tarea 4: A1–A4.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
