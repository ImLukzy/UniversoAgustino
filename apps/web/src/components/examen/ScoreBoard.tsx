import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";
import type { QuizQuestion } from "../../lib/quiz";

// Marcador en vivo (✓ aciertos / ✕ errores) y progreso por segmentos: uno
// por pregunta, verde si acertó, rojo si falló y gris la actual.
export function ScoreBoard({ label, questions, picks, index, correct, wrong }: { label: string; questions: QuizQuestion[]; picks: (number | null)[]; index: number; correct: number; wrong: number }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <p className="flex gap-2 text-xs font-bold tabular-nums" aria-live="polite">
          <span className="flex items-center gap-1 rounded-full border-2 border-zinc-900 bg-primary-soft px-2 py-0.5 text-zinc-950">
            <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">check</span>
            {correct}
            <span className="sr-only">aciertos</span>
          </span>
          <span className="flex items-center gap-1 rounded-full border-2 border-zinc-900 bg-white px-2 py-0.5 text-[#b91c1c]">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
            {wrong}
            <span className="sr-only">errores</span>
          </span>
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" role="progressbar" aria-label="Progreso del examen" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={correct + wrong}>
        {picks.map((p, i) => (
          <span key={i} className="relative h-2 flex-1 overflow-hidden rounded-full border border-zinc-900 bg-white">
            {(p !== null || i === index) && (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={SPRING}
                className={`absolute inset-0 origin-left ${p === null ? "bg-zinc-300" : p === questions[i].ok ? "bg-primary" : "bg-[#b91c1c]"}`}
              />
            )}
          </span>
        ))}
      </div>
    </>
  );
}
