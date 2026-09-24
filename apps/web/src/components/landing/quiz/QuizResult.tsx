import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SPRING } from "../../../lib/motion";
import { ROUTES } from "../../../lib/routes";
import type { Exam } from "../../../data/examLibrary";

const verdict = (pct: number) =>
  pct === 100 ? "¡Perfecto! Dominas el tema." : pct >= 60 ? "¡Bien! Repasa las que fallaste." : "Sigue practicando: repasa con el material del curso.";

// Resultado final: puntaje, mensaje, reinicio y enlace al material real del curso.
export function QuizResult({ correct, total, exam, onRestart }: { correct: number; total: number; exam: Exam; onRestart: () => void }) {
  const pct = Math.round((correct / total) * 100);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} className="flex h-full flex-col items-center justify-center text-center" role="status">
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-zinc-900 bg-primary-soft font-display text-2xl font-extrabold text-zinc-950">
        {correct}/{total}
      </span>
      <p className="mt-4 font-display text-xl font-bold text-zinc-950">{verdict(pct)}</p>
      <p className="mt-1 text-sm text-zinc-500">
        {pct}% de aciertos en {exam.course}.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRestart} className="btn btn-primary">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">restart_alt</span>
          Reiniciar práctica
        </button>
        <Link to={`${ROUTES.explore}?career=${exam.career}&q=${encodeURIComponent(exam.course)}`} className="btn btn-secondary">
          Ver material del curso
        </Link>
      </div>
    </motion.div>
  );
}
