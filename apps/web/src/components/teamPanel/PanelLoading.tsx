// Estado de carga con alto reservado (CLS = 0): bloques que ocupan el sitio de las tarjetas.
export function PanelLoading({ label, rows = 3 }: { label: string; rows?: number }) {
  return <div role="status" aria-busy="true" className="flex min-w-0 flex-col gap-4" style={{ minHeight: rows * 112 }}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }, (_, i) => <div key={i} aria-hidden="true" className="card h-24 animate-pulse !bg-zinc-100" />)}
  </div>;
}
