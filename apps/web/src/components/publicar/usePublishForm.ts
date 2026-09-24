import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PLATFORM_FEE_PCT, computePrice } from "@hub/shared";
import { api, apiError, type PayMethod } from "../../lib/api";
import { useCareerTheme } from "../../live/careerTheme";
import { careerContent } from "../../data/career";
import { BAZAR_KINDS, docTypeOptions } from "../../lib/publishing";
import { batchTitleIssue, isBatch, partialMessage, titleFromFile, titleOk } from "../../lib/uploadQueue";
import { ROUTES } from "../../lib/routes";
import { useToast } from "../../context/ToastContext";
import { samplePages } from "../SamplePagesField";
import { useUploadQueue } from "./useUploadQueue";

type PublishMode = "digital" | "fisico";

// Estado, validación por pasos y envío del flujo único de /publicar (spec 24):
// un apunte, un lote de apuntes (2+ archivos) o un artículo de bazar.
export function usePublishForm() {
  const { career: themeCareer } = useCareerTheme();
  const cc = careerContent(themeCareer);
  const nav = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<PublishMode>("digital");
  const [f, setF] = useState({
    title: "",
    career: themeCareer && themeCareer !== "all" ? themeCareer : "ENFERMERIA",
    cycle: "VI",
    course: "",
    docType: "APUNTE",
    description: "",
    kind: BAZAR_KINDS[0].value as string,
    tx: "VENTA" as "VENTA" | "ALQUILER",
    campus: cc.bazarPlaces[0],
    deposit: "",
    price: cc.suggestPrice,
    payMethod: "YAPE" as PayMethod,
    payDetail: "",
    payQr: "",
    samples: "1-2",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [checks, setChecks] = useState([false, false, false]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const queue = useUploadQueue(setErr);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const types = docTypeOptions(f.career);
  // Si la carrera elegida no ofrece el tipo actual, se usa su primer tipo.
  const docType = types.some((t) => t.v === f.docType) ? f.docType : (types[0]?.v ?? "APUNTE");
  const quote = computePrice(Math.round((Number(f.price) || 0) * 100), PLATFORM_FEE_PCT);
  const digital = mode === "digital";
  const batch = digital && isBatch(queue.items);

  const done = {
    details: (batch || titleOk(f.title)) && (!digital || (f.course.trim().length >= 2 && !!f.cycle)),
    file: digital ? queue.uploaded && (!batch || !batchTitleIssue(queue.items)) : f.payQr !== "" || f.payDetail.trim() !== "",
    price: quote.amountCents > 0 && (!digital || !!samplePages(f.samples)),
    legal: checks.every(Boolean),
  };

  // El primer archivo propone el título del apunte si aún está vacío.
  const addFiles = (list: FileList | File[] | null | undefined) => {
    setErr("");
    const added = queue.add(list);
    if (added[0] && !f.title.trim()) set("title", titleFromFile(added[0].file.name));
  };

  const publishDocs = async (pay: object) => {
    const common = { course: f.course.trim(), university: "UNSA", career: f.career, cycle: f.cycle, type: docType, priceCents: quote.amountCents, description: f.description.trim() || undefined, previewPages: samplePages(f.samples), ...pay };
    if (!batch) {
      const r = await api.post("/documents", { ...common, title: f.title.trim(), fileUrl: queue.items[0].url });
      return nav(ROUTES.document(r.data.data.id));
    }
    const total = queue.items.length;
    let published = 0;
    try {
      for (const it of queue.items) {
        await api.post("/documents", { ...common, title: it.title.trim(), fileUrl: it.url });
        queue.remove(it.id);
        published++;
      }
    } catch (e) {
      throw new Error(partialMessage(published, total, apiError(e)));
    }
    toast.success(`${total} apuntes publicados`, "Ya están en el catálogo con el mismo precio y cobro.");
    nav(ROUTES.myBazar);
  };

  const submit = async () => {
    setErr("");
    if (!done.details) return setErr(`Completa el paso 1: ${batch ? "" : "título, "}${digital ? "curso y ciclo" : "título"}.`);
    if (digital && !queue.uploaded) return setErr(queue.uploading ? "Espera a que terminen de subir tus archivos." : "Sube tu archivo en el paso 2.");
    if (batch && batchTitleIssue(queue.items)) return setErr(batchTitleIssue(queue.items) ?? "");
    if (!done.price) return setErr("Fija un precio mayor a S/ 0 y las páginas de muestra en el paso 3.");
    if (!done.legal) return setErr("Marca las 3 declaraciones del paso 4 (D.L. 822).");
    setBusy(true);
    const pay = { payMethod: f.payMethod, payDetail: f.payDetail.trim() || undefined, payQrUrl: f.payQr || undefined };
    try {
      if (digital) await publishDocs(pay);
      else {
        const deposit = f.tx === "ALQUILER" && f.deposit ? Math.round(Number(f.deposit) * 100) : undefined;
        const description = [f.description.trim(), `Entrega: ${f.campus}`].filter(Boolean).join(" ");
        const r = await api.post("/bazar", { title: f.title.trim(), kind: f.kind, tx: f.tx, priceCents: quote.amountCents, depositCents: deposit, description, photos, ...pay });
        nav(ROUTES.bazarItem(r.data.data.id));
      }
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return { mode, setMode, f, set, docType, types, photos, setPhotos, queue, addFiles, batch, checks, setChecks, quote, done, err, busy, submit, cc };
}

export type PublishForm = ReturnType<typeof usePublishForm>;
