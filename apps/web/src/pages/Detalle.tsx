import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { careerColor, careerLabel, careerSoft } from "../data/unsa";
import { ROUTES } from "../lib/routes";
import { SPRING } from "../lib/motion";
import { DetailSkeleton } from "../components/Skeleton";
import { DetailMedia } from "../components/detalle/DetailMedia";
import { BuyPanel } from "../components/detalle/BuyPanel";
import { useDetail } from "../components/detalle/useDetail";

// /p/:type/:id — detalle de un apunte o artículo del bazar y reserva.
export function Detalle() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const kind = type === "bazar" ? "bazar" : "document";
  const d = useDetail(kind, id);

  if (d.loading) return <DetailSkeleton />;
  if (!d.src) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-extrabold text-zinc-950">Esta publicación ya no existe.</p>
          <Link className="btn btn-secondary" to={ROUTES.explore}>Volver al catálogo</Link>
        </div>
      </main>
    );
  }
  const career = d.doc?.career;
  const back = kind === "document" ? ROUTES.explore : ROUTES.bazar;

  return (
    <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <Link to={back} className="btn-ghost w-fit px-2">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a {kind === "document" ? "explorar" : "bazar"}
      </Link>
      <div className="flex flex-wrap gap-2">
        {career && <span className="tag" style={{ backgroundColor: careerSoft(career), color: careerColor(career) }}>{careerLabel(career)}</span>}
        <span className="tag">{d.doc ? d.doc.type : `${d.item?.kind} · ${d.item?.tx}`}</span>
        {d.item && <span className="tag">{d.item.status}</span>}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><DetailMedia d={d} /></div>
        <BuyPanel d={d} />
      </div>
    </motion.main>
  );
}
