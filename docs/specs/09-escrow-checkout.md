# Especificación: 09 - Checkout Escrow (Yape / Plin + Voucher)

## 1. Objetivo y Contexto
**Descripción:** `pages/Checkout.tsx` (396 líneas al redactar; hoy 133) en `/checkout/:id` gestiona el pago manual de un `Order`. El flujo funciona, pero la UI está sobrecargada y el estado de custodia (escrow) no se entiende a primera vista.
**Objetivo técnico:** Construir un checkout hiper-limpio de una sola columna que guíe al comprador en tres pasos:
1. Ver el resumen.
2. Pagar por Yape/Plin escaneando el QR del vendedor.
3. Declarar la constancia (n.º de operación y/o voucher).

El pedido pasa entonces a custodia.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Layout:** `max-w-md` centrado, `bg-white` y bordes `zinc-100`.
- **Bloques:**
  1. **Resumen:** `itemTitle` en snapshot, `Precio` y `Total`. La comisión es informativa y la asume el vendedor.
  2. **Pagar:**
     - Tabs `Yape | Plin` según el `payMethod` del pedido.
     - QR grande (`payQrUrl`) y `payDetail` copiable con toast "Copiado".
  3. **Constancia:**
     - Input del n.º de operación y dropzone opcional para la captura del voucher.
     - Botón primario `bg-primary` "Ya pagué".
- **Temporizador de reserva:** chip `Reservado · 24:13` con el TTL restante (`expiresAt`). En rojo suave cuando quedan menos de 5 min. Al llegar a 0, estado "Reserva expirada" con CTA para volver.
- **Timeline de estado:** `Pendiente → Pagado → En custodia → Liberado`, con el paso activo en el color de la carrera. `Aceptado` solo aparece en el alquiler de bazar.
- **Motion:** cambio de bloque con spring 400/30 y el check final con escala.

## 3. Arquitectura y Lógica de Negocio
- **API existente** (`orders/routes.ts`, dividido en `create`, `queries`, `sellerSteps`, `buyerSteps`, `closeSteps`):
  - `GET /orders/:id`.
  - `POST /orders/:id/pay`: el comprador declara `payProof` y el pedido pasa a `PAID`.
  - `POST /orders/:id/confirm-payment`: el vendedor confirma → `ESCROW`, crea `Escrow`.
  - `POST /orders/:id/confirm-receipt` → `RELEASED`, marca `Escrow.releasedAt`.
  - `POST /orders/:id/cancel` exige `cancelledReason`.
- **Máquina de estados:**
  - 7 estados (`PENDING`, `ACCEPTED`, `PAID`, `ESCROW`, `RELEASED`, `CANCELLED`, `REFUNDED`).
  - Los documentos saltan `ACCEPTED`. Los montos vienen **congelados** en el `Order` (`amountCents/feeCents/netCents`) y la UI nunca los recalcula.
- **Voucher:** la imagen se sube por `POST /uploads` (firma mágica imagen, UUID). Su URL se concatena en `payProof` o, si se aprueba, en un campo nuevo `payProofUrl String?` en `Order` con una migración nueva. Se documenta en `openapi.yaml`.
- **Seguridad:** solo el `buyerId` (desde `req.user.sub`) ve el checkout; el QR se sirve desde `/uploads` y queda registro en `AuditLog` de pagos.
- **Polling:** `refetchInterval` de 30 s mientras el estado sea `PAID`, para reflejar la confirmación del vendedor.
- **Componentes** (`components/checkout/`): `OrderSummary`, `PayMethodPanel`, `ProofForm`, `ReservationTimer` y `StatusTimeline`.

## 4. Checklist de Ejecución
- [x] Tarea 1: Crear `StatusTimeline` (7 estados, rama de alquiler con `ACCEPTED`) coloreado con `primary`.
- [x] Tarea 2: Crear `ReservationTimer` desde `expiresAt`, con el estado expirado y el CTA de retorno.
- [x] Tarea 3: Crear `PayMethodPanel` con tabs Yape/Plin, QR y `payDetail` copiable.
- [x] Tarea 4: Crear `ProofForm` (n.º de operación y voucher opcional vía `POST /uploads`) → `POST /orders/:id/pay`; decidir y, si procede, migrar `payProofUrl`.
- [x] Tarea 5: Recomponer `Checkout.tsx` por debajo de 150 líneas con `OrderSummary` sobre montos congelados (sin recalcular).
- [x] Tarea 6: Activar el polling de 30 s en `PAID`; typecheck, lint, test y `docs:check` en verde.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Implementado.** `components/checkout/` contiene `OrderSummary`, `PayMethodPanel`, `ProofForm`, `ReservationTimer`, `StatusTimeline` y, además, `EscrowStatus`. La migración `20260924090000_order_pay_proof_url` añade `payProofUrl`, ya en `openapi.yaml`. El polling es de 30 s en `PAID` (`Checkout.tsx`).
- **Cambios posteriores.**
  - `confirm-payment` notifica al comprador (`ORDER_PAID`).
  - `refund` solo acepta `PAID`/`ESCROW`.
  - `cancel` valida con `canTransition` y escribe una sola auditoría.
  - Las notificaciones del comprador enlazan a `/checkout/:id`.
- **Aclaración de texto.** El pago va al Yape/Plin del vendedor; "custodia" es un estado del pedido, no un fideicomiso de la plataforma.
