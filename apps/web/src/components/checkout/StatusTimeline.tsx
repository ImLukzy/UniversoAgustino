import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";

type Step = { key: string; label: string };

const BASE: Step[] = [
  { key: "PENDING", label: "Pendiente" },
  { key: "PAID", label: "Pagado" },
  { key: "ESCROW", label: "En custodia" },
  { key: "RELEASED", label: "Liberado" },
];
// "Aceptado" solo existe en el alquiler de bazar (los documentos lo saltan).
const RENTAL: Step[] = [BASE[0], { key: "ACCEPTED", label: "Aceptado" }, ...BASE.slice(1)];

// Timeline de la máquina de estados del pedido. CANCELLED / REFUNDED son
// terminales fuera del camino feliz: se muestran como aviso, no como paso.
export function StatusTimeline({ status, rental }: { status: string; rental: boolean }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <p className="rounded-xl bg-zinc-50 px-4 py-3 text-center text-sm font-semibold text-zinc-600">
        {status === "CANCELLED" ? "Pedido cancelado" : "Pago reembolsado al comprador"}
      </p>
    );
  }
  const steps = rental ? RENTAL : BASE;
  const current = Math.max(0, steps.findIndex((s) => s.key === status));
  return (
    <ol className="flex items-start" aria-label="Estado del pedido">
      {steps.map((s, i) => {
        const done = i < current || status === "RELEASED";
        const now = i === current && status !== "RELEASED";
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center gap-1.5" aria-current={now ? "step" : undefined}>
            {i > 0 && (
              <span className="absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2 bg-zinc-100" aria-hidden="true">
                <motion.span
                  className="block h-full bg-primary"
                  initial={false}
                  animate={{ scaleX: i <= current ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={SPRING}
                />
              </span>
            )}
            <motion.span
              initial={false}
              animate={{ scale: now ? 1.1 : 1 }}
              transition={SPRING}
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                done ? "bg-primary text-primary-ink" : now ? "bg-primary-soft text-primary ring-2 ring-primary" : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {done ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
            </motion.span>
            <span className={`text-center text-[11px] font-semibold ${now ? "text-primary" : done ? "text-zinc-700" : "text-zinc-400"}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
