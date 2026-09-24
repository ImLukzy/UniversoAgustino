import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { LoginRequired } from "../components/auth/LoginRequired";
import { UploadList } from "../components/subir/UploadList";
import { FileDetailsCard } from "../components/subir/FileDetailsCard";
import { useBulkUpload } from "../components/subir/useBulkUpload";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/career";
import { docTypeOptions } from "../lib/publishing";
import { ROUTES } from "../lib/routes";

const STEPS = ["Subir", "Detalles", "Terminado"];

// /subir-material: subida en lote (varios archivos a la vez) en 3 pasos,
// con progreso real por archivo y los tipos de material de la carrera.
export function SubirMaterial() {
  const { user } = useAuth();
  const { career: theme } = useCareerTheme();
  const career = theme && theme !== "all" ? theme : "ENFERMERIA";
  const bulk = useBulkUpload(career);
  const [step, setStep] = useState(0);
  if (!user) return <AppLayout><LoginRequired what="subir material" /></AppLayout>;

  const types = docTypeOptions(career, false);
  const suggestions = careerContent(career).chips.map((c) => c.label).slice(0, 6);
  const next = async () => {
    if (step === 0 && bulk.ready) setStep(1);
    else if (step === 1 && (await bulk.publish())) setStep(2);
  };

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-6">
        <header className="text-center">
          <p className="eyebrow">Subida en lote</p>
          <h1 className="h-display mt-2 text-3xl">Comparte apuntes con tu comunidad</h1>
          <ol className="mt-6 grid grid-cols-3 gap-3" aria-label="Progreso">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-col items-center gap-2 text-sm font-bold">
                <span className={i <= step ? "text-zinc-950" : "text-zinc-400"}>{i + 1}. {s}</span>
                <span className={`h-1.5 w-full rounded-full border border-zinc-900 ${i <= step ? "bg-primary" : "bg-white"}`} />
              </li>
            ))}
          </ol>
        </header>

        {step === 0 && <UploadList items={bulk.items} onAdd={bulk.add} onRemove={bulk.remove} />}
        {step === 1 &&
          bulk.items.map((it) => (
            <FileDetailsCard key={it.id} item={it} types={types} suggestions={suggestions} onChange={(k, v) => bulk.setField(it.id, k, v)} onRemove={() => bulk.remove(it.id)} />
          ))}
        {step === 2 ? (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <span className="material-symbols-outlined text-6xl text-primary">task_alt</span>
            <h2 className="h-display text-2xl">¡Listo! Tus documentos ya están publicados</h2>
            <p className="text-sm text-zinc-600">Puedes editarlos o ver sus ventas desde tu panel de publicaciones.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" className="btn btn-primary" onClick={() => { bulk.reset(); setStep(0); }}>Subir más documentos</button>
              <Link to={ROUTES.myBazar} className="btn btn-secondary">Ver mis publicaciones</Link>
            </div>
          </div>
        ) : (
          <>
            <p role="alert" className="min-h-[1.25rem] text-sm font-bold text-[#b91c1c]">{bulk.err}</p>
            <div className="flex justify-between">
              <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => setStep(0)}>Anterior</button>
              <button type="button" className="btn btn-primary" disabled={!bulk.ready || bulk.publishing} onClick={next}>
                {step === 1 ? (bulk.publishing ? "Publicando…" : "Publicar") : "Siguiente"}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
