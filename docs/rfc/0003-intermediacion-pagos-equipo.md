# RFC 0003 — El equipo como intermediario de pagos (comisión 13 %)

Estado: **pedido del humano 2026-10-08**. Reemplaza las decisiones D2 y D3 del RFC 0002 y la spec 35 (0 %). Fuente de verdad para las specs 36–39.

## 1. Qué cambia
Hasta hoy el comprador pagaba directo al vendedor y el equipo nunca tocaba dinero. Ahora **el equipo cobra al comprador, verifica el pago, entrega el producto y luego liquida al vendedor el 87 %**. La plataforma gana el 13 %.

## 2. Decisiones (humano)
| # | Decisión |
|---|---|
| E1 | Comisión **13 %**, **la asume el vendedor**: el comprador paga el precio publicado; el vendedor recibe el 87 %. Vía `computePrice()` + `PLATFORM_FEE_PCT=13` (ya descuenta del vendedor). |
| E2 | Liquidación al vendedor **en 24–48 h** desde que se atribuye el producto. |
| E3 | **Cuentas de cobro del equipo**: no hay una sola cuenta. Cada trabajador publica la suya (método Yape/Plin/otro, titular, número, foto de perfil y QR). El técnico (admin) tiene una sección para crear, editar, activar y desactivar todas. La cuenta inicial la carga el técnico desde el panel (no se escribe en el repo). |
| E4 | **Comprobante obligatorio**: el comprador elige una cuenta del equipo, paga y **debe subir la foto del comprobante** (y el n.º de operación si lo tiene). Sin foto no se envía. |
| E5 | **Atribución manual**: el pedido aparece en el panel del trabajador, pestaña **Pagos por verificar**, con producto, detalles, comprador, monto, cuenta destino y foto del comprobante. El trabajador **Acepta** o **Deniega** (motivo). |
| E6 | Al aceptar: el producto se **atribuye** al comprador. Digital: se desbloquea solo y la **descarga queda permitida para siempre** a ese comprador. Físico: queda listo para entregar en la sede. |
| E7 | Al aceptar se crea automáticamente una **liquidación pendiente** al vendedor. |
| E8 | Pestaña **Pagos a vendedores** (pendientes): artículo, comprador, vendedor, estado, **monto a yapear (neto)**, datos de cobro del vendedor; el trabajador sube **su comprobante** del pago al vendedor → pasa a **Completa**. |
| E9 | Pestaña **Completas**: historial de liquidaciones hechas con su comprobante. |
| E10 | Pestaña **Ganancias**: suma **solo de la comisión** de los pedidos verificados, por periodo. |
| E12 | **Notificaciones funcionales a ambos lados** (en la app y, si es crítico, por correo como spec 32): comprador → pago recibido/en revisión, aceptado (producto disponible/descarga), denegado (motivo, reenviar), producto listo en sede; vendedor → venta pagada en verificación, producto atribuido, liquidación pendiente, **liquidación pagada con su comprobante**. Equipo → nuevo comprobante por verificar, liquidación por vencer (48 h). |
| E13 | **Sección del vendedor "Mis cobros"**: lista de sus ventas con precio, comisión 13 %, **neto recibido**, estado (pendiente/pagado) y la **foto del comprobante** que subió el equipo al pagarle. |
| E11 | Aplica a **apuntes digitales**, **bazar** y **apuntes físicos**. En físico (RFC 0002) el comprador paga al recoger en la sede y el trabajador sube el comprobante (o marca efectivo) antes de entregar; luego sigue E7–E9. |

## 3. Flujo
```
Comprador ──► elige cuenta del equipo ──► paga ──► sube foto (obligatorio) ──► Order PAID (declarado)
                                                        │
Trabajador · "Pagos por verificar" ──► Deniega (motivo) ──► comprador puede reenviar comprobante
                                   └─► Acepta ──► Order ESCROW: producto atribuido
                                                   (digital: acceso + descarga permanentes)
                                                   └─► Payout PENDING (neto 87 %, vence 48 h)
Trabajador · "Pagos a vendedores" ──► yapea al vendedor ──► sube su comprobante ──► Payout COMPLETED
                                                                              Order RELEASED
```
Estados de pedido: solo vía `canTransition` (PENDING→ACCEPTED→PAID→ESCROW→RELEASED). `ACCESS_STATUSES` ya desbloquea en ESCROW/RELEASED.

## 4. Riesgos y controles
- **Comprobante falso**: el trabajador verifica en el historial real de la cuenta destino antes de aceptar; queda registrado quién aceptó.
- **Descarga libre**: el comprador puede compartir el PDF. Aceptado por el humano; el archivo descargado lleva marca de agua con el correo del comprador si es viable sin coste.
- **Apunte que no es lo anunciado**: revisión previa a publicar (ya existe) + vista previa; un reclamo antes de liquidar congela la liquidación (técnico decide reembolso).
- **Efectivo en sede**: cada cobro en efectivo queda a nombre del trabajador; las métricas por trabajador lo muestran.
- **Datos personales**: números y QR de cuentas solo los ve quien va a pagar (comprador con pedido activo) y el equipo; nunca en listados públicos.
- **Legal**: recibir dinero de terceros y cobrar comisión = actividad comisionista ante SUNAT; el humano gestiona RUC.

## 5. Specs
| Spec | Alcance |
|---|---|
| (todas) | Cada spec cablea sus notificaciones de E12 y las prueba (comprador y vendedor). |
| 36 | Comisión 13 % (revierte spec 35) + **cuentas de cobro del equipo** (modelo, alta por trabajador, sección del técnico, foto/QR). |
| 37 | **Pago con comprobante obligatorio** (checkout digital y bazar) + pestaña **Pagos por verificar** (aceptar/denegar) + desbloqueo y **descarga permanente** del digital. |
| 38 | **Liquidaciones**: modelo Payout, pestañas **Pagos a vendedores**, **Completas** y **Ganancias**; sección del vendedor **Mis cobros** con comprobante (E13). |
| 39 | **Bazar físico**: cobro en sede a cuenta del equipo con comprobante, integrado con casos (RFC 0002) → liquidación; retirar el "pago al vendedor" de spec 31b. |
