# Especificación: 38 - Liquidaciones, ganancias y Mis cobros

## 1. Objetivo
**Problema:** la verificación crea liquidaciones pendientes pero aún no hay gestión de pagos al vendedor ni comprobantes visibles para él.
**Resultado esperado:** el cobrador o Técnico registra su comprobante para liquidar el neto congelado; el vendedor consulta estado y foto en Mis cobros. Equipo consulta historial y comisión verificada por periodo; reclamos congelan pagos antes de liquidar.
Fuente: RFC0003 E7–E10/E12/E13; despacho god0fd34d. Spec37 base35b27e1.

## 2. Fuera de alcance
- Cobro físico en sede (39), alterar montos históricos, provider automático, producción/despliegue.
- Reembolso efectivo o revocación de grant (40). Godf935b7 decide conservar FROZEN con «Requiere reembolso (pendiente de spec40)» cuando Técnico decide devolver. No cambiar canTransition ni agregar Payout REFUNDED.
**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna pendiente; reembolso resuelto por godf935b7.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/docs/openapi.yaml` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/prisma/migrations/20261009042000_payout_reminders/migration.sql` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/prisma/schema.prisma` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/jobs/index.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/jobs/payoutReminders.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/lib/criticalMail.test.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/lib/criticalMail.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/middleware/privateUploadAccess.test.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/middleware/privateUploadAccess.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/middleware/servePrivateUploads.test.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/extra/routes.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/orders/routes.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/claims.test.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/claims.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/complete.test.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/complete.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/notices.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/refundRequired.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/reminders.test.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/reminders.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/routes.test.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/routes.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/payouts/sellerRoutes.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/api/src/modules/staff/routes.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/auth/PayoutCard.test.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/checkout/EscrowStatus.tsx` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/checkout/PaymentClaim.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/equipo/EarningsTab.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/equipo/PayoutCard.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/equipo/PayoutProofForm.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/equipo/PayoutsTab.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/equipo/payoutTypes.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/ventas/MyPayouts.tsx` | crear | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/components/ventas/ReportsCenter.tsx` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/pages/Equipo.tsx` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `apps/web/src/pages/Ventas.tsx` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `packages/shared/src/extra.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `packages/shared/src/index.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `packages/shared/src/notifications.test.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `packages/shared/src/notifications.ts` | modificar | Liquidaciones, avisos, permisos o pruebas |
| `packages/shared/src/payouts.test.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `packages/shared/src/payouts.ts` | crear | Liquidaciones, avisos, permisos o pruebas |
| `scripts/docs-check.mjs` | modificar | Liquidaciones, avisos, permisos o pruebas |

Rutas verificadas mediante rg y lectura. Nueva migración20261009042000_payout_reminders, aditiva, no aplicada por Michael. Payout ya existe desde37; sin backfill.

## 4. Diseño y lógica
- **UI:** Equipo pestañas Pagos a vendedores, Completas, Ganancias. Pendientes FIFO con artículo/comprador/vendedor, neto, datos de cobro del vendedor, foto propia obligatoria y operación opcional. Completas conserva foto; Mis cobros muestra precio, comisión snapshot, neto por recibir/recibido, estado y foto privada. Paginación50 y refresco30s. Componentes card/input/btn, tokens primary, sin motion nuevo; min-width0/texto largo envuelve.
- **API:** GET /staff/payouts (status/page), GET /staff/payouts/earnings (from/to), POST /staff/payouts/:id/complete|resume|refund-required, GET /orders/payouts. Contratos data/error, listas data+nextPage, no-store. Trabajador propio cobrador; Técnico global; rol releído en cada ruta. Seller select no incluye comprador ni cuentas del equipo.
- **Liquidación:** bajo lock300030 y transacción, solo PENDING+Order ESCROW; ownPhoto comprueba dueño/MIME/storage. Foto Upload.private, Payout COMPLETED (completado por actor/fecha/operación) y Order RELEASED vía canTransition + releasedAt escrow + auditoría. Fallo aborta; repetir409. Montos congelados inmutables.
- **Reclamos:** reports targetType order exige participante; creación y PENDING→FROZEN bajo mismo lock de complete impiden carrera. AccessGrant no cambia. Solo Técnico reanuda con motivo auditado, cierra reportes OPEN del pedido y notifica. Decisión de devolver mantiene FROZEN y flag refundRequired; motivo separado no permite que el comprador suplante decisión. No permite liquidar/reanudar ese flag hasta40.
- **Ganancias:** agrega solamente feeCents por verifiedAt del pedido dentro de from inclusivo/to exclusivo, periodo≤366 días. Cobrador ve propias; Técnico global y desglose identificable por trabajador. No suma bruto/neto, pagos PAID sin verificar ni ventas heredadas sin Payout. FROZEN aún verificado cuenta; devolución efectiva futuro40.
- **Recordatorios:** Payout.reminderSentAt; job interno existente ENABLE_JOBS, cada15min y al arranque busca PENDING sin marca dueAt≤now+6h (incluye vencidas). Lock/tx marca y crea aviso in-app atómico, luego correo crítico. Sin scheduler del sistema ni Automation nueva. Si servidor duerme, próxima pasada recoge atrasados.
- **Privacidad:** comprobante de liquidación solo dueño, equipo actual y vendedor de Payout COMPLETED asociado. Comprador/tercero/anónimo no obtienen bytes. Fotos mediante Bearer/blob. Cuentas y comprobantes del comprador siguen ocultos al vendedor.
- **Avisos E12:** completado vendedor/cobrador PAYOUT_COMPLETED y comprador ORDER_RELEASED; freeze/resume/decisión reembolso a vendedor/cobrador/comprador; próximo vencimiento al cobrador. Nuevos tipos críticos van también por correo.
- **Datos:** migración agrega reminderSentAt, refundRequired(defaultfalse) y NotificationType PAYOUT_COMPLETED/DUE/FROZEN/RESUMED. Sin tocar migraciones aplicadas ni recalcular comisión.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos/shared | build shared y tipos raíz | 0 errores |
| A2 | Lint/any | lint producto y budget:any | 0 errores/warnings; any0 |
| A3 | Tests | suite completa | todos verdes; ≥40 nuevos |
| A4 | API | docs:check y prueba negativa virtual | verde, falta de ruta detectada |
| A5 | Fuentes | TS/TSX tocados | <150 líneas |
| A7 | Móvil | Equipo/Ventas/checkout a375/1280 | 0 exceso horizontal |
| A8 | Bundle | build raíz | inicial<170KB; Equipo<25KB gzip |
| A10 | Accesibilidad | axe en nuevas pestañas/formularios | 0 serias/críticas |
| A11 | Integración | pendiente→foto propia→completa→Mis cobros; permisos/repetición; reclamo freeze/resume/reembolso pendiente; ganancias solofee; recordatorio único | pasa |

## 6. Checklist de ejecución
- [x] Gestión/historial y Mis cobros privados con comprobante.
- [x] Ganancias comisión verificada, recordatorios y avisos/correo.
- [x] Reclamos congelan; resolución Técnico y reembolso pendiente40.
- [x] Gates completos y migración SOLOdev/E2E de god en§7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-09 | A1/A2 | Pasa | Buildshared/types/lint/any0; Prisma regenerado por gode3bb07/c6f790 incluye refundRequired. |
| 2026-10-09 | A3 local | Pasa parcial | API472 previa sin3suitespuertos(documents/access,sanctions/users,agenda/agenda), web88/shared109; liquidaciones finales44 verdes tras flag y regresión adicional. +API50/web4/shared13=67. Suite completa pendiente god (esperadoAPI511). |
| 2026-10-09 | A4 | Pasa | docs107; YAML parseado válido; prueba negativa virtual oculta /staff/payouts/{id}/complete y detecta falta(exit1), sin alterar YAML real. |
| 2026-10-09 | A5 | Pasa | Conteo TS/TSX afectados <150 líneas. |
| 2026-10-09 | A8 | Pasa | Build raíz verde; inicial165.24KB y Equipo17.40KB gzip finales. Dos avisos heredados Vite imports Explorar/Forgot. |
| 2026-10-09 | A7/A10/A11 integrada/SQL | Pendiente | God aplica migración SOLOdev y ejecuta navegador/gates completos; no se afirma validación integrada. |

| 2026-10-09 | A3 completa/SQL | Pasa | God5ad4be: migración20261009042000 SOLOdev, API511/web88/shared109/docs107/any0. |
| 2026-10-09 | A7/A10/A11 integrada | Pasa | God5ad4be: liquidar UI375→COMPLETED+RELEASED, repetir409; Completas/Ganancias S/3.90=2×1.95 con desglose; foto cobrador/vendedor200, comprador/anónimo403; seller list sin comprador/cuentaequipo; Mis cobros precio/comisión/neto/estado/foto/operación; reclamo freeze/complete409/moderadorresume403, Técnicoresume200; refund-required FROZEN+flag/resume409/grant intacto; avisos ambos lados; pestañas375/1280 sin overflow y axe limpio. |
| 2026-10-09 | Texto final | Pasa | Corregido MyPayouts «tu neto en 24–48 h» según revisión god. |
