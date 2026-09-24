import { describe, expect, it } from "vitest";
import { answer, isDone, next, startQuiz, tally, type QuizQuestion } from "./quiz";
import { BALOTARIOS, EXAM_KINDS, libraryStats } from "../data/balotariosData";
import { CareerSchema } from "@hub/shared";

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

  it("biblioteca de balotarios: 5 facultades × 4 tipos de examen × 6 preguntas", () => {
    expect(libraryStats(BALOTARIOS)).toEqual({ faculties: 5, exams: 20, questions: 120 });
    const exams = BALOTARIOS.flatMap((f) => f.exams);
    expect(new Set(exams.map((e) => e.id)).size).toBe(exams.length);
    for (const f of BALOTARIOS) expect(f.exams.map((e) => e.kind).sort()).toEqual([...EXAM_KINDS].sort());
    for (const a of exams) {
      expect(CareerSchema.safeParse(a.career).success).toBe(true);
      expect(a.questions).toHaveLength(6);
      for (const q of a.questions) {
        expect(q.opts).toHaveLength(4);
        expect(q.ok).toBeGreaterThanOrEqual(0);
        expect(q.ok).toBeLessThan(4);
        expect(new Set(q.opts).size).toBe(4);
        expect(q.why.length).toBeGreaterThan(100);
      }
    }
  });

  it("la respuesta correcta no se concentra en una sola letra", () => {
    const counts = [0, 0, 0, 0];
    for (const q of BALOTARIOS.flatMap((f) => f.exams.flatMap((e) => e.questions))) counts[q.ok]++;
    for (const c of counts) expect(c).toBeGreaterThanOrEqual(20);
  });
});
