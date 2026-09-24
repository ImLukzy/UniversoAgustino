import crypto from "node:crypto";
import { env } from "../env.js";

// Cliente mínimo de Mercado Pago Checkout Pro (spec 16, docs/payments.md).
// Sin SDK: dos llamadas REST (crear preferencia y leer un pago) y la
// verificación HMAC del webhook.

export const mpEnabled = () => !!(env.MP_ACCESS_TOKEN && env.MP_WEBHOOK_SECRET);

export interface MpPayment {
  id: number | string;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
}

interface PrefOrder {
  id: string;
  itemId: string;
  itemTitle: string;
  amountCents: number;
  expiresAt: Date | null;
}

async function mp<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${env.MP_API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`Mercado Pago ${r.status} en ${path}`);
  return (await r.json()) as T;
}

// Preferencia de pago de un pedido. external_reference = order.id: es lo único
// que el webhook usa para encontrar el pedido (junto al monto exacto).
export async function createPreference(order: PrefOrder, webOrigin: string): Promise<string> {
  const back = `${webOrigin}/checkout/${order.id}`;
  const pref = await mp<{ init_point: string }>("/checkout/preferences", {
    method: "POST",
    headers: { "X-Idempotency-Key": `pref-${order.id}` },
    body: JSON.stringify({
      items: [{ id: order.itemId, title: order.itemTitle.slice(0, 250), quantity: 1, currency_id: "PEN", unit_price: order.amountCents / 100 }],
      external_reference: order.id,
      notification_url: `${env.API_PUBLIC_URL}${env.PREFIX}/payments/webhook`,
      back_urls: { success: back, pending: back, failure: back },
      auto_return: "approved",
      ...(order.expiresAt ? { expires: true, expiration_date_to: order.expiresAt.toISOString() } : {}),
    }),
  });
  return pref.init_point;
}

export const fetchPayment = (id: string) => mp<MpPayment>(`/v1/payments/${encodeURIComponent(id)}`);

// x-signature = "ts=<ts>,v1=<hmac>"; manifiesto oficial:
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" firmado con HMAC-SHA256.
export function verifySignature(xSignature: string | undefined, xRequestId: string | undefined, dataId: string, secret = env.MP_WEBHOOK_SECRET): boolean {
  if (!xSignature || !secret || !dataId) return false;
  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};${xRequestId ? `request-id:${xRequestId};` : ""}ts:${parts.ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
