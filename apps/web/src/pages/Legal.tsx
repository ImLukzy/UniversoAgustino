import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ComplianceMatrix } from "../components/legal/ComplianceMatrix";
import { CreatorTerms } from "../components/legal/CreatorTerms";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/career";
import { ROUTES } from "../lib/routes";

const TAKEDOWN = [
  { icon: "mark_email_read", title: "Reporte", body: "El titular reporta el material desde Gestión de ventas → Reportar, con el enlace y el fragmento vulnerado." },
  { icon: "block", title: "Baja preventiva", body: "Moderación retira el documento del catálogo en menos de 48 horas mientras revisa el caso." },
  { icon: "rule", title: "Resolución", body: "El creador puede sustentar su autoría. Si se confirma la infracción, el material se elimina." },
];

// /legal: marco D.L. 822 y ética académica con textos por carrera.
export function Legal() {
  const { career } = useCareerTheme();
  const cc = careerContent(career);
  return (
    <AppLayout fluid>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <p className="eyebrow">Derecho de autor · D.L. 822 · Ley Universitaria 30220</p>
        <h1 className="h-display mt-3 max-w-4xl text-4xl sm:text-5xl">Estudia, comparte y vende tus apuntes con total seguridad</h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-600">{cc.legalDesc}</p>
      </section>
      <ComplianceMatrix />
      <CreatorTerms />
      <section className="border-t-2 border-zinc-900 bg-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow text-zinc-400">Canal de reclamos</p>
          <h2 className="h-display mt-2 text-3xl text-white sm:text-4xl">Protocolo de retiro (notice &amp; takedown)</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {TAKEDOWN.map((s, i) => (
              <li key={s.title} className="rounded-2xl border-2 border-white/80 p-6">
                <span className="flex items-center gap-2 text-[#dcfc6b]">
                  <span className="material-symbols-outlined">{s.icon}</span>
                  <span className="eyebrow text-[#dcfc6b]">Paso {i + 1}</span>
                </span>
                <h3 className="mt-3 text-lg font-extrabold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-300">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={ROUTES.monetiza} className="btn btn-primary btn-lg">Monetizar éticamente</Link>
            <Link to={ROUTES.mySales} className="btn btn-secondary btn-lg">Reportar material</Link>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
