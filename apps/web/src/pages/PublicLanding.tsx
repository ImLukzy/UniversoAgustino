import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { LandingHero } from "../components/landing/LandingHero";

const LandingSections = lazy(() => import("./LandingSections").then((module) => ({ default: module.LandingSections })));

function DeferredSections() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "-100px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{visible && <Suspense fallback={null}><LandingSections /></Suspense>}</div>;
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
