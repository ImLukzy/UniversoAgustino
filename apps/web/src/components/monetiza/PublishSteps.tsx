import { Link } from "react-router-dom";
import { PLATFORM_FEE_PCT } from "@hub/shared";
import { ROUTES } from "../../lib/routes";
import { Accordion } from "../Accordion";

const STEPS = [
  { icon: "school", title: "Datos del apunte", body: "Título, curso, ciclo y carrera para que tus compañeros lo encuentren." },
  { icon: "cloud_upload", title: "Archivo y cobro", body: "Sube tu PDF o imágenes y tu QR de Yape o Plin. Las 2 primeras páginas quedan de vista previa." },
  { icon: "gavel", title: "Declaración de autoría", body: "Confirmas que es material propio (D.L. 822). Lo que infrinja derechos se da de baja." },
];

const FAQ = [
  {
    id: "cobro",
    icon: "send_to_mobile",
    title: "¿Cómo recibo el dinero?",
    body: <p>El comprador paga a tu Yape o Plin y envía su constancia. El pedido queda en custodia hasta que confirma la entrega; entonces se libera.</p>,
  },
  {
    id: "comision",
    icon: "payments",
    title: `¿Cuánto es la comisión?`,
    body: <p>{`El ${PLATFORM_FEE_PCT}% del precio. El resto (${100 - PLATFORM_FEE_PCT}%) es tuyo; el monto se congela al reservar, así nunca cambia a mitad del pedido.`}</p>,
  },
  {
    id: "copias",
    icon: "security",
    title: "¿Pueden copiar mi apunte?",
    body: <p>Solo se muestran las 2 primeras páginas; el documento completo se desbloquea tras la compra. Si detectas una copia, repórtala y se retira en menos de 48 horas.</p>,
  },
];

// Flujo real de publicación (vive en /publicar, con sesión) + preguntas de cobro.
export function PublishSteps() {
  return (
    <section className="border-y-2 border-zinc-900 bg-[rgb(var(--ua-paper))]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <p className="eyebrow">Publica en 3 pasos</p>
        <h2 className="h-display mt-2 text-3xl sm:text-4xl">De tu cuaderno al catálogo en minutos</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-6">
              <span className="flex items-center gap-3">
                <span className="price flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary text-primary-ink">{i + 1}</span>
                <span className="material-symbols-outlined text-2xl text-zinc-900">{s.icon}</span>
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-zinc-950">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <Link to={ROUTES.publish} className="btn btn-dark btn-lg mt-8">
          Empezar a publicar
          <span className="material-symbols-outlined text-xl">arrow_forward</span>
        </Link>
        <div className="mt-14 max-w-3xl">
          <Accordion items={FAQ} />
        </div>
      </div>
    </section>
  );
}
