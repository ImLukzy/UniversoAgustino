# API_SPECS — Universo Agustino
Base `/api/v1` · JSON · OK `{data}` · error `{error:{code,message}}` · detalle en Swagger `/docs` (`apps/api/docs/openapi.yaml`, gate `npm run docs:check`).
Acceso: `pub` libre · `auth` Bearer access · `own` dueño · `mod` moderator|admin · `ck` cookie `hub_refresh` + Origin exacto.
Códigos comunes: 400 VALIDATION(zod) · 401 sin/mal token · 403 FORBIDDEN · 404 · 409 estado · 429 RATE_LIMITED · 500.

## auth
| M | Ruta | Acc | Payload | OK | Err |
|---|---|---|---|---|---|
| POST | /auth/email/start | pub | {email} | 202 {email,expiresIn,resendIn} | 403 EMAIL_NO_AUTORIZADO·429 ESPERA_REENVIO{retryIn}·502 CORREO_FALLIDO·503 |
| POST | /auth/email/verify | pub | {email,code:6d} | 201 nuevo·200 existe {access,isNew} | 400 CODIGO_INCORRECTO·410 CODIGO_VENCIDO·429 DEMASIADOS_INTENTOS |
| GET | /auth/oauth/status | pub | — | 200 {google,apple} | — |
| GET | /auth/oauth/google | pub | ?next=/path | 302 Google | 503 sin creds |
| GET | /auth/oauth/google/callback | pub | ?code&state | 302 web/auth/callback?code | 302 ?error=EMAIL_NO_AUTORIZADO·TOKEN_INVALIDO·PROVEEDOR_DISTINTO |
| POST | /auth/oauth/consume | pub | {code} | 200 {access} | 400 |
| POST | /auth/oauth/apple/callback | pub | form_post id_token | 302 | 302 ?error |
| POST | /auth/refresh | ck | — | 200 {access} (rota cookie) | 401 BAD_REFRESH·403 origen |
| POST | /auth/logout | ck | — | 200 | 403 origen |
| GET | /auth/me | auth | — | 200 user+profile | 401 |
| POST | /auth/onboarding | auth | {fullName,faculty,career,cycle,phone} | 201 profile | 400·409 PERFIL_COMPLETO |
| PATCH | /auth/profile | auth | {fullName,career,cycle} | 200 | 400 |
| POST | /auth/login · /register | pub | {email,password,…} | 200/201 | 401 OAUTH_ONLY·403·409 (legado; UI usa OAuth/OTP) |
| POST | /auth/forgot · /reset | pub | {email} · {token,password} | 202 · 200 | 400·410·429 |

## documents (apuntes)
| M | Ruta | Acc | Payload | OK | Err |
|---|---|---|---|---|---|
| GET | /documents | pub | ?q,career,type,cycle,page | 200 lista PUBLISHED | — |
| POST | /documents | auth | {title,course,career,cycle,type,priceCents,fileUrl,previewPages[],description?,payMethod,payDetail?,payQrUrl?} | 201 | 400 |
| GET | /documents/mine | auth | — | 200 | — |
| GET | /documents/:id | pub(+auth) | — | 200 (+saved,fullAccess) | 404 |
| GET | /documents/:id/preview | pub | — | 200 PDF páginas muestra | 404 |
| PATCH·DELETE | /documents/:id | own | campos parciales | 200 | 403·404·409 pedidos vivos |
| POST·DELETE | /documents/:id/save | auth | — | 200 idempotente | 404 |
| POST | /documents/:id/takedown | mod | — | 200 TAKEDOWN | 403 |

## bazar
| M | Ruta | Acc | Payload | OK | Err |
|---|---|---|---|---|---|
| GET | /bazar · /bazar/:id | pub | ?page | 200 | 404 |
| POST | /bazar | auth | {title,kind,tx:VENTA\|ALQUILER,priceCents,depositCents?,description,photos≤4,pay*} | 201 | 400 |
| GET | /bazar/mine | auth | — | 200 | — |
| PATCH·DELETE | /bazar/:id | own | parcial | 200 | 403·404·409 |
| POST | /bazar/:id/reserve | auth | — | 200 RESERVED | 409 |

## orders (máquina de estados, solo vía canTransition)
| M | Ruta | Acc | Payload | OK | Err |
|---|---|---|---|---|---|
| POST | /orders | auth | {itemType:document\|bazar,itemId,rentalStart?,rentalEnd?} | 201 PENDING TTL 30m | 400·409 |
| GET | /orders/mine · /sales · /:id | auth | — | 200 | 403·404 |
| POST | /orders/:id/accept | vendedor | — | 200 ACCEPTED (alquiler) | 409 |
| POST | /orders/:id/pay | comprador | {payProof?,payProofUrl?} | 200 PAID | 400·409 |
| POST | /orders/:id/confirm-payment | vendedor | — | 200 ESCROW | 403·409 |
| POST | /orders/:id/confirm-receipt | comprador | — | 200 RELEASED | 403·409 |
| POST | /orders/:id/cancel | parte | — (motivo BUYER_CANCELLED\|SELLER_REJECTED) | 200 CANCELLED | 409 BAD_STATE |
| POST | /orders/:id/refund | mod | — | 200 REFUNDED | 403 |

## otros
| M | Ruta | Acc | Payload | OK | Err |
|---|---|---|---|---|---|
| POST | /uploads | auth | multipart file (pdf/jpg/png/epub ≤25MB) | 201 {url} | 400·413·415 firma |
| GET | /uploads/:name | pub(+auth) | ?stream=1 (Range) | 200·206·302 R2 | 403·404 |
| GET | /payments/config | pub | — | 200 {provider:manual\|mercadopago} | — |
| POST | /payments/checkout/:orderId | comprador | — | 200 {url} Mercado Pago | 403·404 PROVIDER_OFF·409 |
| POST | /payments/webhook | MP | x-signature HMAC | 200 | 401·404 |
| POST | /reports | auth | {targetType:document\|bazar\|user,targetId,reason≥10} | 201 | 400 |
| GET | /reports · /reports/mine | mod · auth | — | 200 | 403 |
| POST | /reports/:id/action | mod | {action:ACTIONED\|DISMISSED} | 200 | 403 |
| GET | /notifications | auth | ?unread=1&pageSize | 200 | — |
| POST | /notifications/read-all · /:id/read | auth | — | 200 | 404 |
| POST | /monetization/simulate | pub | {avgPrice,salesPerMonth,bazarExtra,feePct} | 200 | — |
| GET | /health · /ready · /legal/summary | pub | — | 200 | 503 BD caída |

## Modelos Prisma (`apps/api/prisma/schema.prisma`)
| Modelo | Campos clave | Notas |
|---|---|---|
| User | id cuid, email uniq, passwordHash?, provider?+providerId? uniq, role student\|creator\|moderator\|admin | 1–1 Profile |
| Profile | fullName, university=UNSA, career, faculty?, cycle?, phone?, onboardedAt? | onboardedAt null → /bienvenida |
| EmailLoginCode (≈OtpCode) | email, codeHash HMAC, attempts≤5, expiresAt 10m, usedAt?, requestIp | canje atómico |
| RefreshToken | userId, hash sha256, expiresAt, revoked | rotación en /refresh |
| Document (≈Product digital) | authorId, title, course, career, cycle, type APUNTE\|PAE\|BALOTARIO\|GUIA, priceCents, fileUrl, previewPages Int[], pay*, status DRAFT\|REVIEW\|PUBLISHED\|TAKEDOWN | |
| BazarItem (≈Product físico) | sellerId, kind, tx VENTA\|ALQUILER, priceCents, depositCents?, photos[], pay*, status AVAILABLE\|RESERVED\|SOLD\|RENTED | |
| Order | buyerId, sellerId, itemType, itemId, amount/fee/netCents, feeBps, snapshot itemTitle/itemPriceCents, pay*, payProof*, rental*, expiresAt, status PENDING→ACCEPTED→PAID→ESCROW→RELEASED \| CANCELLED \| REFUNDED | 1–1 Escrow |
| Upload | ownerId, storedName uuid, detectedMime, checksum, bytes | firma verificada |
| Report · AuditLog · Notification · SavedDocument · PasswordResetToken | — | soporte |
| Exam / Question | **no en BD**: estáticos en `apps/web/src/data/balotarios/*.ts` (`{q,opts[4],ok,why}`) | spec 23 |
