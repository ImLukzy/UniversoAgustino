import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ExamenInteractivo } from "../components/ExamenInteractivo";
import { BALOTARIOS, libraryStats } from "../data/balotariosData";
import { ROUTES } from "../lib/routes";

const stats = libraryStats(BALOTARIOS);

// /balotarios (spec 23): página pública de la biblioteca en modo juego.
export function Balotarios() {
  return (
    <AppLayout fluid>
      <section className="bg-zinc-50 px-4 pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Modo juego</p>
            <h1 className="mt-2 text-balance font-display text-4xl font-extrabold leading-tight tracking-tight text-zinc-950 sm:text-5xl">Biblioteca de Balotarios y Exámenes</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600">Practica con preguntas tipo parcial, final, balotario y admisión. Cada respuesta trae su explicación experta.</p>
            <dl className="mx-auto mt-6 flex max-w-md justify-center gap-3">
              {[
                [stats.faculties, "facultades"],
                [stats.exams, "exámenes"],
                [stats.questions, "preguntas"],
              ].map(([n, label]) => (
                <div key={label} className="flex flex-1 flex-col-reverse rounded-xl border-2 border-zinc-900 bg-white px-3 py-2">
                  <dt className="text-xs font-bold text-zinc-600">{label}</dt>
                  <dd className="font-display text-2xl font-extrabold text-zinc-950">{n}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ExamenInteractivo />
          <p className="mt-10 text-center text-sm text-zinc-500">
            ¿Quieres los PDF completos?{" "}
            <Link to={`${ROUTES.explore}?q=balotario`} className="font-semibold text-primary underline-offset-2 hover:underline">
              Ver balotarios en el catálogo
            </Link>
          </p>
        </div>
      </section>
    </AppLayout>
  );
}
