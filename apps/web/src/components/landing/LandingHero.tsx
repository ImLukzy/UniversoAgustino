import { Link } from "react-router-dom";
import { LandingNav } from "./LandingNav";
import { HeroBlobs } from "./HeroBlobs";
import { HeroWidgetCard } from "./HeroWidgetCard";
import { ROUTES } from "../../lib/routes";

// Con sesión no hay zona de subida; el relleno inferior conserva el alto del hero público
// para que el fondo y los adornos no se recorten bajo el buscador.
export function LandingHero({ withSession, sessionPending }: { withSession?: boolean; sessionPending?: boolean } = {}) {
  return (
    <header className={`relative isolate overflow-hidden bg-[#28132c] ${withSession ? "pb-32 sm:pb-56" : "pb-20"}`}>
      <HeroBlobs />
      <LandingNav withSession={withSession} sessionPending={sessionPending} />
      <div className="mx-auto max-w-4xl px-4 pt-16 text-center sm:pt-24">
        <h1 className="hero-enter text-balance font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
          Aprueba con los apuntes de quienes ya lo lograron
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-200 sm:text-[1.375rem] sm:leading-8">
          Resúmenes, parciales, finales y balotarios hechos por estudiantes agustinos. Paga seguro con Yape, Plin o Mercado Pago, o sube tus apuntes y gana dinero.
        </p>
        {withSession && <Link to={ROUTES.explore} className="btn btn-primary mt-6">Ir a Explorar</Link>}
      </div>
      <div className="hero-enter hero-enter-delay px-4">
        <HeroWidgetCard withSession={withSession} />
      </div>
    </header>
  );
}
