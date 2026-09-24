# Pagos (spec 16)

El pedido sigue la máquina de estados de siempre: `PENDING → (ACCEPTED, solo alquiler) → PAID → ESCROW → RELEASED`.
Un apunte solo se desbloquea con **pago verificado** (`ESCROW` o `RELEASED`). `PAID` es una declaración del comprador y no da acceso por sí sola.

## Modo manual (por defecto, sin credenciales)

1. El comprador crea el pedido (`POST /orders`). En apuntes: debe estar publicado y ser de pago; si ya tiene un pedido vivo se reutiliza y, si ya lo compró, responde `409 ALREADY_OWNED`.
2. Paga por Yape/Plin al QR o dato del vendedor y declara el pago (`POST /orders/:id/pay`) con n.º de operación y/o voucher. El voucher debe ser un archivo que subió él mismo (`400 BAD_PROOF`). → `PAID`.
3. El vendedor revisa su app de Yape/Plin y confirma (`POST /orders/:id/confirm-payment`). → `ESCROW`: el apunte se desbloquea.
4. El comprador confirma la recepción (`POST /orders/:id/confirm-receipt`). → `RELEASED`.

## Mercado Pago (Checkout Pro)

Se activa solo si están `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`. Con la pasarela activa `POST /orders/:id/pay` responde `409 GATEWAY_REQUIRED`: el pago solo lo confirma el webhook.

| Variable | Dónde se obtiene |
|---|---|
| `MP_ACCESS_TOKEN` | Mercado Pago Developers → Tus integraciones → Credenciales (`TEST-…` en pruebas, `APP_USR-…` en producción) |
| `MP_WEBHOOK_SECRET` | Tus integraciones → Webhooks → "Clave secreta" (evento **Pagos**) |
| `API_PUBLIC_URL` | URL HTTPS pública de la API. Mercado Pago no notifica a `localhost`: en dev usa un túnel (`ngrok http 4000`) |
| `MP_API_BASE` | Opcional; por defecto `https://api.mercadopago.com` |

URL del webhook que hay que registrar: `${API_PUBLIC_URL}/api/v1/payments/webhook`.

Flujo:
1. El checkout pide `GET /payments/config` y, si es `mercadopago`, muestra "Pagar con Mercado Pago".
2. `POST /payments/checkout/:orderId` crea la preferencia (`external_reference` = id del pedido, moneda PEN, vence con la reserva) y redirige al comprador.
3. El webhook valida `x-signature` (HMAC-SHA256 del manifiesto `id;request-id;ts`), vuelve a leer el pago en la API de Mercado Pago y exige `approved`, `external_reference` y monto exacto. → `ESCROW` + notificaciones.
4. Si el monto no cuadra (`payment.mismatch`) o el pedido ya estaba cerrado (`payment.orphan`), no se libera nada: queda en `AuditLog` para reembolso manual desde el panel de Mercado Pago.

Con la pasarela, el dinero entra a la cuenta de la plataforma, no a la del vendedor. El pago al vendedor (neto después del 13 %) sigue siendo manual. Los reembolsos (`POST /orders/:id/refund`) solo cambian el estado; la devolución hay que hacerla en Mercado Pago.

## Pruebas locales de la pasarela

1. Crea usuarios de prueba (vendedor y comprador) en Tus integraciones → Cuentas de prueba.
2. Pon en `.env` el `MP_ACCESS_TOKEN` TEST, el `MP_WEBHOOK_SECRET` y el `API_PUBLIC_URL` del túnel, y reinicia la API.
3. Compra un apunte con la tarjeta de prueba aprobada (titular `APRO`). En segundos el checkout pasa a "Pago verificado" y el visor muestra el documento completo.
