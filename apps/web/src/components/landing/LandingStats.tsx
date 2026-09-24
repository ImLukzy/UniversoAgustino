import { Reveal } from "./Reveal";
import { SHOWCASE } from "../../data/landingCareers";

// Cifras de marketing definidas por producto (no se leen de la base de datos).
const STATS = [
  { value: "+15,000", icon: "description", label: "Recursos de estudio", tag: "Nuevos cada semana" },
  { value: String(SHOWCASE.length), icon: "account_balance", label: "Escuelas profesionales", tag: "Biomédicas, Ingenierías y Sociales" },
  { value: "+10,000", icon: "person", label: "Estudiantes activos", tag: "Cada ciclo" },
];

export function LandingStats() {
  return (
    <section className="bg-white pb-20 pt-4 sm:pb-24">
      <Reveal className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-5xl">Miles de estudiantes agustinos conectados</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600 sm:text-xl">Material nuevo cada semana, de la comunidad estudiantil más activa de Arequipa.</p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-5xl gap-5 px-4 text-center sm:grid-cols-3">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="card flex flex-col items-center px-4 py-8">
            <p className="font-display text-5xl font-bold tracking-tight text-zinc-950">{s.value}</p>
            <p className="mt-2 flex items-center gap-1.5 text-zinc-700">
              <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">{s.icon}</span>
              {s.label}
            </p>
            <span className="tag mt-3 bg-primary-soft normal-case">{s.tag}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
