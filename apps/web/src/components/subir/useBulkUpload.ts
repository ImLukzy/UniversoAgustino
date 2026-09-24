import { useState } from "react";
import { api, apiError, uploadFileWithProgress } from "../../lib/api";
import { MAX_UPLOAD_MB, tooBig } from "../../lib/publishing";
import { samplePages } from "../SamplePagesField";

export interface UploadItem {
  id: string;
  file: File;
  url: string | null;
  progress: number;
  failed: string | null;
  course: string;
  type: string;
  title: string;
  cycle: string;
  price: string;
  description: string;
  samples: string;
  errors: Partial<Record<Field, string>>;
}
export type Field = "course" | "type" | "title" | "cycle" | "price" | "description" | "samples";

function validate(f: UploadItem): UploadItem["errors"] {
  const e: UploadItem["errors"] = {};
  if (!f.course.trim()) e.course = "La asignatura es requerida";
  if (!f.type) e.type = "La categoría es requerida";
  if (!f.cycle) e.cycle = "El ciclo es requerido";
  if (f.title.trim().length < 4) e.title = "Título mínimo 4 caracteres";
  if (!(Number(f.price) > 0)) e.price = "Precio mayor a S/ 0";
  if (f.description.trim().length < 10) e.description = "Descripción mínima de 10 caracteres";
  if (!samplePages(f.samples)) e.samples = "Indica al menos una página de muestra";
  return e;
}

// Subida múltiple real (progreso por archivo) y publicación en lote de apuntes.
export function useBulkUpload(career: string) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [err, setErr] = useState("");
  const [publishing, setPublishing] = useState(false);
  const patch = (id: string, p: Partial<UploadItem>) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const add = (list: FileList | null) => {
    const fresh: UploadItem[] = [];
    for (const file of Array.from(list ?? [])) {
      if (tooBig(file)) {
        setErr(`"${file.name}" supera los ${MAX_UPLOAD_MB} MB permitidos.`);
        continue;
      }
      const title = file.name.replace(/\.[^/.]+$/, "");
      fresh.push({ id: crypto.randomUUID(), file, url: null, progress: 0, failed: null, course: "", type: "", title, cycle: "", price: "", description: "", samples: "1-2", errors: {} });
    }
    if (!fresh.length) return;
    setErr("");
    setItems((prev) => [...prev, ...fresh]);
    for (const it of fresh) {
      uploadFileWithProgress(it.file, (pct) => patch(it.id, { progress: pct }))
        .then((url) => patch(it.id, { url, progress: 100 }))
        .catch((e: unknown) => patch(it.id, { failed: apiError(e) }));
    }
  };

  const remove = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const setField = (id: string, k: Field, v: string) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, [k]: v, errors: { ...x.errors, [k]: undefined } } : x)));

  // Valida todo; si pasa, publica cada archivo como documento.
  const publish = async (): Promise<boolean> => {
    const checked = items.map((x) => ({ ...x, errors: validate(x) }));
    setItems(checked);
    if (checked.some((x) => Object.keys(x.errors).length)) return false;
    setPublishing(true);
    setErr("");
    try {
      for (const x of checked) {
        if (!x.url) throw new Error(`"${x.file.name}" aún no termina de subir.`);
        await api.post("/documents", { title: x.title.trim(), course: x.course.trim(), university: "UNSA", career, cycle: x.cycle, type: x.type, priceCents: Math.round(Number(x.price) * 100), fileUrl: x.url, description: x.description.trim(), previewPages: samplePages(x.samples), payMethod: "YAPE" });
      }
      return true;
    } catch (e) {
      setErr(apiError(e));
      return false;
    } finally {
      setPublishing(false);
    }
  };

  const ready = items.length > 0 && items.every((x) => x.url);
  return { items, add, remove, setField, publish, publishing, err, ready, reset: () => setItems([]) };
}
