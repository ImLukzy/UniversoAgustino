import { motion } from "framer-motion";
import { pen } from "../../lib/api";
import { SPRING } from "../../lib/motion";

interface Props {
  // Páginas cubiertas ("3–7"); sin rango = todo lo que sigue a la muestra.
  range?: string;
  // Bloqueos posteriores al primero: franja baja con el mismo CTA.
  compact?: boolean;
  // Alto/ancho de las hojas del PDF: el hueco imita una página real (apaisadas incluidas).
  ratio?: number;
  priceCents: number;
  buying: boolean;
  error: string;
  onBuy: () => void;
}

function BuyButton({ priceCents, buying, onBuy, small }: Pick<Props, "priceCents" | "buying" | "onBuy"> & { small?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onBuy}
      disabled={buying}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      className={`btn btn-primary ${small ? "btn-sm shrink-0" : "mt-4"}`}
    >
      {buying ? "Creando pedido…" : `Desbloquear por ${pen(priceCents)}`}
    </motion.button>
  );
}

// Muro de pago (spec 06 + 16): cubre las páginas fuera de la muestra que eligió
// el vendedor. Esas páginas nunca llegan al cliente; aquí solo se reserva su
// hueco con altura fija (CLS ≈ 0).
export function Paywall({ range, compact, ratio = 1.414, priceCents, buying, error, onBuy }: Props) {
  const many = range?.includes("–");
  const title = !range ? "Contenido completo bloqueado" : many ? `Páginas ${range} bloqueadas` : `Página ${range} bloqueada`;
  if (compact) {
    return (
      <section aria-label={title} className="sheet flex h-36 flex-col items-center justify-center gap-3 bg-zinc-50 px-5 sm:h-28 sm:flex-row sm:justify-between sm:gap-4">
        <span className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-zinc-400">lock</span>
          <span className="truncate text-sm font-bold text-zinc-900">{title}</span>
        </span>
        <BuyButton priceCents={priceCents} buying={buying} onBuy={onBuy} small />
      </section>
    );
  }
  return (
    <section aria-label={title} className="relative">
      <div aria-hidden="true" className="pointer-events-none min-h-80 w-full sheet" style={{ aspectRatio: `1 / ${ratio}` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-gradient-to-b from-zinc-100 via-white/90 to-white p-6 text-center">
        <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary-soft text-2xl text-primary">
          lock
        </span>
        <h2 className="mt-3 font-display text-xl font-bold text-zinc-900">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">
          Desbloquea el documento completo en alta resolución y descárgalo sin marcas de agua. Compra única, sin suscripción.
        </p>
        <BuyButton priceCents={priceCents} buying={buying} onBuy={onBuy} />
        <p role="alert" className="mt-2 min-h-5 text-sm font-semibold text-red-600">
          {error}
        </p>
      </div>
    </section>
  );
}
