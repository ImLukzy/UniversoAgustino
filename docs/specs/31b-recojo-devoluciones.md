# Especificación 31b — Recojo con pago y devolución

## 1. Objetivo
Completar el caso PICKUP_SCHEDULED de 31a: vendedor cobra delante del custodio; venta termina RELEASED/SOLD/CLOSED. Alquiler queda ESCROW/RENTED hasta devolver y revisar; vuelve AVAILABLE solo tras retorno físico al vendedor.

## 2. Alcance autorizado
Plan aprobado por god en 2026-10-08T21-20-44-548Z-7aa8b2. Ejecución pendiente de despacho posterior; no se implementa en 31a. Contrato, archivos y criterios: [spec 31](31-casos-entrega.md).

## 3. Archivos
`cases/pickup.ts`, `returns.ts`, `close.ts`, `fulfillment.test.ts`; extensiones de routes/shared; `equipo/PickupForm.tsx`, `ReturnForm.tsx` y ficha; OpenAPI y tests de regresión.

## 4. Lógica
Bajo lock300030: custodio/Técnico registra operación3–160 o CASH, comprueba cada transición Order mediante canTransition, completa cita y escribe auditoría en misma transacción. No dinero custodiado por plataforma. RETURN requiere revisión/nota y cierre financiero; BACK_TO_SELLER requiere devolución física antes de liberar inventario. Cancelación con objeto en custodia usa retorno asistido.

## 5. Criterios
Tipos/lint/suite completa con ≥15 nuevos; docs/negativa; fuentes≤150; móvil375; build/budget; axe formularios; A11b venta/alquiler/retorno y concurrencia/idempotencia; PDF sin regresión.

## 6. Checklist
- [ ] Despacho de inicio.
- [ ] Recojo/pago, venta y alquiler.
- [ ] Devolución/retorno/cancelación segura.
- [ ] Gates completos y evidencia.

## 7. Evidencia
Sin implementación ni validación todavía. Estados/modelos futuros existen en migración31a y no se ejecutan.
