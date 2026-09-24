import { useState } from "react";
import { motion } from "framer-motion";
import { pen, resolveQr, type HubOrder } from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { SPRING } from "../../lib/motion";

type Method = "YAPE" | "PLIN";
const LABEL: Record<Method, string> = { YAPE: "Yape", PLIN: "Plin" };

// Paso "Pagar": tabs según el payMethod congelado en el pedido, QR del
// vendedor (servido desde /uploads) y dato receptor copiable.
export function PayMethodPanel({ order }: { order: HubOrder }) {
  const methods: Method[] = order.payMethod === "AMBAS" ? ["YAPE", "PLIN"] : [order.payMethod === "PLIN" ? "PLIN" : "YAPE"];
  const [method, setMethod] = useState<Method>(methods[0]);
  const toast = useToast();
  const qr = resolveQr(order.payQrUrl);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.payDetail ?? "");
      toast.success("Copiado", order.payDetail ?? undefined);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div role="tablist" aria-label="Método de pago" className="flex w-full rounded-xl bg-zinc-100 p-1">
        {methods.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === method}
            onClick={() => setMethod(m)}
            className={`relative flex-1 rounded-lg py-2 text-sm font-semibold ${m === method ? "text-zinc-900" : "text-zinc-500"}`}
          >
            {m === method && <motion.span layoutId="pay-method" transition={SPRING} className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
            <span className="relative">{LABEL[m]}</span>
          </button>
        ))}
      </div>
      <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm">
        {qr ? (
          <img src={qr} alt={`QR de ${LABEL[method]} del vendedor`} width={200} height={200} className="h-full w-full rounded-xl object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 text-center text-xs text-zinc-500">
            <span className="material-symbols-outlined text-4xl text-zinc-300">qr_code_2</span>
            El vendedor aún no subió su QR. Usa el dato de abajo.
          </span>
        )}
      </div>
      <p className="text-center text-sm text-zinc-500">
        Abre {LABEL[method]} y paga <b className="text-zinc-900">{pen(order.amountCents)}</b>
      </p>
      {order.payDetail && (
        <button
          type="button"
          onClick={copy}
          className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-zinc-900 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Dato receptor</span>
            <span className="block truncate font-display text-lg font-bold text-zinc-900">{order.payDetail}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-base">content_copy</span> Copiar
          </span>
        </button>
      )}
    </div>
  );
}
