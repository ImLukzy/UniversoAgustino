import { useState } from "react";
import { BALOTARIOS } from "../data/balotariosData";
import { ChipTabs } from "./landing/ChipTabs";
import { ExamList } from "./examen/ExamList";
import { QuizPractice } from "./examen/QuizPractice";

// Biblioteca de Balotarios y Exámenes en modo juego (spec 23): facultad →
// examen → preguntas con feedback, marcador y explicación. Se usa en la
// landing (#practica) y en /balotarios.
export function ExamenInteractivo() {
  const [fac, setFac] = useState(0);
  const exams = BALOTARIOS[fac].exams;
  const [examId, setExamId] = useState(exams[0].id);
  const exam = exams.find((e) => e.id === examId) ?? exams[0];
  const pickFaculty = (i: number) => {
    setFac(i);
    setExamId(BALOTARIOS[i].exams[0].id);
  };

  return (
    <div>
      <ChipTabs id="exam-faculty" label="Facultad" controls="quiz-panel" items={BALOTARIOS.map((x, i) => ({ value: i, label: x.label }))} value={fac} onChange={pickFaculty} />
      <div className="mt-10 grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:gap-8">
        <ExamList exams={exams} value={exam.id} onChange={setExamId} />
        <div id="quiz-panel" role="tabpanel" aria-label={`${exam.kind} de ${exam.course}`}>
          {/* key: cambiar de examen reinicia el juego. */}
          <QuizPractice key={exam.id} exam={exam} />
        </div>
      </div>
    </div>
  );
}
