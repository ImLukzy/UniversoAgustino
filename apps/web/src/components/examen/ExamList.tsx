import { KIND_ICON, type Exam } from "../../data/balotariosData";
import { careerLabel } from "../../data/unsa";

// Exámenes de la facultad elegida: tarjeta seleccionable con tipo (PARCIAL,
// FINAL, BALOTARIO, ADMISIÓN), carrera, conteo de preguntas y estado activo.
export function ExamList({ exams, value, onChange }: { exams: Exam[]; value: string; onChange: (id: string) => void }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
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
              <span aria-hidden="true" className={`material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 text-xl ${on ? "bg-primary text-primary-ink" : "bg-white text-zinc-900"}`}>
                {KIND_ICON[e.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="tag bg-white uppercase tracking-wide">{e.kind}</span>
                <b className="mt-1 block truncate font-display text-zinc-950">{e.course}</b>
                <span className="block truncate text-xs text-zinc-600">
                  {careerLabel(e.career)} · {e.questions.length} preguntas
                </span>
              </span>
              <span aria-hidden="true" className={`material-symbols-outlined text-xl ${on ? "text-primary" : "text-zinc-400"}`}>
                {on ? "check_circle" : "radio_button_unchecked"}
              </span>
              {on && <span className="sr-only">(seleccionado)</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
