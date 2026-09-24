// Esqueleto base reutilizable (Sprint 3). Bloque pulsante con el color de
// superficie; aria-hidden porque el estado se anuncia una sola vez arriba.
function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} />;
}

export function ListRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando pedidos" className="flex flex-col gap-2">
      <span className="sr-only">Cargando pedidos…</span>
      <div className="flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="card flex items-center gap-3 p-4">
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

// Tarjeta de alquiler (Ventas): replica RentalCard para CLS = 0 — avatar +
// nombre + badge, bloque de fechas, 2 desgloses y fila de acciones.
export function RentalSkeleton() {
  return (
    <div aria-hidden="true" className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-12 w-12 !rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 !rounded-full" />
      </div>
      <Skeleton className="h-[104px] w-full" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-[104px] w-full" />
        <Skeleton className="h-[104px] w-full" />
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

// Ficha de detalle (/p/:type/:id): replica Detalle — badges, preview h-80,
// descripción y panel de compra — para entrar sin saltos de layout.
export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Cargando detalle" className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <span className="sr-only">Cargando detalle…</span>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 !rounded-full" />
          <Skeleton className="h-6 w-20 !rounded-full" />
          <Skeleton className="h-6 w-28 !rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-80 w-full !rounded-2xl" />
            <div className="card space-y-2 p-5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <div className="card space-y-3 p-5">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-11 w-11 !rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Cont
