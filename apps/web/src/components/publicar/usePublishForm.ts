import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PLATFORM_FEE_PCT, computePrice } from "@hub/shared";
import { api, apiError, uploadFileWithProgress, type PayMethod } from "../../lib/api";
import { useCareerTheme } from "../../live/careerTheme";
import { careerContent } from "../../data/career";
import { BAZAR_KINDS, MAX_UPLOAD_MB, docTypeOptions, tooBig } from "../../lib/publishing";
import { ROUTES } from "../../lib/routes";
import { samplePages } from "../SamplePagesField";

type PublishMode = "digital" | "fisico";

// Estado, validación por pasos y envío de /publicar (apunte o artículo de bazar).
export function usePublishForm() {
  const { career: themeCareer } = useCareerTheme();
  const cc = careerContent(themeCareer);
  const nav = useNavigate();
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
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [checks, setChecks] = useState([false, false, false]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const types = docTypeOptions(f.career);
  // Si la carrera elegida no ofrece el tipo actual, se usa su primer tipo.
  const docType = types.some((t) => t.v === f.docType) ? f.docType : (types[0]?.v ?? "APUNTE");
  const quote = computePrice(Math.round((Number(f.price) || 0) * 100), PLATFORM_FEE_PCT);

  const done = {
    details: f.title.trim().length >= 4 && (mode === "fisico" || (f.course.trim().length >= 2 && !!f.cycle)),
    file: mode === "digital" ? !!fileUrl : f.payQr !== "" || f.payDetail.trim() !== "",
    price: quote.amountCents > 0 && (mode === "fisico" || !!samplePages(f.samples)),
    legal: checks.every(Boolean),
  };

  const pickFile = async (picked: File | undefined) => {
    if (!picked) return;
    setErr("");
    if (tooBig(picked)) return setErr(`El archivo supera los ${MAX_UPLOAD_MB} MB permitidos.`);
    setFile(picked);
    setFileUrl("");
    setProgress(0);
    try {
      setFileUrl(await uploadFileWithProgress(picked, setProgress));
      setProgress(100);
    } catch (e) {
      setErr(apiError(e));
      setFile(null);
      setProgress(null);
    }
  };
  const clearFile = () => {
    setFile(null);
    setFileUrl("");
    setProgress(null);
  };

  const submit = async () => {
    setErr("");
    if (!done.details) return setErr(`Completa el paso 1: título${mode === "digital" ? ", curso y ciclo" : ""}.`);
    if (mode === "digital" && !fileUrl) return setErr("Sube tu archivo en el paso 2.");
    if (!done.price) return setErr("Fija un precio mayor a S/ 0 y las páginas de muestra en el paso 3.");
    if (!done.legal) return setErr("Marca las 3 declaraciones del paso 4 (D.L. 822).");
    setBusy(true);
    const pay = { payMethod: f.payMethod, payDetail: f.payDetail.trim() || undefined, payQrUrl: f.payQr || undefined };
    try {
      if (mode === "digital") {
        const body = { title: f.title.trim(), course: f.course.trim(), university: "UNSA", career: f.career, cycle: f.cycle, type: docType, priceCents: quote.amountCents, fileUrl, description: f.description.trim() || undefined, previewPages: samplePages(f.samples), ...pay };
        const r = await api.post("/documents", body);
        nav(ROUTES.document(r.data.data.id));
      } else {
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

  return { mode, setMode, f, set, docType, types, photos, setPhotos, file, fileUrl, progress, pickFile, clearFile, checks, setChecks, quote, done, err, busy, submit, cc };
}

export type PublishForm = ReturnType<typeof usePublishForm>;
