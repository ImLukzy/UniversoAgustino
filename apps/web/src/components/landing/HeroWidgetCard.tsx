import { useState, type DragEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { useAuthModal } from "../AuthModalHost";

const QUICK = [
  { icon: "fact_check", label: "Parciales", q: "parcial" },
  { icon: "task_alt", label: "Finales", q: "final" },
  { icon: "quiz", label: "Balotarios", q: "balotario" },
  { icon: "summarize", label: "Resúmenes", q: "resumen" },
];

// Widget del hero (rudo): subir material (requiere cuenta) y buscar en el catálogo.
export function HeroWidgetCard() {
  const nav = useNavigate();
  const { openAuth } = useAuthModal();
  const [q, setQ] = useState("");
  const [dragging, setDragging] = useState(false);

  const explore = (term: string) => nav(term ? `${ROUTES.explore}?q=${encodeURIComponent(term)}` : ROUTES.explore);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    explore(q.trim());
  };
  // Subir requiere cuenta: abre el registro.
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    openAuth();
  };

  return (
    <div className="relative mx-auto mt-12 max-w-3xl rounded-3xl border-2 border-zinc-900 bg-white shadow-[8px_8px_0_0_rgb(var(--hub-p))]">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={`flex flex-col items-center gap-2 rounded-t-[1.4rem] border-b-2 border-dashed border-zinc-900 px-6 pb-6 pt-8 text-center transition-colors ${dragging ? "bg-primary-soft" : "bg-zinc-50"}`}
      >
        <span className="material-symbols-outlined flex h-14 w-14 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-3xl text-zinc-900">cloud_upload</span>
        <p className="font-display text-2xl font-bold tracking-tight text-zinc-900">Arrastra y suelta tus apuntes</p>
        <p className="text-sm text-zinc-600">
          O{" "}
          <button type="button" onClick={openAuth} className="font-bold text-primary hover:underline">elige archivos</button>
          {" "}para subirlos y ganar dinero
        </p>
        <p className="text-[11px] text-zinc-500">PDF, JPG o PNG · hasta 25 MB. Al subir aceptas nuestros términos y la política de derechos de autor.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4 px-5 pb-5 pt-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar materiales de estudio"
          placeholder="Busca un curso, parcial, final o balotario"
          className="h-8 w-full bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        <div className="flex items-center gap-2">
          <button type="button" onClick={openAuth} aria-label="Subir archivo" className="btn btn-secondary btn-icon h-9 w-9">
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
            {QUICK.map((p) => (
              <button key={p.label} type="button" onClick={() => explore(p.q)} className="chip shrink-0">
                <span className="material-symbols-outlined text-base">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
          <button type="submit" aria-label="Buscar" className="btn btn-primary btn-icon h-9 w-9">
            <span className="material-symbols-outlined text-xl">search</span>
          </button>
        </div>
      </form>
    </div>
  );
}
