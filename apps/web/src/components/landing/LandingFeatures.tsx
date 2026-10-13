import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "./Reveal";
import { FeatureRows } from "./FeatureRows";
import { ROUTES } from "../../lib/routes";

const ExamenInteractivo = lazy(() => import("../ExamenInteractivo").then((module) => ({ default: module.ExamenInteractivo })));

function DeferredExam() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="min-h-[42rem] md:min-h-[28rem]">
      {visible ? <Suspense fallback={<div aria-hidden="true" className="min-h-[42rem] animate-pulse rounded-2xl bg-zinc-100 md:min-h-[28rem]" />}><ExamenInteractivo /></Suspense> : <div aria-hidden="true" className="min-h-[42rem] md:min-h-[28rem]" />}
    </div>
  );
}

// Biblioteca de Balotarios y Exámenes UNSA (specs 19 y 23): facultad →
// examen → práctica en modo juego con explicación de cada respuesta.
export function LandingFeatures() {
  return (
    <>
      <section id="practica" className="scroll-mt-4 overflow-hidden bg-zinc-50 py-20 sm:py-24">
        <Reveal className="mx-auto max-w-4xl px-4 text-center">
          <p className="eyebrow">Práctica real</p>
          <h2 className="mt-2 text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-5xl">Biblioteca de Balotarios y Exámenes UNSA</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">Elige tu facultad y un examen tipo parcial, final, balotario o admisión: responde, mira tu marcador y aprende con la explicación de cada pregunta.</p>
        </Reveal>
        <Reveal className="mx-auto max-w-5xl px-4">
          <DeferredExam />
          <div className="mt-8 flex justify-center">
            <Link to={ROUTES.balotarios} className="btn btn-secondary">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">menu_book</span>
              Abrir la biblioteca completa
            </Link>
          </div>
        </Reveal>
      </section>
      <FeatureRows />
    </>
  );
}
