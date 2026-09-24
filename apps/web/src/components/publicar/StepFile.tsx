import { PhotoManager } from "../PhotoManager";
import { PayFields } from "../publicaciones/PayFields";
import { FileQueue } from "./FileQueue";
import type { PublishForm } from "./usePublishForm";

// Paso 2: archivos (apunte o lote) o fotos (bazar). El cobro se configura en
// ambos modos y, en un lote, vale para todos los archivos.
export function StepFile({ form }: { form: PublishForm }) {
  const { f, set } = form;
  const digital = form.mode === "digital";
  return (
    <section className="card flex flex-col gap-4 p-6">
      <h2 className="text-lg font-extrabold text-zinc-950">2 · {digital ? (form.batch ? "Archivos del lote" : "Archivo y vista previa") : "Fotos del producto"}</h2>
      {digital ? (
        <>
          <FileQueue form={form} />
          <p className="text-xs text-zinc-600">Las páginas de muestra se ven gratis como vista previa; el resto se desbloquea al comprar.</p>
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
