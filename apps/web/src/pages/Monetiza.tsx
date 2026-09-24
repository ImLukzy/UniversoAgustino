import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { MonetizaHero } from "../components/monetiza/MonetizaHero";
import { EarningsSimulator } from "../components/monetiza/EarningsSimulator";
import { PublishSteps } from "../components/monetiza/PublishSteps";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/career";
import { ROUTES } from "../lib/routes";

// /monetiza: propuesta de valor, simulador local y el flujo real de
// publicación (que vive en /publicar, con sesión). Textos por carrera.
export function Monetiza() {
  const { accent, career } = useCareerTheme();
  const cc = careerContent(career);
  return (
    <AppLayout fluid>
      <MonetizaHero desc={cc.monetizaDesc} careerLabel={accent?.label} />
      {/* key: al cambiar de carrera, el simulador vuelve a sus valores sugeridos. */}
      <EarningsSimulator key={career} cc={cc} careerLabel={accent?.label} />
      <PublishSteps />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="card flex flex-col items-start justify-between gap-6 bg-primary p-8 text-primary-ink sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="eyebrow text-primary-ink/80">Financia tu carrera</p>
            <h2 className="h-display mt-2 text-3xl text-primary-ink sm:text-4xl">{cc.ctaTitle}</h2>
            <p className="mt-3 leading-relaxed text-primary-ink/90">{cc.ctaBody}</p>
          </div>
          <Link to={ROUTES.publish} className="btn btn-secondary btn-lg">Subir mi primer apunte</Link>
        </div>
      </section>
    </AppLayout>
  );
}
