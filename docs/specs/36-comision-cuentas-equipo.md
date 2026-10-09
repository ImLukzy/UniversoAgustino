# Especificación: 36 - Comisión del 13 % y cuentas de cobro del equipo

## 1. Objetivo
**Problema:** la spec 35 dejó `PLATFORM_FEE_PCT=0` en shared y no existe un registro privado de cuentas de cobro del equipo.
**Resultado esperado:** los nuevos pedidos descuentan al vendedor una comisión del 13 % por defecto, conservando el precio publicado y los snapshots históricos. Trabajadores administran sus cuentas; el Técnico administra todas. Titular, número, foto y QR se muestran solo al equipo y al comprador con pedido activo.
Fuente autorizada: RFC 0003 E1/E3 y despacho god `2026-10-09T03-22-54-858Z-1f7cf3`.

## 2. Fuera de alcance
- Declaración y verificación de pago, descarga permanente (37), liquidaciones/Mis cobros (38), cobro físico (39).
- Ejecutar SQL en producción, modificar Render/Vercel, introducir cuentas o teléfonos reales en repo/seed.
- Cambiar snapshots históricos o la máquina `canTransition`.
**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna; RFC aprobado. El override por entorno `PLATFORM_FEE_PCT` se conserva por indicación god `c56059`; god configura 13 al desplegar. `.env.example` ya contiene 13.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/docs/openapi.yaml` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/prisma/schema.prisma` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/middleware/serveUploads.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/orders/requests.test.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/orders/routes.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/staff/routes.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/staff/staff.test.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/uploads/routes.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/RentalCard.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/checkout/OrderSummary.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/detalle/BuyPanel.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/landing/LandingFAQ.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/legal/CreatorTerms.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/monetiza/EarningsSimulator.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/monetiza/MonetizaHero.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/monetiza/PublishSteps.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/publicar/StepPriceLegal.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/ventas/DigitalSales.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/administracion.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/agronomia.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/arquitectura.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/biologia.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/contabilidad.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/default.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/derecho.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/economia.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/educacion.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/enfermeria.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/ing_civil.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/ing_industrial.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/ing_sistemas.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/medicina.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/otra_unsa.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/career/psicologia.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/data/landingFaq.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/pages/Equipo.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/pages/Suscripcion.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/pages/Ventas.tsx` | modificar | Comisión, cuentas, permisos o pruebas |
| `packages/shared/src/auth.test.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `packages/shared/src/index.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `packages/shared/src/orders.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `packages/shared/src/price.test.ts` | modificar | Comisión, cuentas, permisos o pruebas |
| `scripts/docs-check.mjs` | modificar | Comisión, cuentas, permisos o pruebas |
| `apps/api/prisma/migrations/20261009034000_team_payment_accounts/migration.sql` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/middleware/privateUploadAccess.test.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/middleware/privateUploadAccess.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/middleware/servePrivateUploads.test.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/orders/paymentAccounts.test.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/orders/paymentAccounts.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/staff/accountFixture.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/staff/accountPermissions.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/staff/paymentAccounts.test.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/api/src/modules/staff/paymentAccounts.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/auth/PaymentAccountForm.test.tsx` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/PrivateImage.tsx` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/equipo/PaymentAccountForm.tsx` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/equipo/PaymentAccountsTab.tsx` | crear | Comisión, cuentas, permisos o pruebas |
| `apps/web/src/components/equipo/paymentAccountTypes.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `packages/shared/src/paymentAccounts.test.ts` | crear | Comisión, cuentas, permisos o pruebas |
| `packages/shared/src/paymentAccounts.ts` | crear | Comisión, cuentas, permisos o pruebas |

Rutas verificadas mediante `rg --files` y lectura de fuentes antes de implementar. La migración es nueva, aditiva y no se aplica desde esta sesión.

## 4. Diseño y lógica
- **UI:** pestaña «Cuentas de cobro» en `/equipo`; listado propio para Trabajador, todas para Técnico. Alta, edición, activación/desactivación, fotos JPG/PNG subidas con propósito privado. Propietario inmutable. Sin cuenta inicial preconfigurada. Formularios `input`, `card`, `btn-primary`, `btn-secondary`, min-width 0, filas que envuelven texto. Sin iconos nuevos ni motion.
- **API:** `GET/POST /staff/payment-accounts`, `PATCH /staff/payment-accounts/:id`; solo equipo actual (rol releído de BD). Trabajador gestiona solo propias; Técnico todas. Alta exige dueño miembro actual. Mutaciones bajo lock300030 + transacción + AuditLog sin números ni fotos en el log. Baja del trabajador desactiva sus cuentas en la misma transacción existente.
- **API comprador:** `GET /orders/:id/payment-accounts`; exige comprador del pedido PENDING vigente, ACCEPTED o PAID. Retorna solo cuentas activas de miembros actuales; vendedor/tercero, pedido expirado o cerrado →404. Respuesta `private, no-store`, contratos `{data}` / `{error:{code,message}}`. Errores `FORBIDDEN`, `NOT_STAFF`, `BAD_PHOTO`, `NOT_FOUND` y `VALIDATION`.
- **Datos:** `PaymentAccount` con userId, método YAPE/PLIN/OTHER, titular, número, foto/QR obligatorios, active, fechas; FK Restrict e índice userId+active. `Upload.private` impide que la URL exacta de un QR privado sirva bytes sin autorización. Propósito `team-account` lo protege desde la subida, incluidas deduplicaciones. Fotos nuevas existentes y propias (técnico puede subir para otro miembro); fotos originales se conservan en edición y siguen privadas al reemplazarlas.
- **Archivos privados:** acceso del dueño, equipo actual o comprador de pedido activo a foto/QR de cuenta activa. Anónimo/tercero →403 incluso si conoce la URL. Local/stream S3 usan no-store; redirect firmado S3 ya no-cache. `PrivateImage` carga con Bearer y libera el blob al desmontar. El bucket sigue privado.
- **Dinero:** shared default13; `env.FEE_PCT` toma override o shared. `computePrice` congela amount/fee/net/feeBps al crear. Ejemplo 1000 céntimos →130 comisión +870 neto. Textos de publicación, simulador, FAQ, ventas y términos actualizados conforme al RFC.
- **Avisos E12:** esta spec no cambia estados de pagos; sus avisos a comprador/vendedor/equipo se implementan y prueban con las transiciones en37–39. No se notifica información bancaria a compradores sin pedido.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos/shared | build shared + `npm run typecheck` | 0 errores |
| A2 | Lint/presupuesto | lint producto excluyendo hive/worktrees + any-budget | 0 errores/warnings, 0 palabras prohibidas |
| A3 | Tests | `npm test` con JWT ficticios | suite completa verde; ≥40 nuevos |
| A4 | API | `npm run docs:check` | verde; cuenta privada sin listado público |
| A5 | Componentes y fuentes | conteo de líneas tocadas | <150 por componente/fuente TS |
| A7 | Móvil | `/equipo` Cuentas a375 y textos de cobro | 0 px exceso horizontal |
| A8 | Build/bundle | `npm run build` + gzip salida | inicial <170KB, Equipo <25KB |
| A10 | Accesibilidad | axe en formulario de cuentas | 0 violaciones serias/críticas |
| A11 | Cuenta/privacidad/comisión | Técnico crea para trabajador, este edita propia; tercero403/404, comprador activo ve activas, imagen anónima403; pedido nuevo13% y viejo no cambia | pasa |

## 6. Checklist de ejecución
- [x] Restaurar default13 y textos manteniendo snapshots.
- [x] Modelo/migración, contrato shared, cuentas de equipo y permisos privados.
- [x] UI alta/edición/activación, fotos/QR privados, sin cuentas reales en repo.
- [x] Tests, gates y verificación integrada de god; registrar evidencia completa en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-09 | A1 | Pasa | Build shared, typecheck raíz 0; cliente Prisma regenerado por god fuera sandbox (c56059), sin aplicar SQL por Michael. |
| 2026-10-09 | A2 | Pasa | `npm run lint -- --ignore-pattern 'hive/**' --ignore-pattern 'worktrees/**'` 0/0; `node scripts/any-budget.mjs --check` 0<=0. |
| 2026-10-09 | A3 local | Pasa parcial | API368 sin tres archivos que abren puertos (`documents/access.test.ts`, `sanctions/users.test.ts`, `agenda/agenda.test.ts`); web82; shared91. Nuevos API40 +web2 +shared8 =50. Suite completa a cargo de god fuera sandbox; no se afirma aprobada todavía. |
| 2026-10-09 | A4 | Pasa | docs:check97 rutas; prueba negativa virtual oculta /staff/payment-accounts/{id} →exit1 sin modificar YAML real; contratos de cuenta, propiedad, métodos, imágenes; tests cuenta ajena404, exmiembro403 y QR anónimo403. |
| 2026-10-09 | A5 | Pasa | Todos los TS/TSX tocados <140 líneas (schema/OpenAPI/documentación excluidos). |
| 2026-10-09 | A8 | Pasa | build raíz exit0. Entrada98.32+vendor-react53.80+vendor-query12.98 =165.10KB gzip; Equipo15.03KB (<25). Vite conserva dos avisos existentes por imports dinámicos/estáticos en Explorar/Forgot. |
| 2026-10-09 | A7/A10/A11 | Pendiente | God hace E2E, medición375/axe y gates fuera sandbox. No marcar checklist hasta confirmación. |

| 2026-10-09 | A1–A4 completa | Pasa | God735098 fuera sandbox: shared/typecheck/eslint/docs97/any0, API406/web82/shared91. Migración20261009034000 aplicada SOLOdev por god. |
| 2026-10-09 | A7/A11 | Pasa | God735098 E2E cuentas a375/1280: 0px overflow, alta foto+QR; estudiante403 en staff y PATCH ajeno; QR anónimo403, estudiante sin pedido403, dueño200; pedido1500→fee195/net1305/feeBps1300; compradoractivo ve cuenta y QR200. |
| 2026-10-09 | A10 | Corregido | God detectó main anidado preexistente; Equipo.tsx cambia ambas ramas a div en esta entrega según735098. Verificación local tipos/lint/webtests; remedición axe por god. |
