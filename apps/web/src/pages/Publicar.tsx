import { useAuth } from "../auth/AuthContext";
import { LoginRequired } from "../components/auth/LoginRequired";
import { usePublishForm } from "../components/publicar/usePublishForm";
import { PublishHeader } from "../components/publicar/PublishHeader";
import { StepDetails } from "../components/publicar/StepDetails";
import { StepFile } from "../components/publicar/StepFile";
import { StepPriceLegal } from "../components/publicar/StepPriceLegal";
import { PublishPreview } from "../components/publicar/PublishPreview";

// /publicar: flujo real de publicación (apunte digital o artículo de bazar).
export function Publicar() {
  const { user } = useAuth();
  const form = usePublishForm();
  if (!user) return <LoginRequired what="publicar material" />;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <PublishHeader form={form} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <StepDetails form={form} />
          <StepFile form={form} />
          <StepPriceLegal form={form} />
          <p role="alert" className="min-h-[1.25rem] text-sm font-bold text-[#b91c1c]">{form.err}</p>
          <div className="flex justify-end pb-8">
            <button type="button" disabled={form.busy} onClick={form.submit} className="btn btn-primary btn-lg">
              {form.busy ? "Publicando…" : form.mode === "digital" ? "Publicar en el catálogo" : "Publicar en el Bazar"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
        <div className="lg:col-span-4">
          <PublishPreview form={form} authorName={user.profile?.fullName?.trim() || user.email} />
        </div>
      </div>
    </main>
  );
}
