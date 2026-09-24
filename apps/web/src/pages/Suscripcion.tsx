import { Link } from "react-router-dom";
import { PLATFORM_FEE_PCT } from "@hub/shared";
import { AppLayout } from "../components/AppLayout";
import { ROUTES } from "../lib/routes";

const FACTS = [
  "Explora y compra apuntes por pedido individual: solo pagas lo que te llevas.",
  `La comisión del ${PLATFORM_FEE_PCT}% la asume el vendedor; el precio que ves es el que pagas.`,
  `Si vendes tus apuntes, te quedas con el ${100 - PLATFORM_FEE_PCT}% de cada venta.`,
];

// Mi suscripción: Universo Agustino NO tiene premium ni planes. Esta página
// lo dice claro en lugar de fingir precios, periodos o checkouts.
export function Suscripcion() {
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <header>
          <p className="eyebrow">Tu acceso</p>
          <h1 className="h-display mt-2 text-3xl">Mi suscripción</h1>
        </header>
        <section className="card flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined flex h-12 w-12 items-center justify-center rounded-xl border-2 border-zinc-900 bg-[#dcfc6b] text-zinc-950">verified</span>
            <div>
              <p className="text-lg font-extrabold text-zinc-950">Acceso completo · Gratis</p>
              <p className="text-sm text-zinc-600">Sin planes, sin mensualidades, sin letra pequeña.</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-zinc-700">
            {FACTS.map((f) => <li key={f} className="flex gap-2"><span className="material-symbols-outlined text-base text-primary">check_circle</span>{f}</li>)}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.explore} className="btn btn-primary">Explorar apuntes</Link>
            <Link to={ROUTES.publish} className="btn btn-secondary">Publicar material</Link>
          </div>
        </section>
        <section className="card flex flex-col items-start gap-3 p-6">
          <h2 className="text-lg font-extrabold text-zinc-950">Mis pagos</h2>
          <p className="text-sm text-zinc-600">Cada compra genera un pedido con su constancia. Revísalos en tu historial.</p>
          <Link to={ROUTES.myOrders} className="btn btn-secondary">Ver mis pedidos</Link>
        </section>
      </div>
    </AppLayout>
  );
}
