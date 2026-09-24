import { useState } from "react";
import { Reveal } from "./Reveal";
import { EXAM_LIBRARY } from "../../data/examLibrary";
import { QuizPractice } from "./quiz/QuizPractice";
import { ExamList } from "./quiz/ExamList";
import { FeatureRows } from "./FeatureRows";
import { ChipTabs } from "./ChipTabs";

// Biblioteca de Exámenes y Balotarios UNSA (spec 19): facultad → examen →
// práctica con puntaje y explicación de cada respuesta.
export function LandingFeatures() {
  const [fac, setFac] = useState(0);
  const exams = EXAM_LIBRARY[fac].exams;
  const [examId, setExamId] = useState(exams[0].id);
  const exam = exams.find((e) => e.id === examId) ?? exams[0];
  const pickFaculty = (i: number) => {
    setFac(i);
    setExamId(EXAM_LIBRARY[i].exams[0].id);
  };

  return (
    <>
      <section id="practica" className="scroll-mt-4 overflow-hidden bg-zinc-50 py-20 sm:py-24">
        <Reveal className="mx-auto max-w-4xl px-4 text-center">
          <p className="eyebrow">Práctica real</p>
          <h2 className="mt-2 text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-5xl">Biblioteca de Exámenes y Balotarios UNSA</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">Elige tu facultad y un examen: preguntas tipo parcial, final y balotario, con la explicación de cada respuesta.</p>
          <ChipTabs id="exam-faculty" label="Facultad" controls="quiz-panel" items={EXAM_LIBRARY.map((x, i) => ({ value: i, label: x.label }))} value={fac} onChange={pickFaculty} />
        </Reveal>

        <Reveal className="mx-auto mt-12 grid max-w-5xl items-start gap-8 px-4 md:grid-cols-[1fr_1.2fr]">
          <ExamList exams={exams} value={exam.id} onChange={setExamId} />
          <div id="quiz-panel" role="tabpanel" aria-label={`${exam.kind} de ${exam.course}`}>
            <QuizPractice key={exam.id} exam={exam} />
          </div>
        </Reveal>
      </section>
      <FeatureRows />
    </>
  );
}
