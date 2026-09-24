import { Link } from "react-router-dom";
import { ROUTES } from "../../../lib/routes";
import { careerLabel } from "../../../data/unsa";
import type { Exam } from "../../../data/examLibrary";

// Exámenes de la facultad elegida: tarjeta rudo seleccionable (la activa en
// primary-soft) y enlace al material real del curso en el catálogo.
export function ExamList({ exams, value, onChange }: { exams: Exam[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3">
        {exams.map((e) => {
          const on = e.id === value;
          return (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={on}
                aria-controls="quiz-panel"
                onClick={() => onChange(e.id)}
                className={`card card-hover flex w-full items-center gap-3 p-4 text-left ${on ? "bg-primary-soft" : ""}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 bg-primary text-xl text-primary-ink">
                  fact_check
                </span>
                <span className="min-w-0 flex-1">
                  <span className="tag bg-white">{e.kind}</span>
                  <b className="mt-1 block truncate font-display text-zinc-950">{e.course}</b>
                  <span className="block text-xs text-zinc-600">{careerLabel(e.career)} · {e.questions.length} preguntas</span>
                </span>
                <span aria-hidden="true" className={`material-symbols-outlined text-xl ${on ? "text-primary" : "text-zinc-400"}`}>
                  {on ? "check_circle" : "radio_button_unchecked"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Link to={`${ROUTES.explore}?q=balotario`} className="btn btn-secondary self-start">
        <span className="material-symbols-outlined text-lg" aria-hidden="true">menu_book</span>
        Ver todos los balotarios
      </Link>
    </div>
  );
}
