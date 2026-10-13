# Especificación: 55 - Pruebas E2E del cobro físico en sede

## 1. Objetivo
**Problema:** las pruebas E2E cubren pagos digitales y reembolso (spec 51) pero no el flujo físico de las specs 31b/39: solicitud de un artículo del bazar, aceptación del vendedor, caso de entrega en sede con citas, cobro al comprador por el equipo con comprobante (o efectivo), entrega y liquidación al vendedor.
**Resultado esperado:** `npm run e2e` (local y CI) incluye el flujo físico completo sobre datos `qa-*`.

## 2. Fuera de alcance
- Cambiar código de la app o de la API (si un caso falla por un bug real: no se toca, se reporta).
- Datos reales: solo `qa-*` y la cuenta de cobro ficticia (QA Cuenta, 900000000).

**Decisiones de producto:** aprobadas por el humano 2026-10-13.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `scripts/qa-seed.mjs` | modificar | si hace falta: artículo de bazar físico de `qa-vendedor` y sede/horario/turno QA para agendar citas; idempotente; no tocar el guard de URL |
| `tests/e2e/sede-*.mjs` | crear | flujo físico (ver §4), < 150 líneas por archivo |
| `tests/e2e/run.mjs`, `tests/e2e/README.md` | modificar | incluir el flujo |

## 4. Diseño y lógica (casos)
1. qa-est solicita el artículo físico → qa-vendedor acepta.
2. Caso de entrega: se agenda la entrega del vendedor en sede (cita dentro del horario QA) y el trabajador registra la recepción (custodia).
3. Recojo del comprador: cita de recojo; el trabajador cobra en sede a la cuenta del equipo con comprobante (y, si existe, también el camino "efectivo") y entrega el artículo.
4. Se crea la liquidación al vendedor por el neto (13 %); el trabajador la paga con comprobante → "Mis cobros" del vendedor la muestra pagada.
5. Ausencia: una cita del vendedor marcada como ausencia registra la falta (strike) y notifica; restaurar/perdonar al final para no dejar sanciones.
6. Limpieza total en `finally` (pedidos, casos, citas, payouts, strikes, notificaciones de prueba).

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | E2E local | servidores locales contra BD dev + `qa:seed` + `npm run e2e` dos veces | todos ✓ |
| A3 | E2E en CI | `CI=true npm run e2e:ci` con Postgres local, o el job `e2e` tras integrar | ✓ |

## 6. Checklist de ejecución
- [x] Tarea 1: seed (si hace falta) + flujo físico + README.
- [x] Tarea 2: verificar A1–A3 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A1–A3 | OK: verify ✓; qa:seed ×2; `npm run e2e` ×2 con todas las suites ✓; `CI=true npm run e2e:ci` con Postgres 16 local ✓; sin bugs de app | Dwight 87726f0 |
| 2026-10-13 | Auditoría | OK con observaciones (Kelly): alcance de borrado del seed, sede QA visible, riesgo 429 → corregidos en 4a23983 (solo pedidos QA↔QA o fixtures qa-e2e-*, sede "QA E2E (pruebas, no usar)", logins por corrida 27→15); revisado por Claudio | Kelly + Dwight |
