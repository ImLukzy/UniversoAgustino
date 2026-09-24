import { Link } from "react-router-dom";
import { pen } from "../../lib/api";
import { ROUTES } from "../../lib/routes";

type Stat = { icon: string; label: string; value: string };

// Encabezado del panel de autor con métricas reales (API) y acciones rápidas.
export function PublicationsHeader({ stats, onMyQr, qrMsg }: { stats: { active: number; docs: number; bazar: number; net: number; orders: number; escrow: number }; onMyQr: () => void; qrMsg: string }) {
  const cards: Stat[] = [
    { icon: "menu_book", label: "Publicaciones activas", value: `${stats.active}` },
    { icon: "payments", label: "Neto liberado", value: pen(stats.net) },
    { icon: "receipt_long", label: "Pedidos recibidos", value: `${stats.orders}` },
    { icon: "lock", label: "En custodia", value: `${stats.escrow}` },
  ];
  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-xl">
          <p className="eyebrow">Panel de autor · {stats.docs} apuntes · {stats.bazar} bazar</p>
          <h1 className="h-display mt-2 text-3xl sm:text-4xl">Mis publicaciones</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Administra tus apuntes y artículos. Tus ventas se gestionan en <Link to={ROUTES.mySales} className="font-bold text-zinc-950 underline">Gestión de ventas</Link>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onMyQr} className="btn btn-secondary">
            <span className="material-symbols-outlined text-lg">qr_code_2</span> Mi QR de cobro
          </button>
          <Link to={ROUTES.publish} className="btn btn-primary">
            <span className="material-symbols-outlined text-lg">add_circle</span> Publicar material
          </Link>
        </div>
      </div>
      <p className="min-h-[1rem] text-xs font-semibold text-zinc-700" role="status">{qrMsg}</p>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-3 p-4">
            <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 bg-primary-soft text-primary">{c.icon}</span>
            <div className="min-w-0">
              <dt className="truncate text-xs text-zinc-500">{c.label}</dt>
              <dd className="price text-xl text-zinc-950">{c.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </header>
  );
}
