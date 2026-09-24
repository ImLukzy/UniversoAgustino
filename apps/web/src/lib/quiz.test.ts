import { describe, expect, it } from "vitest";
import { answer, isDone, next, startQuiz, tally, type QuizQuestion } from "./quiz";
import { EXAM_LIBRARY } from "../data/examLibrary";

const QS: QuizQuestion[] = [
  { q: "a", opts: ["x", "y"], ok: 0, why: "" },
  { q: "b", opts: ["x", "y"], ok: 1, why: "" },
];

describe("quiz de práctica", () => {
  it("responde una sola vez y avanza solo tras responder", () => {
    let s = startQuiz(2);
    expect(next(s)).toBe(s);
    s = answer(s, 1);
    expect(answer(s, 0).picks[0]).toBe(1);
    s = next(s);
    expect(s.index).toBe(1);
  });

  it("cuenta aciertos y errores en vivo y termina", () => {
    let s = answer(startQuiz(2), 0);
    expect(tally(QS, s.picks)).toMatchObject({ correct: 1, wrong: 0, answered: 1 });
    s = next(answer(next(s), 0));
    expect(isDone(s)).toBe(true);
    expect(tally(QS, s.picks)).toEqual({ correct: 1, wrong: 1, answered: 2, pct: 50 });
    expect(answer(s, 1)).toBe(s);
  });

  it("reiniciar deja todo sin responder", () => {
    expect(startQuiz(3)).toEqual({ index: 0, picks: [null, null, null] });
  });

  it("biblioteca válida: 5 facultades, ids únicos, 5 preguntas por examen", () => {
    expect(EXAM_LIBRARY).toHaveLength(5);
    const exams = EXAM_LIBRARY.flatMap((f) => f.exams);
    expect(new Set(exams.map((e) => e.id)).size).toBe(exams.length);
    for (const a of exams) {
      expect(a.questions).toHaveLength(5);
      for (const q of a.questions) {
        expect(q.ok).toBeGreaterThanOrEqual(0);
        expect(q.ok).toBeLessThan(q.opts.length);
        expect(new Set(q.opts).size).toBe(q.opts.length);
        expect(q.why.length).toBeGreaterThan(10);
      }
    }
  });
});
