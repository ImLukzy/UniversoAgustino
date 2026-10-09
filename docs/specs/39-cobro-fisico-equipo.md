# Especificación: 39 - Cobro físico en sede por el equipo

## 1. Objetivo
**Problema:** recojo físico certifica pago al vendedor y libera dinero al entregar/devolver, sin liquidación del equipo.
**Resultado esperado:** comprador paga al equipo en sede; trabajador registra foto propia de transferencia a cuenta activa o efectivo recibido. La entrega crea Payout neto pendiente48h; solo su liquidación38 libera Order. Apuntes físicos usan categoría APUNTE del bazar.

## 2. Fuera de alcance
Producción, despliegue, reembolso40, cuentas reales, cambio de comisión/snapshots históricos. No adelanto de pago físico por web.
**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna; RFC0003/godda9011/1e028d.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/docs/openapi.yaml` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/prisma/migrations/20261009043500_physical_collection_index/migration.sql` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/prisma/schema.prisma` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/middleware/privateUploadAccess.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/middleware/privateUploadAccess.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/middleware/servePrivateUploads.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/agenda/agenda.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/agenda/cashMetrics.test.ts` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/agenda/metrics.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/agenda/routes.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/bazar/physicalNotes.test.ts` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/bazar/routes.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/caseFixture.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/close.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/fulfillment.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/physicalPayment.test.ts` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/physicalPayment.ts` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/pickup.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/queries.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/queries.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/receive.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/returns.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/sellerPayment.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/cases/sellerPayment.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/orders/create.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/orders/paymentNotices.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/orders/reservation.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/orders/reservation.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/payouts/claims.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/api/src/modules/payouts/complete.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/auth/PhysicalPayment.test.tsx` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/RentalCard.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/bazar/BazarGrid.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/bazar/EscrowSteps.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/checkout/OrderSummary.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/checkout/PaymentClaim.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/detalle/BuyPanel.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/equipo/CaseCard.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/equipo/CaseFulfillment.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/equipo/MetricCards.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/equipo/PhysicalPaymentFields.tsx` | crear | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/equipo/PickupForm.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/equipo/caseTypes.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/landing/FeatureRows.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/marketplace/BazarCard.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/orders/BuyerCaseView.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/components/orders/CaseChat.tsx` | modificar | Etiqueta accesible única por caso |
| `apps/web/src/components/orders/BuyerOrderRow.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/data/landingFaq.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/lib/apiTypes.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/lib/orderLabels.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/lib/orderLabels.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/lib/publishing.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/pages/Bazar.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/pages/Pedidos.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `apps/web/src/pages/Ventas.tsx` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `packages/shared/src/catalog.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `packages/shared/src/handover.test.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `packages/shared/src/handover.ts` | modificar | Cobro físico, disponibilidad, UI o pruebas |
| `packages/shared/src/physicalPayment.test.ts` | crear | Cobro físico, disponibilidad, UI o pruebas |

Rutas verificadas con rg y lectura. Nueva migración20261009043500_physical_collection_index, aditiva salvo reconstrucción del índice activo; no aplicada por Michael. God8fdcc3 regeneró Prisma y revisó que el alcance original bazar+estados activos se conserva.

## 4. Diseño y lógica
Colección+escrow+Payout en misma transacción/lock300030; canTransition para estado financiero. Foto propia privada obligatoria y cuenta activa del equipo para transferencia; efectivo a nombre del actor actual. Caso venta cierra al entregar; alquiler conserva circuito físico con estado financiero independiente. Pendiente/completa/ganancias/Mis cobros usan38. Nueva categoría APUNTE, publicación/filtro en servidor antes de paginar e icono existente. Avisos comprador/vendedor/cobrador y correo crítico; efectivo por trabajador en métricas mensuales. Privacidad mantiene comprador sin datos de cobro vendedor, vendedor sin cuentas/comprobante comprador. Comprador del físico verificado puede consultar su propio comprobante subido por trabajador; vendedores solo reciben comprobante de su liquidación38.

Order.physicalClosedAt marca venta entregada o alquiler retornado al vendedor. Consulta de bloqueo e índice parcial order_active_item_unique excluyen esos cierres físicos; así una liquidación pendiente no impide volver a reservar el artículo AVAILABLE. CaseReturn no cambia estado financiero; BackToSeller marca cierre/restaura stock aunque Order siga ESCROW. Reembolso efectivo sigue40, sin cambiar canTransition. UI distingue Pago liquidado de cierre físico; alquiler liquidado todavía puede aparecer En curso hasta su retorno. No backfill de liquidaciones ni recálculo histórico.

Se retira QR/pago directo al vendedor del detalle público UI, FAQ, feature rows, bazar, pedidos y ventas. El destino de cobro se congela solo al pagar al equipo; datos originales vendedor permanecen separados para Payout. Confirmación física heredada del vendedor bloqueada409 TEAM_SETTLEMENT; su reporte usa congelación compartida con complete. Esta spec reemplaza la decisión de cobro/liberación automática de31b, conservando el circuito de citas/retorno y evidencia histórica.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Umbral |
|---|---|---|
| A1/A2 | Shared build, tipos, lint producto, any-budget | 0 errores/warnings, any0 |
| A3 | Tests completos | verdes y ≥40 nuevos |
| A4 | OpenAPI/docs:check | verde y prueba negativa |
| A5 | TS/TSX tocados | <150 líneas |
| A7/A10 | 375/1280, axe | sin overflow, 0 serias/críticas |
| A8 | Build/bundle | inicial<170KB, Equipo<25KB gzip |
| A11 | E2E físico/cash/cuenta/foto/Payout/retorno/permisos/APUNTE | pasa |

## 6. Checklist de ejecución
- [x] Cobro físico del equipo y Payout atómico sin liberación en entrega/retorno.
- [x] APUNTE físico y textos sin pago directo al vendedor.
- [x] Avisos, privacidad, efectivo por trabajador y pruebas.
- [x] Migración SOLOdev/gates/E2E god documentados en§7; repeticiones finales explícitas abajo.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-09 | A1/A2 | Pasa | Shared build/tipos raíz/lint producto excluye hive-worktrees/any0; ajustes UI finales tiposweb/eslint verdes. Prisma regenerado por god8fdcc3. |
| 2026-10-09 | A3 local | Pasa parcial | API506 sin3suitespuertos(documents/access,sanctions/users,agenda/agenda); shared119/web92. +API33/shared10/web4=47 nuevos. Suite completa esperadaAPI544 pendiente god. |
| 2026-10-09 | A4 | Pasa | docs107/YAML válido; negativa virtual oculta /staff/cases/{id}/pickup→exit1, sin cambiar YAML real. |
| 2026-10-09 | A5 | Pasa | Todas las fuentes TS/TSX tocadas <150 líneas. |
| 2026-10-09 | A8 | Pasa | Build raíz verde y web final verde; inicial165.35KB y Equipo18.07KB gzip. Dos avisos Vite heredados de imports Explorar/Forgot. |
| 2026-10-09 | A7/A10/A11/SQL integrada | Pendiente | God migración SOLOdev, suite completa, E2E físico/cash/cuenta/foto/Payout/retorno + nueva reserva antes de liquidar, APUNTE, 375/1280/axe. Sin SQL/commit/push desde Michael. |

### Integración dev y correcciones finales
God b0c412 confirma migración20261009043500 SOLOdev y E2E venta APUNTE: bazar375 sin overflow; adelanto web409; aceptación/custodia/citas/entrega200; botón bloqueado sin foto; OrderESCROW con physicalClosedAt, stockSOLD/casoCLOSED, PayoutPENDING1500/195/1305 due48h. Repeticiónpickup y autoconfirmación409. Foto comprador/equipo200, anónimo403; vendedor de esta prueba era admin, su200 no demuestra permiso vendedor común (cubierto por tests). Liquidación UI200→RELEASED; avisos ambos y Ventas correctos.

Corregida expectativa cashThisMonthByStaff:[] en agenda.test; métricas2/2 y cashMetrics4/4 pasan. CaseChat usa etiqueta única por caseId; Pedidos usa div dentro del main del layout. Tiposweb/eslint y suiteweb92 verdes tras cambios. Manifiesto61 archivos. God reportó gates verdes salvo expectativa anterior API543/544. Pendiente repetir API completa y axe final tras estas correcciones; no afirmar API544 ni axe limpio hasta confirmación. E2E integrado de efectivo/alquiler/nueva reserva y1280 no comunicado en este mensaje; cubiertos por pruebas locales cuando corresponda, pendiente confirmación de god. Sin SQL/commit/push desde Michael.
