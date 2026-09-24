import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";

// Fila de chips-pestaña con el relleno activo compartido (layoutId): filtro
// único de la landing (exámenes por facultad, escuelas por área).
export function ChipTabs<T extends string | number>({
  id,
  label,
  items,
  value,
  onChange,
  controls,
}: {
  id: string;
  label: string;
  items: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  controls?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="mt-8 flex flex-wrap justify-center gap-2">
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={controls}
            onClick={() => onChange(it.value)}
            className={`chip relative ${on ? "text-white hover:bg-zinc-900" : ""}`}
          >
            {on && <motion.span layoutId={id} transition={SPRING} className="absolute inset-0 rounded-full bg-zinc-900" />}
            <span className="relative">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
