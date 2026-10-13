import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { LandingHero } from "../components/landing/LandingHero";

const LandingSections = lazy(() => import("./LandingSections").then((module) => ({ default: module.LandingSections })));

// Carga las secciones tras el hero sin bloquear el LCP: al acercarse con scroll o, si no
// hay scroll posible, tras un breve respiro. El hueco reserva altura para que se pueda bajar.
function DeferredSections() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) { setVisible(true); return; }
    const show = () => setVisible(true);
    const timer = window.setTimeout(show, 1500);
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) show(); }, { rootMargin: "400px 0px" });
    observer.observe(element);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);
  return <div ref={ref} className={visible ? undefined : "min-h-screen"}>{visible && <Suspense fallback={<div className="min-h-screen" />}><LandingSections /></Suspense>}</div>;
}

// Landing pública long-scroll estilo Studocu.
// Si withSession es true, adaptada para usuarios con sesión.
export function PublicLanding({ withSession, sessionPending }: { withSession?: boolean; sessionPending?: boolean } = {}) {
  return (
    <main className="bg-white">
      <LandingHero withSession={withSession} sessionPending={sessionPending} />
      <DeferredSections />
    </main>
  );
}
