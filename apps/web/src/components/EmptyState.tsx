import type { ReactNode } from "react";

// Estado vacío minimalista (Impeccable): icono, texto directo sin jerga y
// acción principal destacada. Entrada suave; los textos los pone cada página
// (cero copy inventado acá).
export function EmptyState({
  icon,
  title,
  hint,
  action,
  boxed = false,
  className = "",
  titleAs = "p",
  titleClassName = "",
}: {
  icon: string;
  title: string;
  hint?: string;
  action?: ReactNode;
  /** Caja punteada rudo: el único marco de lista vacía de la app. */
  boxed?: boolean;
  className?: string;
  titleAs?: "p" | "h1";
  titleClassName?: string;
}) {
  const Title = titleAs;
  return (
    <div className={`empty-state-enter flex flex-col items-center gap-2 px-4 py-8 text-center ${boxed ? "card-dashed" : ""} ${className}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary-soft text-primary">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </span>
      <Title className={`font-extrabold text-zinc-950 ${titleClassName}`}>{title}</Title>
      {hint && <p className="max-w-sm text-sm text-zinc-600">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
