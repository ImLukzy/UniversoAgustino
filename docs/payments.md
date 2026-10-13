# Pagos y liquidaciones

El sistema usa mediación del equipo conforme a RFC 0003 y specs 36–40. La comisión predeterminada es **13 % a cargo del vendedor**; el comprador paga el importe publicado y el neto del vendedor se calcula con `computePrice()`/`PLATFORM_FEE_PCT`. Cada pedido conserva el snapshot de importe, comisión y neto.

## Pago digital

1. El comprador crea el pedido y consulta las cuentas habilitadas del equipo.
2. Transfiere a una cuenta del equipo y registra el comprobante en el pedido.
3. Un trabajador verifica el comprobante y acepta o deniega el pago. La declaración del comprador por sí sola no da acceso.
4. Al verificarlo, el pedido avanza a custodia (`ESCROW`); el comprador obtiene acceso al archivo digital cuando corresponde.
5. Tras completar la entrega/operación, el equipo liquida al vendedor el neto y registra el comprobante de liquidación.

La confirmación de pago por el vendedor no ejecuta la verificación del equipo. Los pedidos de bazar pueden continuar por el flujo de casos y entrega aplicable.

## Cobro físico en sede

Para el flujo físico, el comprador paga en una sede al trabajador, entrega el comprobante y el equipo registra/verifica el cobro. El pedido y la entrega se gestionan mediante el caso de custodia; las acciones de recojo, devolución, ausencia y liquidación siguen los permisos y transiciones del sistema.

## Reembolsos

Los reembolsos se ejecutan desde el flujo de payouts y requieren autorización técnica, comprobante y registro del resultado. La ruta antigua de refund de pedido está restringida y no representa por sí sola una devolución efectiva; consulta OpenAPI y el panel del equipo para la operación vigente.

## Mercado Pago

Los endpoints de configuración, checkout y webhook existen, pero la mediación `TEAM_MEDIATION` mantiene el checkout deshabilitado y el webhook no procesa pagos. Configurar credenciales no activa la pasarela. No uses este flujo para cobros reales hasta que el código y la especificación operativa indiquen que fue habilitado.

## Contrato y pruebas

Rutas, esquemas, estados y roles están en [`apps/api/docs/openapi.yaml`](../apps/api/docs/openapi.yaml). La suite E2E de pagos se describe en [`tests/e2e/README.md`](../tests/e2e/README.md); no se deben introducir credenciales reales en fixtures o documentación.
