import type { ReactNode } from "react";
import { motion } from "framer-motion";

// Estado vacío minimalista (Impeccable): icono, texto directo sin jerga y
// acción principal destacada. Entrada suave; los textos los pone cada página
// (cero copy inventado acá).
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col items-center gap-2 py-4 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </span>
      <p className="font-bold text-slate-800">{title}</p>
      {hint && <p className="max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
