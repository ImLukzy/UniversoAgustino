import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SPRING } from "../../lib/motion";
import { ROUTES } from "../../lib/routes";
import type { Exam } from "../../data/balotariosData";

const verdict = (pct: number) =>
  pct === 100 ? "¡Perfecto! Dominas el tema." : pct >= 60 ? "¡Bien! Repasa las que fallaste." : "Sigue practicando: repasa con el material del curso.";

// Pantalla final: puntaje, resumen de aciertos y errores, reintento y enlace
// al material real del curso en el catálogo.
export function QuizResult({ correct, wrong, total, exam, onRestart }: { correct: number; wrong: number; total: number; exam: Exam; onRestart: () => void }) {
  const pct = Math.round((correct / total) * 100);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} className="flex h-full flex-col items-center justify-center text-center" role="status">
      <span className="flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-zinc-900 bg-primary-soft font-display text-zinc-950">
        <b className="text-3xl font-extrabold leading-none">{pct}%</b>
        <span className="mt-1 text-xs font-bold text-zinc-600">{correct}/{total}</span>
      </span>
      <p className="mt-4 font-display text-xl font-bold text-zinc-950">{verdict(pct)}</p>
      <p className="mt-1 text-sm text-zinc-500">{exam.kind} de {exam.course}</p>
      <dl className="mt-5 grid w-full max-w-xs grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-zinc-900 bg-primary-soft px-3 py-2">
          <dt className="text-xs font-bold text-zinc-600">Aciertos</dt>
          <dd className="flex items-center justify-center gap-1 font-display text-2xl font-extrabold text-zinc-950">
            <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">check</span>
            {correct}
          </dd>
        </div>
        <div className="rounded-xl border-2 border-zinc-900 bg-white px-3 py-2">
          <dt className="text-xs font-bold text-zinc-600">Errores</dt>
          <dd className="flex items-center justify-center gap-1 font-display text-2xl font-extrabold text-[#b91c1c]">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
            {wrong}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRestart} className="btn btn-primary">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">restart_alt</span>
          Reintentar examen
        </button>
        <Link to={`${ROUTES.explore}?career=${exam.career}&q=${encodeURIComponent(exam.course)}`} className="btn btn-secondary">
          Ver material del curso
        </Link>
      </div>
    </motion.div>
  );
}
