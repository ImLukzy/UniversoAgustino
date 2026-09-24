import type { PublishForm } from "./usePublishForm";

const MODES = [
  { id: "digital" as const, icon: "description", title: "Apunte digital", sub: "PDF o imágenes con vista previa de 2 páginas." },
  { id: "fisico" as const, icon: "storefront", title: "Artículo de bazar", sub: "Libros, instrumental o uniformes con entrega en persona." },
];

// Título, selector de modo y progreso real de los 4 pasos.
export function PublishHeader({ form }: { form: PublishForm }) {
  const steps = [
    { t: form.mode === "digital" ? "Datos académicos" : "Datos del artículo", ok: form.done.details },
    { t: form.mode === "digital" ? "Archivo" : "Fotos y cobro", ok: form.done.file },
    { t: "Precio", ok: form.done.price },
    { t: "Declaración D.L. 822", ok: form.done.legal },
  ];
  return (
    <header className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Centro de creadores</p>
        <h1 className="h-display mt-2 text-3xl sm:text-4xl">Publica tu material</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">Comparte apuntes originales o artículos con la comunidad agustina. Cobras por Yape o Plin y el pedido queda en custodia hasta la entrega.</p>
      </div>
      <div role="radiogroup" aria-label="Tipo de publicación" className="grid gap-3 md:grid-cols-2">
        {MODES.map((m) => {
          const active = form.mode === m.id;
          return (
            <button key={m.id} type="button" role="radio" aria-checked={active} onClick={() => form.setMode(m.id)} className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${active ? "border-zinc-900 bg-primary-soft" : "border-zinc-200 bg-white hover:border-zinc-400"}`}>
              <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 bg-white text-2xl text-primary">{m.icon}</span>
              <span>
                <span className="block font-extrabold text-zinc-950">{m.title}</span>
                <span className="text-sm text-zinc-600">{m.sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <ol className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Progreso">
        {steps.map((s, i) => (
          <li key={s.t} className="flex items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 text-xs font-extrabold ${s.ok ? "bg-primary text-primary-ink" : "bg-white text-zinc-900"}`}>
              {s.ok ? <span className="material-symbols-outlined text-base">check</span> : i + 1}
            </span>
            <span className={`truncate text-xs font-bold ${s.ok ? "text-zinc-950" : "text-zinc-500"}`}>{s.t}</span>
          </li>
        ))}
      </ol>
    </header>
  );
}
