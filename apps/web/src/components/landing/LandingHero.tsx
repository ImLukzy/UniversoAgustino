import { motion } from "framer-motion";
import { LandingNav } from "./LandingNav";
import { HeroBlobs } from "./HeroBlobs";
import { HeroWidgetCard } from "./HeroWidgetCard";
import { SPRING } from "../../lib/motion";

export function LandingHero() {
  return (
    <header className="relative isolate overflow-hidden bg-[#28132c] pb-20">
      <HeroBlobs />
      <LandingNav />
      <div className="mx-auto max-w-4xl px-4 pt-16 text-center sm:pt-24">
        <motion.h1
          initial={{ y: 12 }}
          animate={{ y: 0 }}
          transition={SPRING}
          className="text-balance font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl"
        >
          Aprueba con los apuntes de quienes ya lo lograron
        </motion.h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-200 sm:text-[1.375rem] sm:leading-8">
          Resúmenes, parciales, finales y balotarios hechos por estudiantes agustinos. Paga seguro con Yape, Plin o Mercado Pago, o sube tus apuntes y gana dinero.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="px-4"
      >
        <HeroWidgetCard />
      </motion.div>
    </header>
  );
}
