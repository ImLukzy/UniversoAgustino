// Estado puro del quiz de práctica de la landing (spec 17). Sin backend: las
// respuestas viven en memoria y se pueden reiniciar.

export interface QuizQuestion {
  q: string;
  opts: string[];
  ok: number;
  why: string;
}

export interface QuizState {
  // Pregunta actual; === total cuando el quiz terminó.
  index: number;
  picks: (number | null)[];
}

export const startQuiz = (total: number): QuizState => ({ index: 0, picks: Array<number | null>(total).fill(null) });

// Cada pregunta se responde una sola vez (el feedback es inmediato).
export function answer(s: QuizState, pick: number): QuizState {
  if (s.index >= s.picks.length || s.picks[s.index] !== null) return s;
  const picks = [...s.picks];
  picks[s.index] = pick;
  return { ...s, picks };
}

// Solo avanza tras responder; al pasar la última, el quiz queda terminado.
export function next(s: QuizState): QuizState {
  if (s.index >= s.picks.length || s.picks[s.index] === null) return s;
  return { ...s, index: s.index + 1 };
}

export const isDone = (s: QuizState) => s.index >= s.picks.length;

export function tally(questions: QuizQuestion[], picks: (number | null)[]) {
  let correct = 0;
  let wrong = 0;
  picks.forEach((p, i) => {
    if (p === null) return;
    if (p === questions[i]?.ok) correct++;
    else wrong++;
  });
  return { correct, wrong, answered: correct + wrong, pct: questions.length ? Math.round((correct / questions.length) * 100) : 0 };
}
