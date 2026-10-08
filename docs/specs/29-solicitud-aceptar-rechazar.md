# Especificación: 29 - Solicitud de compra/alquiler con aceptar o rechazar del vendedor

Diseño: `docs/rfc/0002-entregas-mediadas-equipo.md` §3 (primer tramo del flujo).

## 1. Objetivo
**Problema:** en el bazar la venta queda pagable al instante (`buyerSteps.ts:38`); solo el alquiler exige aceptación (`sellerSteps.ts:23-25` bloquea `NOT_RENTAL`). No hay rechazo con motivo (solo `cancel`, `closeSteps.ts:15-42`) y la reserva vence en 30 min (`reservation.ts:5-8`), muy poco para que el vendedor responda.
**Resultado esperado:** comprar **o** alquilar un artículo del bazar crea una **solicitud** que el vendedor acepta o rechaza (con motivo) en 48 h; el comprador recibe aviso en ambos casos y, si vence, el producto se libera. Los apuntes PDF no cambian. Nada del flujo actual se rompe: tras aceptar, el paso de pago existente sigue funcionando hasta que la spec 31 lo reemplace por el recojo en sede.

## 2. Fuera de alcance
- Casos de entrega, sedes, citas (specs 30–31). Pago en sede (31).
- Documentos digitales: su TTL (30 min) y flujo quedan igual.
- Migraciones: ninguna (usa `Order`, `canTransition`; motivo en `cancelledReason`).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/src/modules/orders/reservation.ts:5-8` | modificar | TTL por tipo: documento `RESERVATION_TTL_MINUTES` (30), bazar `BAZAR_REQUEST_TTL_HOURS` (48) |
| `apps/api/src/env.ts` | modificar | `BAZAR_REQUEST_TTL_HOURS` (int > 0, defecto 48) |
| `apps/api/src/modules/orders/create.ts:46-73` | modificar | bazar (venta y alquiler) nace `PENDING` con TTL de bazar; aviso `ORDER_CREATED` al vendedor "Nueva solicitud" |
| `apps/api/src/modules/orders/sellerSteps.ts:23-25` | modificar | aceptar también ventas del bazar (documentos siguen 409) |
| `apps/api/src/modules/orders/sellerSteps.ts` (nuevo `POST /:id/reject`) o `rejectStep.ts` | crear | solo vendedor, solo `PENDING`, `{ reason 5–300 }` → `CANCELLED` + `cancelledReason="SELLER_REJECTED: …"`, libera `RESERVED`, aviso al comprador con motivo, AuditLog |
| `apps/api/src/modules/orders/buyerSteps.ts:37-42` | modificar | bazar solo pagable tras `ACCEPTED` (venta y alquiler) |
| `apps/api/src/jobs/expireReservations.ts` | revisar | respeta `expiresAt` por pedido (ya lo hace); test |
| `packages/shared/src/` | modificar | `RejectOrderSchema` |
| tests `orders/*.test.ts` | crear/modificar | ver A3 |
| `apps/web/src/components/…/BuyPanel.tsx:15-16,52-70` | modificar | CTA bazar "Solicitar compra"/"Solicitar alquiler"; texto "El vendedor tiene 48 h para responder" (quitar "30 minutos" para bazar) |
| `apps/web/src/components/…/SaleActions.tsx:27-41`, `apps/web/src/pages/Ventas.tsx:64-76` | modificar | "Aceptar" / "Rechazar" con motivo obligatorio (diálogo) para venta y alquiler; plazo restante visible |
| `apps/web/src/pages/Pedidos.tsx` (+ componentes) | modificar | estado "Esperando respuesta del vendedor (vence …)", "Rechazada: <motivo>" |
| `apps/api/docs/openapi.yaml` | modificar | `POST /orders/{id}/reject` |

## 4. Reglas
- Todas las transiciones vía `canTransition` (`PENDING→ACCEPTED`, `PENDING→CANCELLED`).
- No se puede solicitar algo propio, no aprobado (spec 27) o no `AVAILABLE` (ya existe).
- Rechazar ≠ cancelar: el comprador puede cancelar su solicitud `PENDING` como hoy.
- Idempotencia: aceptar/rechazar dos veces → `409 BAD_STATE`.

## 5. Criterios de aceptación
| # | Criterio | Cómo | Umbral |
|---|---|---|---|
| A1–A4 | gates | | verdes; tests: venta bazar nace PENDING con TTL 48 h y no es pagable; vendedor acepta venta → pagable; rechazo exige motivo, libera producto y notifica; tercero/ comprador no puede rechazar (403); rechazo fuera de PENDING 409; documentos siguen pagables con TTL 30 min |
| A5 | Tamaño | ≤ 150 (exento openapi) | |
| A7 | Scroll 375 px | `/ventas`, `/pedidos`, detalle bazar | 0 px |
| A11 | E2E (god, BD dev) | A solicita compra → B ve solicitud y la rechaza con motivo → A ve motivo; A solicita de nuevo → B acepta → A ve "Aceptada" | pasa |

## 6. Checklist
- [ ] TTL por tipo · [ ] aceptar venta + rechazar · [ ] pagable solo tras aceptar · [ ] UI comprador/vendedor · [ ] Gates y §7

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
