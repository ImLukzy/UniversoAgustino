# Especificación 31b — Recojo con pago y devolución

## 1. Objetivo
Completar PICKUP_SCHEDULED de 31a. Pago al vendedor delante del custodio, con operación o efectivo confirmado; venta RELEASED/SOLD/CLOSED. Alquiler ESCROW/RENTED hasta devolver y revisar; AVAILABLE solo después del retorno físico al vendedor. Base aprobada: [spec31](31-casos-entrega.md).

## 2. Alcance autorizado
Despacho god `2026-10-08T21-44-32-722Z-c6938d`, decisiones `2026-10-08T21-47-01-234Z-12a08a`. Sin chat, correo, sanciones, agenda, cambios al snapshot de fechas/precio ni pagos de PDF. God aplica SQL; Michael no aplica ni hace commit/push.

## 3. Archivos
- Schema y nueva migración `20261008214900_casos_devolucion`: ocho columnas nullable, sin modificar31a aplicada.
- Shared `handover.ts/test`: contratos de pago/revisión y citas RETURN/BACK; `orders.ts`: etiquetas de cancelación del equipo y Report de pedido.
- API cases `pickup.ts`, `returns.ts`, `close.ts`, `fulfillmentGuard.ts`, `fulfillmentRoutes.ts`, `bookingWindow.ts`, `evidence.ts`, `sellerPayment.ts`; cambios appointments/routes/queries/receive.
- Tests `fulfillment.test.ts`, `fulfillmentFixture.ts`, `bookingWindow.test.ts`, `sellerPayment.test.ts`, fixture compartida. Helpers separan autorización/calendario/evidencia/registro para mantener fuentes≤150.
- Web `PickupForm.tsx`, `ReturnForm.tsx`, `CaseFulfillment.tsx`, `SellerPaymentActions.tsx`; ficha, tipos, citas y vista participante. OpenAPI y scanner modular; specs.

## 4. Lógica
- Mutaciones bajo lock300030: releer estado/rol, cita SCHEDULED vigente, canTransition para cada paso Order, auditoría en la transacción, avisos tras commit. Repeticiones rechazan sin nueva entrega, escrow, notificación ni liberación.
- Pickup exige `paymentConfirmed=true`; CASH guarda `efectivo`, OPERATION requiere referencia3–160. Venta ACCEPTED→PAID→ESCROW→RELEASED, ítem SOLD, caso DELIVERED→CLOSED. Alquiler ACCEPTED→PAID→ESCROW, RENTED_OUT/RENTED; RETURN puede adjuntarse al recojo o programarse después, sin bloquearlo por fecha final cerrada.
- RETURN se ofrece desde `rentalEnd` local, en primer día hábil con turno del custodio en la sede de custodia. Ventana de tres días hábiles, guardada en returnWindowStart/returnDeadlineAt al programar. No modifica fechas acordadas. Revisión requiere condición OK/DAMAGED, nota5–500 y confirmación; foto propia interna opcional. Evidencia separada de recepción inicial. Pasa ESCROW→RELEASED y RETURNED; ítem sigue RENTED.
- BACK_TO_SELLER se programa después de revisar devolución o al cancelar físicamente un trato en custodia. Ancla fija: segunda ausencia de PICKUP o returnedAt; para retorno asistido antes de ausencia, solicitud de retorno. Tres días hábiles siguientes. Cancela PICKUP pendiente, conserva reserva/RENTED; solo al confirmar retorno físico AVAILABLE/CLOSED. Pedido sin recojo ACCEPTED→CANCELLED; alquiler conserva RELEASED.
- NO_SHOW requiere instante posterior al fin. Una reprogramación por caso/tipo conserva ventana/ancla. RETURN agotado queda para revisión del equipo, sin RELEASED ni sanciones automáticas; PICKUP agotado ofrece devolver al vendedor.
- Aviso al vendedor incluye monto y operación/efectivo. Confirmar cobro registra sellerConfirmedAt y auditoría; No recibí el pago crea Report targetType=order/targetId=orderId, con deduplicación de OPEN. Solo vendedor propio, pago ya certificado; nunca alteran Order ni bloquean entrega.
- Endpoints nuevos: POST staff/cases/:id/{pickup,return,back-to-seller}; POST cases/order/:orderId/{confirm-payment,payment-report}. Citas/slots existentes amplían tipos RETURN/BACK. Participantes ven evidencia de devolución y pago propio; terceros no reciben datos.

## 5. Criterios
A1 tipos raíz; A2 lint/any-budget0; A3 suite completa con≥15 nuevos; A4 OpenAPI/negativa; A5 fuentes≤150; A7 móvil375 sin scroll; A8 JS inicial<170KB gzip/Equipo<25KB; A10 axe formularios; A11b venta/renta/retorno/noShows/confirmaciónReport; A11d PDF intacto. SQL dev/migraciones prod por god.

## 6. Checklist
- [x] Recojo, certificación y transiciones de venta/alquiler.
- [x] Citas RETURN/BACK, revisión separada y liberación física segura.
- [x] Confirmación del vendedor y reporte sin nuevo paso financiero.
- [x] Gates completos/dev/auditoría y evidencia final.

## 7. Evidencia
SQL aditivo aplicado en dev y Prisma regenerado por god (mensaje2026-10-08T21-49-13-247Z-d2ee87). No backfill ni edición de migraciones aplicadas. Local provisional API278 sin access.test.ts (puerto restringido), shared71; tipos raíz verdes. 29 testsAPI y6shared nuevos respecto31a. Esperado full API288/web80/shared71=439; Cierre final de god: Kelly APTO y E2E completo, confirmado en 2026-10-08T22-08-11-859Z-c79b0c.

Gates locales adicionales: web80/shared71, lint producto0/0 excluyendo hive y worktrees (checkout temporal specs32–34 apareció bajo raíz y no pertenece a esta entrega), any-budget0, docs84+negativa virtual pickup exit1, build raíz verde; JS entrada+preloads164.53KB gzip, Equipo9.95KB. No dependencias nuevas. Fuentes tocadas≤149. Gates completos y dev solicitados a god (`31b-dev-gates.json`).

Entrega cerrada por god en commit local9b1db0a, después de31a383fde1. Sin push; migraciones productivas pendientes de aprobación humana. No se inicia31b adicional ni specs32–34 desde esta sesión.
