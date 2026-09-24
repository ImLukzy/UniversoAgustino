import type { Career } from "@hub/shared";
import type { QuizQuestion } from "../lib/quiz";
import { SALUD } from "./balotarios/salud";
import { INGENIERIAS } from "./balotarios/ingenierias";
import { DERECHO } from "./balotarios/derecho";
import { ECONOMICAS } from "./balotarios/economicas";
import { SOCIALES } from "./balotarios/sociales";

// Biblioteca de Balotarios y Exámenes UNSA (spec 23): repositorio estático
// por facultad. Cada examen trae preguntas con 4 opciones, la correcta y una
// explicación pedagógica. Para sumar un examen basta con añadir una entrada.
export type ExamKind = "Parcial" | "Final" | "Balotario" | "Admisión";

export const EXAM_KINDS: readonly ExamKind[] = ["Parcial", "Final", "Balotario", "Admisión"];

export const KIND_ICON: Record<ExamKind, string> = {
  Parcial: "quiz",
  Final: "fact_check",
  Balotario: "checklist_rtl",
  Admisión: "school",
};

export interface Exam {
  id: string;
  course: string;
  career: Career;
  kind: ExamKind;
  questions: QuizQuestion[];
}

export interface Faculty {
  label: string;
  exams: Exam[];
}

export const BALOTARIOS: Faculty[] = [SALUD, INGENIERIAS, DERECHO, ECONOMICAS, SOCIALES];

export function libraryStats(lib: Faculty[]) {
  const exams = lib.flatMap((f) => f.exams);
  return { faculties: lib.length, exams: exams.length, questions: exams.reduce((n, e) => n + e.questions.length, 0) };
}
