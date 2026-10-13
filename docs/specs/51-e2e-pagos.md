# Especificación: 51 - Pruebas E2E del flujo de pagos

## 1. Objetivo
**Problema:** el flujo de dinero (specs 36–40: cuentas de cobro del equipo, pago con comprobante obligatorio, verificación por el trabajador, liquidación al vendedor con comprobante, "Mis cobros", reembolso tras reclamo) solo tiene tests unitarios. Es lo más delicado de la app y no tiene pruebas de navegador.
**Resultado esperado:** `npm run e2e` incluye los flujos de pago sobre datos `qa-*`, verificando lo que ve cada rol y que el dinero y los accesos quedan correctos.

## 2. Fuera de alcance
- Cambiar código de la app o de la API (si un caso falla por un bug real: no se toca, se reporta).
- El cobro físico en sede (spec 39) y las citas: queda para otra spec si se quiere.
- CI (spec 52).

**Decisiones de producto:** aprobadas por el humano 2026-10-12. Las cuentas de cobro de QA usan datos ficticios (titular "QA Cuenta", número 900000000); nunca datos reales.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `scripts/qa-seed.mjs` | modificar | añade una cuenta de cobro del equipo ficticia (activa) y deja la publicación de pago de `qa-vendedor` lista para comprar; sigue idempotente; NO toques el bloque de protección de URL del inicio (lo modifica la spec 52) |
| `tests/e2e/pagos-digital.mjs` (y más archivos si pasa de 150 líneas) | crear | ver §4 |
| `tests/e2e/run.mjs` | modificar | incluir los nuevos flujos |
| `tests/e2e/fixtures/` | crear | imagen pequeña de comprobante generada (PNG) para subir |
| `tests/e2e/README.md` | modificar | mencionar los flujos de pago |

## 4. Diseño y lógica (casos)
1. **Pago digital aceptado:** qa-est compra el apunte de pago de qa-vendedor → elige la cuenta del equipo QA → sin foto no puede enviar → sube comprobante → el pedido queda en verificación. qa-mod en "Pagos por verificar" ve producto, comprador, monto, cuenta y foto → Acepta → qa-est puede abrir y descargar el apunte. Se crea la liquidación pendiente por el neto (precio − 13 % vía la regla existente).
2. **Pago denegado:** otro intento → qa-mod Deniega con motivo → qa-est ve el motivo y puede reenviar el comprobante.
3. **Liquidación al vendedor:** qa-mod en "Pagos a vendedores" ve el monto neto y sube su comprobante → pasa a "Completas" → qa-vendedor en "Mis cobros" ve precio, comisión, neto, estado pagado y el comprobante.
4. **Reembolso tras reclamo (spec 40):** con un pago aceptado y liquidación pendiente, qa-est reclama → la liquidación se congela → el técnico reembolsa con su comprobante → el acceso de qa-est se revoca (descarga 403) y Ganancias excluye ese pedido.
5. **Notificaciones:** en cada paso clave el comprador y el vendedor reciben la notificación esperada (consultar `GET /notifications` de cada uno).
6. **Limpieza:** al final no quedan pedidos, liquidaciones ni accesos de prueba abiertos; si la API no permite borrar algo, dejarlo en estado final cerrado y documentarlo en el README.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | E2E | servidores locales contra BD dev + `npm run qa:seed` + `npm run e2e` | todos ✓ (45, 46 y pagos) |
| A3 | Idempotencia | correr `npm run e2e` dos veces seguidas | ambas ✓ |
| A4 | Tamaño | archivos < 150 líneas | OK |

## 6. Checklist de ejecución
- [x] Tarea 1: seed + fixture + flujos de pago + README.
- [x] Tarea 2: verificar A1–A4 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A1–A4 | OK: verify ✓; `npm run e2e` dos veces seguidas con specs 45, 46 y pagos ✓ (montos 1500/195/1305; denegación y reenvío; aceptación con descarga; liquidación y Mis cobros; reclamo, reembolso y acceso revocado; notificaciones); limpieza sin residuos; sin bugs de app | Michael 85d132f contra BD dev |
| 2026-10-13 | Auditoría | OK sin hallazgos | Kelly |
