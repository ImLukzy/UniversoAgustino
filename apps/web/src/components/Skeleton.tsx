import type { ReactNode } from "react";

// Esqueleto base reutilizable (Sprint 3). Bloque pulsante con el color de
// superficie; aria-hidden porque el estado se anuncia una sola vez arriba.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

// Grilla de tarjetas (marketplace, bazar, alquileres). Imita la forma final:
// imagen 16:9, fila de chips, 2 líneas de título y botón, para CLS ≈ 0.
export function CardGridSkeleton({
  count = 6,
  gridClassName = "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3",
}: {
  count?: number;
  gridClassName?: string;
}) {
  return (
    <div role="status" aria-label="Cargando contenido">
      <span className="sr-only">Cargando contenido…</span>
      <div className={gridClassName} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
            <Skeleton className="h-44 w-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 !rounded-full" />
              <Skeleton className="h-5 w-24 !rounded-full" />
            </div>
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Filas de lista (últimos pedidos del Panel). Imita PanelOrderRow:
// icono cuadrado + bloque de texto + bloque de precio/acción.
export function ListRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando pedidos" className="flex flex-col gap-2">
      <span className="sr-only">Cargando pedidos…</span>
      <div className="flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Skeleton className="h-12 w-12 shrink-0 !rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <div className="hidden flex-col items-end gap-1.5 sm:flex">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Contenedor tardío: muestra children solo si `when` sigue activo tras el
// retardo (evita parpadeo en cargas < 200 ms). Úsalo para skeletons.
export function Delayed({ when, ms = 200, children }: { when: boolean; ms?: number; children: ReactNode }) {
  const [show, setShow] = useDelayedFlag(when, ms);
  if (!show) return null;
  return <>{children}</>;
}

import { useEffect, useState } from "react";

function useDelayedFlag(active: boolean, delay: number): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) {
      setOn(false);
      return;
    }
    const t = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);
  return [on, setOn];
}
