import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../../lib/motion";
import { answer, isDone, next, startQuiz, tally } from "../../../lib/quiz";
import type { Exam } from "../../../data/examLibrary";
import { QuizOption, type OptionState } from "./QuizOption";
import { QuizResult } from "./QuizResult";

const LETTERS = "ABCD";

// Examen de práctica (specs 17 y 19): feedback inmediato, contador en vivo,
// explicación, resultado y reinicio. Altura fija de la tarjeta → CLS ≈ 0.
export function QuizPractice({ exam }: { exam: Exam }) {
  const qs = exam.questions;
  const [s, setS] = useState(() => startQuiz(qs.length));
  const { correct, wrong } = tally(qs, s.picks);
  const done = isDone(s);
  const cur = qs[Math.min(s.index, qs.length - 1)];
  const pick = done ? null : s.picks[s.index];
  const stateOf = (i: number): OptionState => (pick === null ? "idle" : i === cur.ok ? "ok" : i === pick ? "bad" : "dim");

  return (
    <div className="card mx-auto flex w-full max-w-md flex-col p-5 text-left sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{done ? "Resultado" : `Pregunta ${s.index + 1} de ${qs.length}`}</p>
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
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {s.picks.map((p, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full border border-zinc-900 ${p === null ? (i === s.index ? "bg-zinc-300" : "bg-white") : p === qs[i].ok ? "bg-primary" : "bg-[#b91c1c]"}`}
          />
        ))}
      </div>

      <div className="mt-4 h-[27rem] sm:h-[25rem]">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <QuizResult key="result" correct={correct} total={qs.length} exam={exam} onRestart={() => setS(startQuiz(qs.length))} />
          ) : (
            <motion.div key={s.index} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={SPRING} className="flex h-full flex-col">
              <p className="min-h-[3.5rem] font-display text-lg font-bold leading-snug text-zinc-950">{cur.q}</p>
              <div className="mt-3 space-y-2">
                {cur.opts.map((o, i) => (
                  <QuizOption key={o} label={o} letter={LETTERS[i]} state={stateOf(i)} locked={pick !== null} onPick={() => setS((x) => answer(x, i))} />
                ))}
              </div>
              <p aria-live="polite" className="mt-3 min-h-[3.75rem] text-sm leading-snug text-zinc-600">
                {pick !== null && (
                  <>
                    <b className={pick === cur.ok ? "text-primary" : "text-[#b91c1c]"}>{pick === cur.ok ? "¡Correcto! " : "Incorrecto. "}</b>
                    {cur.why}
                  </>
                )}
              </p>
              <button type="button" onClick={() => setS(next)} disabled={pick === null} className="btn btn-dark mt-auto w-full">
                {s.index === qs.length - 1 ? "Ver resultado" : "Siguiente pregunta"}
                <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
