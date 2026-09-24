import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/career";
import { ROUTES } from "../lib/routes";
import { LoginRequired } from "../components/auth/LoginRequired";
import { PanelSummary } from "../components/panel/PanelSummary";
import { PanelSpaces } from "../components/panel/PanelSpaces";
import { PanelOrders } from "../components/panel/PanelOrders";
import { usePanelData } from "../components/panel/usePanelData";
import { paySummary } from "../lib/payments";

// /panel: resumen personal (compras, publicaciones, ventas y moderación).
export function Panel() {
  const { user } = useAuth();
  const { career } = useCareerTheme();
  const cc = careerContent(career);
  const d = usePanelData(user);
  if (!user) return <LoginRequired what="ver tu panel" />;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <PanelSummary user={user} d={d} />
      <PanelSpaces d={d} email={user.email} />
      <PanelOrders list={d.list} loading={d.loading} />
      <section className="grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col justify-between gap-4 p-6">
          <div>
            <p className="eyebrow">Cómo cobras</p>
            <p className="price mt-2 text-2xl text-primary">{paySummary([...d.myDocs, ...d.myBazar])}</p>
            <p className="mt-1 text-sm text-zinc-600">Métodos configurados en tus publicaciones.</p>
          </div>
          <Link to={ROUTES.myBazar} className="btn btn-primary w-fit">Configurar cobro</Link>
        </div>
        <div className="card flex flex-col gap-3 p-6">
          <p className="eyebrow">Puntos de entrega sugeridos</p>
          <ul className="divide-y divide-dashed divide-zinc-300">
            {cc.meetSpots.map((s, i) => (
              <li key={s} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-bold text-zinc-900"><span className="material-symbols-outlined text-lg text-primary">location_on</span>{s}</span>
                <span className="text-zinc-500">{cc.meetTimes[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
