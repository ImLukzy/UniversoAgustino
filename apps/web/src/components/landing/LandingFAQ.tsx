import { Accordion } from "../Accordion";
import { Reveal } from "./Reveal";
import { FAQS } from "../../data/landingFaq";

// FAQ enriquecida (spec 17): pagos, comisión, custodia, bazar, correo UNSA,
// desbloqueo y reembolsos. Tarjetas rudo del Accordion único de la app.
export function LandingFAQ() {
  return (
    <section id="faq" className="scroll-mt-4 bg-white py-24">
      <Reveal className="mx-auto max-w-4xl px-4">
        <p className="eyebrow text-center">Ayuda</p>
        <h2 className="h-display mb-3 mt-2 text-center text-3xl sm:text-4xl">Preguntas frecuentes</h2>
        <p className="mx-auto mb-10 max-w-xl text-center text-zinc-600">Todo lo que necesitas saber antes de comprar o vender en Universo Agustino.</p>
        <Accordion
          defaultOpen={0}
          items={FAQS.map((f, i) => ({ id: `faq-${i}`, icon: f.icon, eyebrow: f.topic, title: f.q, body: <p>{f.a}</p> }))}
        />
      </Reveal>
    </section>
  );
}
