# Especificación: 16 - Muestra configurable, marca de agua y pago de extremo a extremo

## 1. Objetivo
**Problema:** la vista previa siempre son las páginas 1–2 (`preview.ts`, `PdfPages.tsx`); el visor no identifica a quien mira; `hasFullAccess` da acceso con `PAID`, que el comprador se autodeclara sin que nadie verifique el abono; `POST /orders` acepta documentos gratis, dados de baja o ya comprados, y `/pay` acepta constancias vacías o vouchers ajenos.
**Resultado esperado:** el vendedor elige las páginas exactas de muestra (el resto nunca sale del servidor y el visor las cubre con el muro); el visor quema una marca de agua con los datos del lector y oculta el contenido ante intentos de captura; el pedido de un apunte llega a acceso completo solo con pago verificado (vendedor en modo manual Yape/Plin o webhook firmado de Mercado Pago si hay credenciales).

## 2. Fuera de alcance
- Comisión (13 %) y textos legales.
- Máquina de estados (`ORDER_TRANSITIONS`) y bazar físico.
- Marca de agua en la descarga del comprador (el paywall promete descarga sin marcas).

**Decisiones de producto que requieren aprobación antes de ejecutar:** aplicar las migraciones en Neon (`prisma migrate deploy`) — aprobado y aplicado el 2026-09-23.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `packages/shared/src/pages.ts` (+ test) | crear | `parsePageRange` / `formatPageRange` |
| `packages/shared/src/catalog.ts`, `orders.ts` (+ test) | modificar | `previewPages`; constancia obligatoria |
| `apps/api/prisma/schema.prisma` + migración `20260925090000_document_preview_pages` | crear | `Document.previewPages Int[]` |
| `apps/api/src/modules/documents/{access,preview,listing}.ts` | modificar | acceso ESCROW/RELEASED; páginas elegidas; sin `fileUrl` de pago en el catálogo |
| `apps/api/src/modules/orders/{create,buyerSteps}.ts` | modificar | validaciones |
| `apps/api/src/modules/payments/*`, `apps/api/src/lib/mercadopago.ts` | crear | pasarela opcional |
| `apps/api/src/env.ts`, `.env.example`, `docs/payments.md` | modificar/crear | variables |
| `apps/api/docs/openapi.yaml`, `scripts/docs-check.mjs` | modificar | rutas `/payments` |
| `apps/web/src/components/viewer/*`, `pages/Visor.tsx` | modificar/crear | rango, marca de agua, escudo |
| `apps/web/src/components/{subir,publicar,publicaciones}/*` | modificar | campo "Páginas de muestra" |
| `apps/web/src/pages/Checkout.tsx`, `components/checkout/*` | modificar/crear | botón Mercado Pago |

## 4. Diseño y lógica
- `previewPages` (1-based, ≤ 20, orden ascendente, default `[1,2]`). La vista previa es un PDF nuevo solo con esas páginas; cabeceras `X-Total-Pages` y `X-Preview-Pages` (expuestas por CORS).
- Acceso completo: gratis, autor, admin o pedido `ESCROW`/`RELEASED`.
- Mercado Pago (Checkout Pro) solo si `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` existen: el webhook valida `x-signature` (HMAC-SHA256), relee el pago en la API de MP y exige `approved` + `external_reference` + monto exacto → `PAID` → `ESCROW`.

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores |
| A3 | Tests | `npm test` | verde; nuevos en `pages.test.ts`, `access.test.ts`, `mercadopago.test.ts`, `orders.test.ts` |
| A4 | Contrato API | `npm run docs:check` | verde |
| A5 | Tamaño | `.ts/.tsx` tocados ≤ 150 líneas | ≤ 150 |

## 6. Checklist de ejecución
- [x] T1: `parsePageRange` + `previewPages` en contrato, Prisma y migración.
- [x] T2: vista previa con las páginas elegidas + cabeceras.
- [x] T3: acceso solo con pago verificado; validaciones de `POST /orders` y `/pay`.
- [x] T4: pasarela Mercado Pago opcional (config, sesión, webhook firmado) + variables en `.env.example` y `docs/payments.md`.
- [x] T5: visor con rango (páginas bloqueadas cubiertas), marca de agua quemada en el canvas y escudo anticaptura.
- [x] T6: campo "Páginas de muestra" al subir, publicar y editar.
- [x] T7: checkout con Mercado Pago cuando está activo.
- [x] T8: A1–A5 y registro en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-09-23 | A1 | ✅ | `npm run typecheck` exit 0 |
| 2026-09-23 | A2 | ✅ | `npm run lint` exit 0 |
| 2026-09-23 | A3 | ✅ | api 37, web 37, shared 34 |
| 2026-09-23 | A4 | ✅ | `docs:check OK` |
| 2026-09-23 | A5 | ✅ | máx. tocado: `Checkout.tsx` 149 |
| 2026-09-23 | E2E | ✅ | API local: muestra [1,3] → X-Preview-Pages 1,3 / total 14; pedido reutilizado; /pay sin constancia 400, voucher ajeno 400 BAD_PROOF; PAID sin acceso; ESCROW acceso 200; recompra 409 ALREADY_OWNED; webhook sin pasarela 404. Pedido de prueba reembolsado y muestra restaurada |
| 2026-09-23 | Visual | ✅ | `visual-regression.mjs` 22/22 (una corrida previa con CLS 0.085 intermitente en /explorar@375) |
