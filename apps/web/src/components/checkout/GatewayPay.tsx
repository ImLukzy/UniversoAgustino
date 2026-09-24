import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api, apiError, pen, type HubOrder } from "../../lib/api";
import { SPRING } from "../../lib/motion";

export type PayProvider = "manual" | "mercadopago";

// Pasarela activa en el servidor (spec 16). Mientras carga se asume manual:
// es el flujo que existe siempre.
export function usePayProvider(): PayProvider {
  const q = useQuery({
    queryKey: ["payments-config"],
    queryFn: async () => (await api.get("/payments/config")).data.data.provider as PayProvider,
    staleTime: 10 * 60_000,
  });
  return q.data ?? "manual";
}

// Pago con Mercado Pago (Checkout Pro): el servidor crea la preferencia y el
// webhook firmado confirma el pago; aquí solo se redirige.
export function GatewayPay({ order }: { order: HubOrder }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const go = async () => {
    setBusy(true);
    setErr("");
    try {
      const r = await api.post(`/payments/checkout/${order.id}`);
      window.location.assign(r.data.data.url as string);
    } catch (e) {
      setErr(apiError(e));
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="material-symbols-outlined flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary-soft text-3xl text-primary">credit_card</span>
      <p className="max-w-xs text-sm text-zinc-500">
        Paga <b className="text-zinc-900">{pen(order.amountCents)}</b> con tarjeta, Yape o saldo en Mercado Pago. El pago queda en custodia y se confirma solo.
      </p>
      <motion.button type="button" onClick={go} disabled={busy} whileTap={{ scale: 0.97 }} transition={SPRING} className="btn btn-primary btn-lg w-full">
        {busy ? "Abriendo Mercado Pago…" : "Pagar con Mercado Pago"}
      </motion.button>
      <p role="alert" className="min-h-[1.25rem] text-xs text-red-600">{err}</p>
    </div>
  );
}
