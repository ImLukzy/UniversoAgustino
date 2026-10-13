# Especificación: 54 - Liquidación al vendedor en 24 h

## 1. Objetivo
**Problema:** el plazo para liquidar al vendedor es de 48 h en el servidor (`apps/api/src/modules/staff/verifyPayment.ts:33`, `apps/api/src/modules/cases/physicalPayment.ts:27`) y la app promete "24–48 h" en avisos y pantallas (`orders/paymentNotices.ts:18-19`, `components/RentalCard.tsx:44`, `bazar/EscrowSteps.tsx:10`, `checkout/EscrowStatus.tsx:12,41`, `checkout/OrderSummary.tsx:24`, `detalle/BuyPanel.tsx:59`, `equipo/CaseCard.tsx:43`).
**Resultado esperado:** el equipo liquida al vendedor **en 24 h** desde que se verifica el pago (digital) o se cobra en sede (físico). El vencimiento (`dueAt`) y todos los textos dicen 24 h.

## 2. Fuera de alcance
- Otros plazos de 48 h que no son la liquidación: respuesta del vendedor a una solicitud del bazar (`BAZAR_REQUEST_TTL_HOURS`, `EscrowSteps.tsx:7`, `BuyPanel.tsx:62`) y atención de reportes D.L. 822 (`BuyPanel.tsx:63`). No se cambian.
- Liquidaciones ya creadas: conservan su `dueAt` (sin migración ni backfill).
- La ventana del recordatorio previo al vencimiento (`payouts/reminders.ts`, 6 h antes) no cambia.

**Decisiones de producto:** aprobada por el humano 2026-10-13 ("déjalo en 24 horas").

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `packages/shared/src/` (archivo de precios/pagos existente) | modificar | constante `PAYOUT_SLA_HOURS = 24` exportada |
| `apps/api/src/modules/staff/verifyPayment.ts`, `apps/api/src/modules/cases/physicalPayment.ts` | modificar | `dueAt = now + PAYOUT_SLA_HOURS h` |
| `apps/api/src/modules/orders/paymentNotices.ts` | modificar | "recibirás el neto en 24 h" / "liquida dentro de 24 h" usando la constante |
| web: `RentalCard.tsx`, `bazar/EscrowSteps.tsx` (solo el paso Liquidación), `checkout/EscrowStatus.tsx`, `checkout/OrderSummary.tsx`, `detalle/BuyPanel.tsx` (solo la línea de liquidación), `equipo/CaseCard.tsx` | modificar | "en 24 h" (usar la constante compartida cuando sea texto dinámico) |
| tests existentes que comprueben 48 h o "24–48 h" de la liquidación | modificar | a 24 h; añadir un test de `dueAt` = +24 h en digital y físico |
| `docs/PROJECT_CONTEXT.md`, `docs/payments.md`, `docs/rfc/0003-…` NO (histórico) | modificar | solo los docs vivos |
| `apps/api/docs/openapi.yaml` | modificar | si menciona el plazo |

## 4. Diseño y lógica
- Una sola fuente: `PAYOUT_SLA_HOURS` en `packages/shared`. Ningún `48` ni "24–48" de liquidación queda en el código (`git grep` lo comprueba).
- Texto uniforme: "en 24 h".

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | Sin restos | `git grep -nE "24.?48 h|24–48" apps packages` | 0 resultados de liquidación |
| A3 | `dueAt` | tests: verificar pago digital y cobro en sede crean payout con `dueAt` = ahora + 24 h | pasan |
| A4 | E2E | `npm run e2e` (incluye pagos) | ✓ |

## 6. Checklist de ejecución
- [ ] Tarea 1: constante, servidor, avisos, web, docs, tests.
- [ ] Tarea 2: verificar A1–A4 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
