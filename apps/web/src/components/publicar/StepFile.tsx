import { useState } from "react";
import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";
import { MAX_UPLOAD_MB, UPLOAD_ACCEPT, mbOf } from "../../lib/publishing";
import { PhotoManager } from "../PhotoManager";
import { PayFields } from "../publicaciones/PayFields";
import type { PublishForm } from "./usePublishForm";

function Dropzone({ form }: { form: PublishForm }) {
  const [drag, setDrag] = useState(false);
  if (form.file) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-zinc-900 p-4">
        <span className="flex min-w-0 items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-[#b91c1c]">picture_as_pdf</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-zinc-950">{form.file.name}</span>
            <span className="text-xs text-zinc-500">{mbOf(form.file)} · {form.fileUrl ? "listo para publicar" : "subiendo…"}</span>
          </span>
        </span>
        <button type="button" onClick={form.clearFile} className="btn-ghost h-9 px-3 text-xs text-[#b91c1c]">
          <span className="material-symbols-outlined text-base">delete</span> Quitar
        </button>
      </div>
    );
  }
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void form.pickFile(e.dataTransfer.files?.[0]);
      }}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-zinc-900 bg-primary-soft" : "border-zinc-300 hover:border-zinc-900"}`}
    >
      <span className="material-symbols-outlined flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-3xl text-zinc-800">cloud_upload</span>
      <span className="font-bold text-zinc-950">{drag ? "Suelta tu archivo aquí" : "Arrastra tu archivo o haz clic"}</span>
      <span className="text-sm text-zinc-500">PDF, JPG, PNG o EPUB · máx. {MAX_UPLOAD_MB} MB</span>
      <input type="file" className="sr-only" accept={UPLOAD_ACCEPT} onChange={(e) => form.pickFile(e.target.files?.[0])} />
    </label>
  );
}

// Paso 2: archivo (apunte) o fotos (bazar). El cobro se configura en ambos modos.
export function StepFile({ form }: { form: PublishForm }) {
  const { f, set } = form;
  const digital = form.mode === "digital";
  return (
    <section className="card flex flex-col gap-4 p-6">
      <h2 className="text-lg font-extrabold text-zinc-950">2 · {digital ? "Archivo y vista previa" : "Fotos del producto"}</h2>
      {digital ? (
        <>
          <Dropzone form={form} />
          <div className="h-2 overflow-hidden rounded-full border border-zinc-900 bg-zinc-100" aria-hidden={form.progress === null}>
            <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${form.progress ?? 0}%` }} transition={SPRING} />
          </div>
          <p className="text-xs text-zinc-600">Las páginas 1 y 2 se muestran gratis como vista previa; el resto se desbloquea al comprar.</p>
        </>
      ) : (
        <PhotoManager value={form.photos} onChange={form.setPhotos} accentColor={null} />
      )}
      <PayFields
        method={f.payMethod}
        detail={f.payDetail}
        qr={f.payQr}
        onMethod={(v) => set("payMethod", v)}
        onDetail={(v) => set("payDetail", v)}
        onQr={(v) => set("payQr", v)}
      />
    </section>
  );
}
