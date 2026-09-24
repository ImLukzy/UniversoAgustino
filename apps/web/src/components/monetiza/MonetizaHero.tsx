import { Link } from "react-router-dom";
import { PLATFORM_FEE_PCT } from "@hub/shared";
import { ROUTES } from "../../lib/routes";

// Hechos reales del producto (nada de cifras de tráfico inventadas).
const FACTS = [
  { value: `${100 - PLATFORM_FEE_PCT}%`, label: "del precio es para ti" },
  { value: "Yape · Plin", label: "cobro directo, en custodia" },
  { value: "2 págs.", label: "de vista previa gratis" },
];

export function MonetizaHero({ desc, careerLabel }: { desc: string; careerLabel?: string }) {
  return (
    <section className="border-b-2 border-zinc-900 bg-[rgb(var(--ua-paper))]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.3fr_1fr] lg:py-20">
        <div>
          <p className="eyebrow">{careerLabel ? `Monetiza · ${careerLabel}` : "Monetización académica responsable"}</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">
            Convierte tus apuntes en <span className="text-primary theme-transition">ingresos</span> para tu carrera
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600">{desc}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={ROUTES.publish} className="btn btn-primary btn-lg">
              <span className="material-symbols-outlined text-xl">upload_file</span>
              Subir material
            </Link>
            <a href="#simulador" className="btn btn-secondary btn-lg">
              <span className="material-symbols-outlined text-xl">calculate</span>
              Calcular ganancias
            </a>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {FACTS.map((f) => (
            <li key={f.label} className="card flex items-baseline gap-3 px-5 py-4">
              <span className="price text-2xl text-zinc-950">{f.value}</span>
              <span className="text-sm text-zinc-600">{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
