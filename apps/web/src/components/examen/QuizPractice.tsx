import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../lib/motion";
import { answer, isDone, next, startQuiz, tally } from "../../lib/quiz";
import type { Exam } from "../../data/balotariosData";
import { QuizOption, type OptionState } from "./QuizOption";
import { QuizResult } from "./QuizResult";
import { ScoreBoard } from "./ScoreBoard";
import { ExplanationBox } from "./ExplanationBox";

const LETTERS = "ABCD";

// Modo juego (specs 17, 19 y 23): feedback inmediato y bloqueado, marcador en
// vivo, explicación desplegable, resultado y reintento. La tarjeta tiene
// altura fija y el cuerpo hace scroll interno → CLS ≈ 0.
export function QuizPractice({ exam }: { exam: Exam }) {
  const qs = exam.questions;
  const [s, setS] = useState(() => startQuiz(qs.length));
  const { correct, wrong } = tally(qs, s.picks);
  const done = isDone(s);
  const cur = qs[Math.min(s.index, qs.length - 1)];
  const pick = done ? null : s.picks[s.index];
  const stateOf = (i: number): OptionState => (pick === null ? "idle" : i === cur.ok ? "ok" : i === pick ? "bad" : "dim");

  return (
    <div className="card flex h-[40rem] w-full flex-col p-5 text-left sm:h-[38rem] sm:p-6">
      <ScoreBoard label={done ? "Resultado" : `Pregunta ${s.index + 1} de ${qs.length}`} questions={qs} picks={s.picks} index={s.index} correct={correct} wrong={wrong} />
      <div className="mt-4 min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <QuizResult key="result" correct={correct} wrong={wrong} total={qs.length} exam={exam} onRestart={() => setS(startQuiz(qs.length))} />
          ) : (
            <motion.div key={s.index} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={SPRING} className="flex h-full flex-col">
              <div data-quiz-scroll className="relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
                <p className="font-display text-base font-bold leading-snug text-zinc-950 sm:text-lg">{cur.q}</p>
                <div className="mt-3 space-y-2">
                  {cur.opts.map((o, i) => (
                    <QuizOption key={o} label={o} letter={LETTERS[i]} state={stateOf(i)} locked={pick !== null} onPick={() => setS((x) => answer(x, i))} />
                  ))}
                </div>
                <div aria-live="polite">{pick !== null && <ExplanationBox correct={pick === cur.ok} why={cur.why} />}</div>
              </div>
              <button type="button" onClick={() => setS(next)} disabled={pick === null} className="btn btn-dark mt-3 w-full shrink-0">
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
