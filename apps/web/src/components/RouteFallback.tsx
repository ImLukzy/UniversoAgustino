// Fallback de Suspense para rutas lazy (Sprint 4): mantiene header/pie
// visibles (los layouts los renderizan) y muestra esqueleto en el contenido.
export function RouteFallback() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10" role="status" aria-label="Cargando página">
      <span className="sr-only">Cargando página…</span>
      <div className="animate-pulse rounded-xl bg-slate-200 p-6" aria-hidden="true">
        <div className="h-6 w-2/5 rounded bg-slate-300" />
        <div className="mt-3 h-4 w-4/5 rounded bg-slate-300" />
        <div className="mt-2 h-4 w-3/5 rounded bg-slate-300" />
      </div>
    </main>
  );
}
