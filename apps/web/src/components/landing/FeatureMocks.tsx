// Mocks de UI dibujados con divs (sin imágenes: cero peticiones y cero CLS).
// Estética rudo: borde zinc-900 y sombra dura (clases .card / .sheet).

const DOCS = [
  { tag: "Parcial", title: "Anatomía I · Unidad 2", rot: -10, x: -70 },
  { tag: "Resumen", title: "Farmacología clínica", rot: 0, x: 0 },
  { tag: "Final", title: "Microeconomía · Examen final", rot: 10, x: 70 },
];

// Abanico de miniaturas de documentos.
export function DocFanMock() {
  return (
    <div className="relative mx-auto flex h-64 w-full max-w-sm items-end justify-center" aria-hidden="true">
      {DOCS.map((d, i) => (
        <div
          key={d.title}
          className="sheet absolute bottom-0 h-56 w-40 origin-bottom p-4"
          style={{ transform: `translateX(${d.x}px) rotate(${d.rot}deg)`, zIndex: i === 1 ? 2 : 1 }}
        >
          <span className="tag">{d.tag}</span>
          <p className="mt-2 text-xs font-bold leading-tight text-zinc-900">{d.title}</p>
          <div className="mt-3 space-y-1.5">
            {[100, 85, 95, 70, 90, 60].map((w, j) => (
              <div key={j} className={`h-1.5 rounded-full ${j === 2 && i === 1 ? "bg-primary" : "bg-zinc-200"}`} style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const STEPS = [
  { icon: "verified", label: "Pago verificado" },
  { icon: "shield_lock", label: "En custodia" },
  { icon: "lock_open", label: "Liberado al confirmar" },
];

// Resumen del pedido: métodos de pago reales y la custodia hasta confirmar.
export function PaymentMock() {
  return (
    <div className="card mx-auto w-full max-w-sm p-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="tag">Resumen</span>
          <p className="mt-1 truncate font-display font-bold text-zinc-900">Farmacología clínica</p>
        </div>
        <p className="price text-2xl text-zinc-950">S/ 8.00</p>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {["Yape", "Plin", "Mercado Pago"].map((m, i) => (
          <span key={m} className={`rounded-xl border-2 border-zinc-900 px-2 py-2 text-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-ink" : "bg-white text-zinc-900"}`}>{m}</span>
        ))}
      </div>
      <ol className="mt-5 space-y-2">
        {STEPS.map((s, i) => (
          <li key={s.label} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-bold ${i < 2 ? "border-zinc-900 bg-primary-soft text-zinc-950" : "border-zinc-300 text-zinc-400"}`}>
            <span className={`material-symbols-outlined text-lg ${i < 2 ? "text-primary" : ""}`}>{s.icon}</span>
            {s.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
