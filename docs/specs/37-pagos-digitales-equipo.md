# Especificación: 37 - Pagos digitales verificados por el equipo

## 1. Objetivo
**Problema:** la declaración de pago y la confirmación del vendedor permiten acceso sin verificación del equipo.
**Resultado esperado:** el comprador elige una cuenta activa del equipo y adjunta foto obligatoria. Su titular o el Técnico verifica el abono; la aceptación concede acceso y descarga permanentes y crea una liquidación pendiente por el neto congelado.
Fuente: RFC0003 E4–E8/E12 y decisiones god da9011. Solo documentos digitales.

## 2. Fuera de alcance
- Liquidación completada, ganancias y Mis cobros (38); bazar/apuntes físicos y pago en sede (39).
- Producción, despliegue, cuentas reales, backfill de liquidaciones y cambios de comisión histórica.
**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna. God autorizó scaffold Payout en37 y bloqueo de los caminos heredados que eluden la verificación.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/docs/openapi.yaml` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/prisma/migrations/20261009040000_digital_team_payments/migration.sql` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/prisma/schema.prisma` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/lib/criticalMail.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/lib/criticalMail.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/middleware/servePrivateUploads.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/documents/access.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/documents/access.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/documents/download.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/documents/download.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/documents/permanentAccess.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/documents/routes.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/buyerSteps.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/cancelDigital.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/cancelDigital.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/closeSteps.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/create.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/digitalPay.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/digitalPay.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/documentGuard.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/paymentNotices.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/paymentPrivacy.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/paymentPrivacy.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/queries.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/requests.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/orders/sellerSteps.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/payments/checkout.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/payments/mediation.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/payments/mediation.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/payments/routes.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/staff/payments.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/staff/payments.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/staff/routes.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/staff/verifyPayment.test.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/staff/verifyPayment.ts` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/api/src/modules/uploads/routes.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/auth/PaymentProof.test.tsx` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/DownloadButton.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/PrivateImage.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/SaleActions.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/checkout/EscrowStatus.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/checkout/ProofForm.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/checkout/OrderSummary.tsx` | modificar | Semántica accesible del resumen |
| `apps/web/src/components/checkout/StatusTimeline.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/checkout/TeamPayPanel.tsx` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/equipo/PaymentReviewCard.tsx` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/equipo/PaymentsTab.tsx` | crear | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/orders/BuyerOrderRow.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/ventas/DigitalSales.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/components/viewer/ViewerHeader.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/lib/api.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/lib/apiTypes.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/pages/Checkout.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `apps/web/src/pages/Equipo.tsx` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `packages/shared/src/notifications.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `packages/shared/src/notifications.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `packages/shared/src/orders.test.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `packages/shared/src/orders.ts` | modificar | Pagos digitales, privacidad, acceso o pruebas |
| `scripts/docs-check.mjs` | modificar | Pagos digitales, privacidad, acceso o pruebas |

Rutas verificadas con `rg --files` y lectura de fuentes. Migración nueva `20261009040000_digital_team_payments`; no aplicada desde esta sesión.

## 4. Diseño y lógica
- **UI:** checkout digital con cuenta activa, titular/número/foto/QR privados, foto de comprobante obligatoria y operación opcional. Pago PAID aparece «En revisión». Una denegación permite reenviar sin retroceder el estado. Equipo muestra cola FIFO, comprobante ampliable y aceptar/denegar con motivo. Clases card/input/btn y tokens primary; sin motion nuevo.
- **API:** `POST /orders/:id/pay` exige cuenta y foto propia existente JPG/PNG; `GET /staff/payments`, `POST /staff/payments/:id/accept|deny`. Relee rol actual y permite aceptar solo al titular de la cuenta o Técnico. Contratos `{data}` / `{error:{code,message}}`, sin caché. Cuenta ajena, foto ajena, pedido no digital, expiración y repetición se rechazan.
- **Datos:** Order congela destino del equipo y datos del vendedor por separado; declaración protege Upload.private. Aceptación bajo lock300030 y transacción crea DocumentAccessGrant único (archivo congelado sin caducidad), Payout PENDING único con amount/fee/net y vencimiento48h, ESCROW y auditoría. Denegación mantiene PAID y registra motivo/revisor. Migración conserva snapshots previos del vendedor; sin backfill.
- **Acceso:** consulta grants además del acceso heredado. El archivo comprado permanece accesible al sustituir el PDF. `GET /documents/:id/download` autentica y descarga archivo congelado; PDF admite marca por página con email comprador. La marca es opcional: si el PDF no puede procesarse se conserva la descarga original. Se mantienen documentos gratuitos públicos.
- **Privacidad:** vendedor no recibe cuentas/fotos/QR del equipo ni comprobante comprador. Fotos privadas cargan mediante Bearer/blob. Comprador no recibe datos privados de pago del vendedor. URLs de descarga verifican derechos actuales o grant.
- **Invariantes:** importes congelados derivados de computePrice; cambios de estado mediante canTransition. Cancelación digital solo antes de declarar pago. Autoconfirmación vendedor, confirmación de recepción, refund heredado y checkout MercadoPago responden409; webhook antiguo se ignora sin alterar pedidos. Código proveedor conservado.
- **Avisos E12:** declaración a comprador/vendedor/cobrador; aceptación a comprador/vendedor y Payout pendiente a vendedor/cobrador; denegación a comprador/vendedor. Nuevos tipos mapeados a pedidos y correo crítico.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos/shared | build shared + typecheck raíz | 0 errores |
| A2 | Lint/any | lint producto, budget:any | 0 errores/warnings; presupuesto0 |
| A3 | Tests | suite completa con JWT ficticios | todos verdes; ≥60 nuevos |
| A4 | API | docs:check y prueba negativa virtual | verde, ruta ausente detectada |
| A5 | Fuentes/componentes | conteo TS/TSX tocados | <150 líneas |
| A7 | Móvil | checkout/Equipo a375/1280 | 0 exceso horizontal |
| A8 | Bundle | build raíz | inicial<170KB gzip; Equipo<25KB |
| A10 | Accesibilidad | axe checkout/Equipo | 0 serias/críticas |
| A11 | Flujo | foto obligatoria, permisos, denegar/reenviar, aceptar una vez, grant+Payout48h/net87%, descargar, bypass bloqueado | pasa |

## 6. Checklist de ejecución
- [x] Declaración privada con foto obligatoria y cuentas activas.
- [x] Verificación/denegación del equipo y avisos/correo.
- [x] Acceso permanente, descarga y Payout atómico.
- [x] Gates completos, migración solo dev y E2E de god documentados.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-09 | A1 | Pasa | Shared build y typecheck raíz; Prisma regenerado por god d7f41b. |
| 2026-10-09 | A2 | Pasa | Lint excluyendo hive/worktrees 0/0; any-budget0. |
| 2026-10-09 | A3 local | Pasa parcial | API423 excluyendo tres suites con puertos (documents/access, sanctions/users, agenda/agenda); web84/shared96. Nuevos API55+web2+shared5=62. Validación completa pendiente god. |
| 2026-10-09 | A4 | Pasa | docs:check101 rutas; YAML válido y prueba negativa virtual documentada al finalizar. |
| 2026-10-09 | A5 | Pasa | Todas las fuentes tocadas <150 líneas. |
| 2026-10-09 | A8 | Pasa | Build raíz verde; inicial165.10KB y Equipo15.55KB gzip. Dos avisos Vite heredados de imports Explorar/Forgot. |
| 2026-10-09 | A3 completa | Pasa | God b55fb5: API461/web84/shared96; docs101/any0. |
| 2026-10-09 | SQL | Pasa dev | God aplicó20261009040000 SOLOdev; no producción. |
| 2026-10-09 | A7/A10/A11 integrada | Pasa con correcciones UI | God b55fb5: Equipo375/1280 sin overflow y axe limpio; foto ausente400, denegar conservaPAID, reenvío, aceptar200→ESCROW+1grant+Payout1500/195/1305due48h, repetir409; descargaPDFcomprador200/anónimo401, privacidad/avisos correctos. Checkout axe detectó contraste y párrafo dentrodl; corregidos con zinc600 y párrafo fuera. Botón comprobante ahora permite wrap a ancho completo. Revisión visual final de estas correcciones a cargo de god antes del commit. |
| 2026-10-09 | Correcciones UI | Pasa local | Tipos web, eslint tres componentes, web84 y diffcheck verdes tras fixes. |
