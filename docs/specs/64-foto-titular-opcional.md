# Especificación: 64 - Foto del titular opcional en cuentas de cobro

## 1. Objetivo
**Problema:** al crear una cuenta de cobro del equipo hay que subir obligatoriamente una «Foto de perfil», además del QR. Esto se exige en cuatro sitios:
- `packages/shared/src/paymentAccounts.ts`: `photoUrl: PrivatePhotoSchema`.
- `apps/api/prisma/schema.prisma:596`: `photoUrl String`, NOT NULL.
- `apps/api/src/modules/staff/paymentAccounts.ts:26,44`: recorre la foto y el QR.
- `apps/web/src/components/equipo/PaymentAccountForm.tsx:36`: el botón se desactiva sin foto.

Además, el formulario dice «Foto de perfil», mientras que el checkout la llama «Foto del titular».

**Resultado esperado:** la foto del titular es **opcional**. Una cuenta se puede guardar solo con método, titular, número y QR. Si tiene foto, el comprador la ve igual que hoy. Si no, el checkout y el cobro en sede muestran solo el QR, sin hueco ni imagen rota. La etiqueta pasa a ser «Foto del titular (opcional)».

## 2. Fuera de alcance
- El QR sigue siendo obligatorio.
- No cambian el flujo de pago, los comprobantes, la verificación ni el reparto del dinero.
- No se cambia ninguna migración ya aplicada; esta spec crea una nueva.
- No se crean ni editan cuentas reales en producción.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (el humano pidió la foto opcional el 2026-10-13). Aplicar la migración en producción requiere su OK explícito, con copia y ensayo previos (`docs/operaciones/base-de-datos.md`).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | `PaymentAccount.photoUrl String?` |
| `apps/api/prisma/migrations/2026101400…_payment_account_photo_optional/migration.sql` | crear | solo `ALTER TABLE "PaymentAccount" ALTER COLUMN "photoUrl" DROP NOT NULL;` |
| `packages/shared/src/paymentAccounts.ts` | modificar | `photoUrl: PrivatePhotoSchema.nullable().optional()`; en el PATCH, `null` quita la foto |
| `packages/shared/src/paymentAccounts.test.ts` | modificar | válida sin foto y con `null`; la ruta externa sigue rechazada |
| `apps/api/src/modules/staff/paymentAccounts.ts` | modificar | validar y marcar como privada solo la foto que venga; normalizar a `null` |
| tests de la API de cuentas de cobro | modificar o crear | crear sin foto → 201; PATCH quitar foto → 200; foto ajena → rechazo, como hoy |
| `apps/api/docs/openapi.yaml` | modificar | `photoUrl` opcional y nullable en el alta y la edición de cuentas de cobro |
| `apps/web/src/components/equipo/paymentAccountTypes.ts` | modificar | `photoUrl: string \| null` |
| `apps/web/src/components/equipo/PaymentAccountForm.tsx` | modificar | etiqueta «Foto del titular (opcional)»; el botón solo exige el QR; poder quitar la foto |
| `apps/web/src/components/checkout/TeamPayPanel.tsx`, `apps/web/src/components/equipo/PhysicalPaymentFields.tsx` | modificar | `PrivateImage` de la foto solo si existe |
| test web | crear o modificar | render sin foto: no hay imagen del titular y el QR sí aparece |

## 4. Diseño y lógica
- **Seguridad:** las mismas reglas de hoy para la foto que sí se sube:
  - Debe ser un upload propio.
  - Se marca como privado.
  - La ruta solo puede ser `/uploads/...`.

  `privateUploadAccess.ts` no necesita cambios (el `OR` sobre `photoUrl`/`qrUrl` funciona con `null`).
- **Pedidos:** `Order.payPhotoUrl` ya es nullable, así que `digitalPay.ts` y `physicalPayment.ts` pueden guardar `null` sin cambios de esquema. Hay que comprobarlo con los tipos.
- **Migración:** no destructiva; solo quita la restricción NOT NULL. Producción tiene 0 filas en `PaymentAccount`.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Gate | `npm run verify` | en verde |
| A2 | Tests | shared, API y web de §3 | sin foto aceptado; foto ajena o externa rechazada |
| A3 | Migración | `prisma migrate dev` en la BD efímera y `npm run e2e:ci` | aplica limpia; 7 suites ✓ |
| A4 | Ensayo | `npm run db:ensayo` sobre una rama clonada de producción (integrador) | «up to date», prod intacta |
| A5 | UI | captura del formulario y del checkout sin foto, a 375 px | sin hueco ni imagen rota; etiqueta «(opcional)» |

## 6. Checklist de ejecución
- [x] Tarea 1: esquema, migración y shared.
- [x] Tarea 2: API y OpenAPI, con tests.
- [x] Tarea 3: web (formulario, checkout, cobro en sede), con test.
- [x] Tarea 4: A1–A3 y A5 (implementador); A4 (integrador).

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-13 | A1 | ✅ | `npm run verify` en verde (Michael 860b8e1 y Claudio tras integrar 2b5f4de) |
| 2026-10-13 | A2 | ✅ | shared: sin foto y `null` válidos, ruta externa rechazada; API: alta sin foto → 201 con `photoUrl: null`, PATCH con `null` quita la foto sin validar upload; web: formulario, checkout y cobro en sede sin foto |
| 2026-10-13 | A3 | ✅ | Migración `20261014000551_payment_account_photo_optional` (`ALTER TABLE "PaymentAccount" ALTER COLUMN "photoUrl" DROP NOT NULL;`); `npm run e2e:ci` 7 suites ✓ en ejecución limpia (dos fallos previos por E2E simultánea en los mismos puertos) |
| 2026-10-13 | A4 | ✅ | `npm run db:ensayo` en rama clonada de prod: migraciones al día (33), User 7 / Document 2 / Order 2, rama borrada; prod intacta |
| 2026-10-13 | A5 | ✅ | `/tmp/spec64/checkout-375.png` y `form-375.png`: solo QR, sin hueco ni scroll horizontal; etiqueta «Foto del titular (opcional)» |
| 2026-10-13 | Auditoría | ✅ | Kelly (task_86c6da24290a): APROBADO |
