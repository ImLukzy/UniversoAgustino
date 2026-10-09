# Especificación: 40 - Reembolso tras reclamo

## 1. Objetivo
**Problema:** refundRequired congela la liquidación sin permitir registrar devolución real ni revocar acceso.
**Resultado esperado:** solo el Técnico registra el reembolso íntegro congelado con foto propia obligatoria y operación opcional; Order y Payout quedan REFUNDED, sin comisión ni pago al vendedor.

## 2. Fuera de alcance
SQL, producción, push, proveedores automáticos, recalcular snapshots históricos.
**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna pendiente. God1ba81d autorizó devolución íntegra, historial/recompra y retorno previo a sede; solo Técnico agenda devolución de venta entregada. God8ab7e4 exige unicidad de grants activos.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/docs/openapi.yaml` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/prisma/migrations/20261009051000_team_refunds/migration.sql` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/prisma/schema.prisma` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/lib/criticalMail.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/lib/criticalMail.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/middleware/privateUploadAccess.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/middleware/privateUploadAccess.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/agenda/cashMetrics.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/agenda/metrics.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/appointments.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/bookingWindow.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/close.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/queries.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/refundReturn.test.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/refundReturn.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/cases/returns.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/documents/access.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/documents/download.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/documents/permanentAccess.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/documents/refundDownload.test.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/orders/documentGuard.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/orders/queries.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/orders/refundQueries.test.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/refund.test.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/refund.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/refundPhysical.ts` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/refundRequired.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/routes.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/routes.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/payouts/sellerRoutes.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/staff/accountFixture.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/staff/verifyPayment.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/api/src/modules/staff/verifyPayment.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/auth/RefundPayout.test.tsx` | crear | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/CaseCard.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/CaseFulfillment.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/PayoutCard.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/PayoutProofForm.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/ReturnForm.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/caseTypes.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/equipo/payoutTypes.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/orders/BuyerOrderRow.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/components/ventas/MyPayouts.tsx` | modificar | Reembolso, retorno, privacidad o verificación |
| `apps/web/src/lib/apiTypes.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `docs/specs/40-reembolso-tras-reclamo.md` | crear | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/handover.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/notifications.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/notifications.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/orders.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/payouts.test.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/payouts.ts` | modificar | Reembolso, retorno, privacidad o verificación |
| `packages/shared/src/refunds.test.ts` | crear | Reembolso, retorno, privacidad o verificación |

Rutas verificadas mediante rg y lectura. Manifiesto exacto spec40-commit-files.json en carpeta Michael.

## 4. Diseño y lógica
POST /staff/payouts/:id/refund usa contrato {data}/{error}, lock300030, rol real admin, FROZEN+refundRequired+canTransition ESCROW→REFUNDED. Foto JPG/PNG propia existente se vuelve privada; amountCents íntegro permanece congelado. Payout guarda refundProofUrl/refundPaymentRef/refundedAt/refundedById separados de liquidación. Reportes abiertos se cierran ACTIONED; auditoría antes de avisos externos.

DocumentAccessGrant.revokedAt conserva historial y protege archivos congelados antiguos; lecturas autorizadas filtran activos. Índice buyer/document/revokedAt reemplaza unicidad histórica; nuevo índice único parcial WHERE revokedAt IS NULL y comprobación bajo lock impiden dos accesos activos. Recompra conserva historial. Order único sigue evitando dobles grants por pedido. Ganancias excluyen Payout/Order REFUNDED.

Venta DELIVERED/CLOSED con refundRequired se reabre solo mediante cita RETURN del comprador agendada por Técnico; guard real exige FROZEN/refundRequired, recepción obliga foto propia. Alquiler conserva circuito RETURN actual; antes de RETURNED no se devuelve dinero. Ausencia mantiene congelación. Físico en custodia pasa BACK_TO_SELLER; stock no se libera hasta cita y entrega al vendedor. No se inventa devolución física al registrar dinero. UI reutiliza formulario de comprobante, muestra monto íntegro y acción Registrar reembolso solo Técnico. Mis pedidos muestra foto privada solo comprador; vendedor solo estado sin comprobante de devolución. Aviso ORDER_REFUNDED comprador/vendedor/cobrador más correo crítico.

Migración nueva20261009051000_team_refunds; no aplicada por Michael. Solo nueva transición financiera explícitamente autorizada; terminales siguen terminales.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo | Umbral |
|---|---|---|---|
| A1/A2 | Tipos/lint/any | scripts raíz | 0 errores/warnings/any |
| A3 | Tests | suites shared/API/web | verdes, ≥40 nuevos |
| A4 | API | docs:check + negativa | ruta documentada, negativa exit1 |
| A5 | Fuentes | wc TS/TSX tocados | <150 líneas |
| A7/A10 | UI375/1280+axe | god E2E | sin overflow, 0 serias/críticas |
| A8 | Bundle | build | inicial<170KB; Equipo<25KB gzip |
| A11 | Reembolso digital/físico/permisos/ganancias/avisos | tests+E2E dev | pasa |

## 6. Checklist de ejecución
- [x] Reembolso atómico, foto y roles.
- [x] Revocación digital, historial y ganancias.
- [x] Físico, comprobante comprador y avisos.
- [x] Gates y E2E dev registrados antes del commit.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-09 | Implementación | Pasa | Integración dev confirmada por god d72748; sin SQL/commit/push desde Michael. |
| 2026-10-09 | A3 local | Pasa parcial | API556 excluyendo3suites que abren puertos(documents/access,sanctions/users,agenda/agenda); shared132/web100. +API50/shared13/web8=71 pruebas nuevas. Suite completa API594 confirmada por god d72748. |
| 2026-10-09 | A4 | Pasa | docs108 rutas/YAML válido; negativa virtual oculta /staff/payouts/{id}/refund→exit1 sin mutar YAML. |
| 2026-10-09 | A5 | Pasa | 48 fuentes TS/TSX tocadas, todas<150 líneas. |
| 2026-10-09 | A8 | Pasa | Build raíz verde; inicial165.35KB y Equipo18.58KB gzip; avisos Vite heredados Explorar/Forgot. |
| 2026-10-09 | Prisma | Pasa | Cliente regenerado por god8ab7e4; prisma validate con URL ficticia (sin conexión ni SQL) verde. |
| 2026-10-09 | A7/A10/A11 integrada | Pasa | God d72748: E2E digital/venta física entregada, permisos/ganancias/recompra/avisos; Equipo Pagos a vendedores375/1280 y Pedidos375 sin overflow y axe limpio. Alquiler/efectivo/estados de retorno cubiertos por tests; no se atribuye E2E adicional no comunicado. |
| 2026-10-09 | A1/A2 | Pasa | Shared build/tipos raíz/lint producto apps+packages+scripts, any0, diffcheck verdes. Última corrida después de todos los tests nuevos. |

### Evidencia integrada — god d72748
Migración20261009051000 aplicada SOLOdev. Gates completos API594/web100/shared132, docs108 y any0 verdes.

Digital: descarga antes200; moderador reembolso403; Técnico registra reembolso desde UI1280→200 y Order/PayoutREFUNDED, grantrevokedAt; descarga después403, repetido409. Ganancias585→390; comprobante comprador/equipo200, vendedor estudiante/anónimo403. Mis pedidos muestra comprobante; recompra201.

Venta física entregada: reclamoFROZEN; sin refundRequired no hay slotsRETURN. Decisiónrefund-required200; reembolso fuera de sede409. CitaRETURN201 y recepción con foto→RETURNED; reembolso200→Order/PayoutREFUNDED conservando stockSOLD. RetornoBACK_TO_SELLER→AVAILABLE y casoCLOSED. Seis avisosORDER_REFUNDED en los dos reembolsos. Equipo375/1280 y Pedidos375 sin overflow y axe limpio. Commit local por god pendiente; sin push.
