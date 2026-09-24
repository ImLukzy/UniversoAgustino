import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { Reveal } from "./Reveal";
import { DocFanMock, PaymentMock } from "./FeatureMocks";

interface Row {
  title: string;
  body: string;
  points: string[];
  mock: ReactNode;
  bg: string;
  flip: boolean;
  cta: { label: string; onClick: () => void };
}

const toFaq = () => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });

// Filas alternadas texto / ilustración (anatomía Studocu, estética rudo:
// panel con borde zinc-900 y sombra dura; acentos solo con primary*).
export function FeatureRows() {
  const nav = useNavigate();
  const rows: Row[] = [
    {
      title: "Descarga resúmenes, parciales y finales verificados",
      body: "Material de estudiantes agustinos verificados con su correo @unsa.edu.pe, ordenado por escuela, curso y ciclo.",
      points: ["Páginas de muestra gratis antes de pagar", "Descárgalo desde Mis pedidos cuando se verifica tu pago"],
      mock: <DocFanMock />,
      bg: "bg-primary-soft",
      flip: true,
      cta: { label: "Explorar material", onClick: () => nav(ROUTES.explore) },
    },
    {
      title: "Compra segura con Yape, Plin o Mercado Pago",
      body: "Registras tu número de operación o voucher y el vendedor valida el pago; con Mercado Pago la confirmación es automática.",
      points: ["Tu dinero queda en custodia hasta que confirmas", "Reembolso si el material no corresponde"],
      mock: <PaymentMock />,
      bg: "bg-zinc-100",
      flip: false,
      cta: { label: "Cómo funcionan los pagos", onClick: toFaq },
    },
  ];

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl space-y-20 px-4 sm:space-y-28">
        {rows.map((r) => (
          <Reveal key={r.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div className={r.flip ? "md:order-2" : ""}>
              <h3 className="text-balance font-display text-3xl font-extrabold leading-[1.15] tracking-tight text-zinc-950 sm:text-[2.5rem]">{r.title}</h3>
              <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 sm:text-xl">{r.body}</p>
              <ul className="mt-5 space-y-2">
                {r.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 font-semibold text-zinc-800">
                    <span aria-hidden="true" className="material-symbols-outlined flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary text-sm text-primary-ink">check</span>
                    {p}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={r.cta.onClick} className="btn btn-primary btn-lg mt-7">
                {r.cta.label}
              </button>
            </div>
            <div className={`panel px-6 py-12 sm:px-10 ${r.bg} ${r.flip ? "md:order-1" : ""}`}>
              {r.mock}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
