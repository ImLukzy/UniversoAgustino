import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { BazarGrid, type BazarFilter } from "../components/bazar/BazarGrid";
import { EscrowSteps } from "../components/bazar/EscrowSteps";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/career";
import { ROUTES } from "../lib/routes";

const FILTERS: { id: BazarFilter; label: string; icon: string }[] = [
  { id: "all", label: "Todo", icon: "widgets" },
  { id: "libros", label: "Libros", icon: "menu_book" },
  { id: "instrumental", label: "Instrumental", icon: "medical_services" },
  { id: "uniformes", label: "Uniformes", icon: "checkroom" },
  { id: "alquiler", label: "Alquiler por ciclo", icon: "schedule" },
];

// /bazar: libros, instrumental y uniformes de segunda mano entre estudiantes.
export function Bazar() {
  const { accent, career } = useCareerTheme();
  const cc = careerContent(career);
  const [filter, setFilter] = useState<BazarFilter>("all");
  const [q, setQ] = useState("");

  return (
    <AppLayout fluid>
      <section className="border-b-2 border-zinc-900 bg-[rgb(var(--ua-paper))]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Bazar UNSA · Arequipa</p>
            <h1 className="h-display mt-3 text-4xl sm:text-5xl">Libros, instrumental y uniformes de segunda vida</h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">Compra o alquila por ciclo a otros estudiantes, con reserva y custodia del pedido.</p>
          </div>
          <Link to={ROUTES.publish} className="btn btn-primary btn-lg self-start lg:self-auto">
            <span className="material-symbols-outlined text-xl">add_circle</span>
            Publicar artículo
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Siempre presente: la carrera del perfil llega tras la sesión y no debe empujar la rejilla (A7). */}
        <div className="card mb-6 flex flex-col justify-between gap-3 bg-primary-soft p-4 sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-800"><b>{accent?.label ??"Todas las carreras"}:</b> {cc.bazarHint}</p>
          {cc.bazarSuggest && (
            <button type="button" onClick={() => setQ(cc.bazarSuggest)} className="btn btn-dark btn-sm">Buscar “{cc.bazarSuggest}”</button>
          )}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Filtrar bazar" className="flex gap-2 overflow-x-auto p-1">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? "chip-active" : ""}`}>
                <span className="material-symbols-outlined text-base">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
          <label className="searchbar lg:max-w-xs">
            <span className="material-symbols-outlined text-zinc-500" aria-hidden="true">search</span>
            <span className="sr-only">Buscar en el bazar</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar libro, marca o talla…" />
          </label>
        </div>
        <div className="mt-8 min-h-[40vh]">
          <BazarGrid filter={filter} q={q} />
        </div>
      </div>
      <EscrowSteps spots={cc.meetSpots} times={cc.meetTimes} />
    </AppLayout>
  );
}
