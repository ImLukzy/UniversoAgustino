import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, apiError, pen, resolveQr, uploadFile, uploadFileWithProgress } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { UNSA_CAREERS, careerLabel, careerOf } from "../data/unsa";
import { careerContent } from "../data/careerContent";
import { CareerVisual } from "../components/CareerVisual";
import { PhotoManager } from "../components/PhotoManager";

const FEE_PCT = 13; // Igual que PLATFORM_FEE_PCT del backend.
const MAX_MB = 25;
const CYCLES = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const DOC_TYPES = [
  { v: "APUNTE", l: "Apunte / Resumen" },
  { v: "PAE", l: "Guía PAE" },
  { v: "BALOTARIO", l: "Balotario" },
  { v: "GUIA", l: "Guía de estudio" },
];
const BAZAR_KINDS = ["Libros y Manuales", "Instrumentos y Herramientas", "Uniformes y Vestimenta", "Accesorios y Materiales"];
const BAZAR_KIND_ENUM = ["LIBRO", "INSTRUMENTO", "SCRUB", "INSTRUMENTO"] as const;

const soles = (n: number) => `S/ ${n.toFixed(2)}`;
const mbOf = (f: File) => `${(f.size / 1048576).toFixed(1)} MB`;

export function Publicar() {
  const { user } = useAuth();
  const { career: themeCareer, accent } = useCareerTheme();
  const cc = careerContent(themeCareer);
  const nav = useNavigate();

  const [mode, setMode] = useState<"digital" | "fisico">("digital");
  // Paso 1
  const [title, setTitle] = useState("");
  const [career, setCareer] = useState(themeCareer && themeCareer !== "all" ? themeCareer : "ENFERMERIA");
  const [cycle, setCycle] = useState("VI");
  const [course, setCourse] = useState("");
  const [docType, setDocType] = useState("APUNTE");
  const [description, setDescription] = useState("");
  const [kindIdx, setKindIdx] = useState(0);
  const [tx, setTx] = useState<"VENTA" | "ALQUILER">("VENTA");
  const [campus, setCampus] = useState(cc.bazarPlaces[0]);
  const [deposit, setDeposit] = useState("");
  // Paso 2
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pageStart, setPageStart] = useState(1);
  const [pageEnd, setPageEnd] = useState(2);
  const [watermark, setWatermark] = useState(true);
  // Paso 3
  const [price, setPrice] = useState(cc.suggestPrice);
  const [payMethod, setPayMethod] = useState<"YAPE" | "PLIN" | "AMBAS">("YAPE");
  const [payDetail, setPayDetail] = useState("");
  const [payQr, setPayQr] = useState("");
  const [qrBusy, setQrBusy] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  // Paso 4
  const [chk1, setChk1] = useState(false);
  const [chk2, setChk2] = useState(false);
  const [chk3, setChk3] = useState(false);

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-primary underline" to="/login">entrar</Link> para publicar material.
        </div>
      </main>
    );
  }

  const priceNum = Number(price) || 0;
  const fee = +(priceNum * (FEE_PCT / 100)).toFixed(2);
  const net = +(priceNum - fee).toFixed(2);
  const authorName = user.profile?.fullName?.trim() || user.email;
  // Accent de la carrera SELECCIONADA en el formulario (no del tema global):
  // alimenta --career-accent para pills, focos, dropzone y vista previa.
  const selCareer = careerOf(career);
  const selColor = selCareer?.color ?? accent?.color ?? "#0f766e";

  const step1 = mode === "digital"
    ? title.trim().length >= 4 && course.trim().length >= 2 && !!cycle
    : title.trim().length >= 4;
  const step2 = mode === "digital" ? !!fileUrl : payQr !== "" || payDetail.trim() !== "";
  const step3 = priceNum > 0;
  const step4 = chk1 && chk2 && chk3;
  const steps = mode === "digital"
    ? [
        { t: "Datos Académicos", d: `${careerLabel(career)} · Ciclo ${cycle}`, done: step1 },
        { t: "Carga & Muestra", d: file ? `${file.name} · muestra págs ${pageStart}-${pageEnd}` : "PDF + preview 2 págs", done: step2 },
        { t: "Precio y Ganancia", d: `Neto ${soles(net)} (${100 - FEE_PCT}%)`, done: step3 },
        { t: "Ética D.L. 822", d: "Declaración jurada", done: step4 },
      ]
    : [
        { t: "Datos del Artículo", d: `${BAZAR_KINDS[kindIdx]} · ${tx === "VENTA" ? "Venta" : "Alquiler"}`, done: step1 },
        { t: "Cobro Yape/Plin", d: payMethod === "AMBAS" ? "Yape y Plin" : payMethod, done: step2 },
        { t: "Precio y Ganancia", d: `Neto ${soles(net)} (${100 - FEE_PCT}%)`, done: step3 },
        { t: "Ética D.L. 822", d: "Declaración jurada", done: step4 },
      ];

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    setErr("");
    if (f.size > MAX_MB * 1048576) {
      setErr(`El archivo supera los ${MAX_MB} MB permitidos.`);
      return;
    }
    setFile(f);
    setUploading(true);
    setProgress(0);
    try {
      setFileUrl(await uploadFileWithProgress(f, setProgress));
      setProgress(100);
    } catch (e) {
      setErr(apiError(e));
      setFile(null);
      setProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const pickQr = async (f: File | undefined) => {
    if (!f) return;
    setErr("");
    setQrBusy(true);
    try {
      setPayQr(await uploadFile(f));
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setQrBusy(false);
    }
  };

  const submit = async () => {
    setErr("");
    if (!step1) { setErr("Completa el paso 1: título" + (mode === "digital" ? ", curso y ciclo." : ".")); return; }
    if (mode === "digital" && !fileUrl) { setErr("Sube tu archivo PDF en el paso 2."); return; }
    if (!step3) { setErr("Fija un precio mayor a S/ 0 en el paso 3."); return; }
    if (!step4) { setErr("Marca las 3 declaraciones del paso 4 (D.L. 822)."); return; }
    setBusy(true);
    try {
      if (mode === "digital") {
        const r = await api.post("/documents", {
          title: title.trim(), course: course.trim(), university: "UNSA",
          career, cycle, type: docType,
          priceCents: Math.round(priceNum * 100),
          fileUrl, description: description.trim() || undefined,
          payMethod, payDetail: payDetail.trim() || undefined, payQrUrl: payQr || undefined,
        });
        nav(`/v/${r.data.data.id}`);
      } else {
        const r = await api.post("/bazar", {
          title: title.trim(), kind: BAZAR_KIND_ENUM[kindIdx], tx,
          priceCents: Math.round(priceNum * 100),
          depositCents: tx === "ALQUILER" && deposit ? Math.round(Number(deposit) * 100) : undefined,
          description: (description.trim() ? description.trim() + " " : "") + `Entrega: ${campus}` || undefined,
          photos,
          payMethod, payDetail: payDetail.trim() || undefined, payQrUrl: payQr || undefined,
        });
        nav(`/p/bazar/${r.data.data.id}`);
      }
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const qrPreview = resolveQr(payQr);
  const blockedPct = Math.max(0, Math.min(99, Math.round(((pageEnd - pageStart + 1 > 0 ? 24 - (pageEnd - pageStart + 1) : 22) / 24) * 100)));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Encabezado */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-[280px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary-fixed-dim/20 via-secondary-fixed/25 to-primary/10 blur-3xl"></div>
        <div className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-sm">local_hospital</span>
              Centro de Creadores y Publicación · Arequipa
            </span>
            {accent && (
              <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: accent.color }}>
                {accent.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
              Revisión promedio: menos de 2 horas
            </span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Publica tu Material y Comienza a Generar Ingresos</h1>
          <p className="max-w-3xl leading-relaxed text-slate-600">
            Comparte apuntes originales o artículos de bazar con la comunidad agustina de Arequipa. Todo pago pasa por tu Yape/Plin y la custodia de Universo Agustino.
          </p>
        </div>

        {/* Modos */}
        <div className="relative mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("digital")}
            className={`group flex items-start gap-3 rounded-xl p-4 text-left shadow-sm transition-all hover:shadow-md ${mode === "digital" ? "bg-white" : "bg-surface-container-low/70 hover:bg-surface-container-low"}`}
          >
            {mode === "digital" && <div className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-xl bg-primary" style={accent ? { backgroundColor: accent.color } : undefined}></div>}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" style={accent ? { color: accent.color } : undefined}>
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold">Apunte Digital (PDF)</span>
                {mode === "digital" && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white" style={accent ? { backgroundColor: accent.color } : undefined}>Activo</span>}
              </div>
              <p className="mt-1 text-sm text-slate-600">{cc.digitalEx}. Liquidación digital con custodia.</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMode("fisico")}
            className={`group relative flex items-start gap-3 rounded-xl p-4 text-left transition-all ${mode === "fisico" ? "bg-white shadow-sm hover:shadow-md" : "bg-surface-container-low/70 hover:bg-surface-container-low"}`}
          >
            {mode === "fisico" && <div className="absolute bottom-0 left-0 top-0 w-1.5 rounded-l-xl bg-primary" style={accent ? { backgroundColor: accent.color } : undefined}></div>}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-slate-600">
              <span className="material-symbols-outlined text-3xl">{cc.visualIcon}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold">Artículo Físico de Bazar</span>
                {mode === "fisico"
                  ? <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white" style={accent ? { backgroundColor: accent.color } : undefined}>Activo</span>
                  : <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-slate-600">Cambiar</span>}
              </div>
              <p className="mt-1 text-sm text-slate-600">{cc.fisicoEx}, con entrega coordinada en Arequipa.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Pasos */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className={`flex items-center gap-2 ${!s.done && i > 0 ? "grayscale" : ""}`}>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={s.done ? { backgroundColor: accent?.color ?? "rgb(var(--hub-p, 0 104 95))", color: "#fff" } : undefined}
              >
                {!s.done && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high font-bold text-slate-600">{i + 1}</span>}
                {s.done && (i + 1)}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className={`truncate text-xs font-bold ${s.done ? "text-primary" : "text-slate-800"}`} style={s.done && accent ? { color: accent.color } : undefined}>{s.t}</span>
                <span className="truncate text-[11px] text-slate-600">{s.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scope --career-accent: la vista previa y los focos muestran la carrera
          SELECCIONADA en el formulario (lo que verá el comprador), no el tema
          global. El chrome de página (modos, pasos, CTA) conserva el accent. */}
      <div className="career-scope mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12" style={{ "--career-accent": selColor } as CSSProperties}>
        {/* Formulario */}
        <div className="flex flex-col gap-4 lg:col-span-8">
          {/* Paso 1 */}
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">1 · {mode === "digital" ? "Información Académica del Recurso" : "Datos del Artículo"}</h2>
              <span className="badge-uni">Obligatorio</span>
            </div>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {mode === "digital" ? "Título Claro y Descriptivo *" : "Título del Artículo o Libro *"}
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={mode === "digital" ? cc.publishTitlePh : cc.bazarTitlePh} maxLength={160} />
            </label>
            {mode === "digital" ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex flex-col gap-1 text-sm font-semibold md:col-span-2">
                    <span id="career-pick-label">Carrera UNSA *</span>
                    <div role="group" aria-labelledby="career-pick-label" className="flex flex-wrap gap-1.5">
                      {UNSA_CAREERS.map((c) => {
                        const activePill = career === c.key;
                        return (
                          <motion.button
                            key={c.key}
                            type="button"
                            aria-pressed={activePill}
                            onClick={() => setCareer(c.key)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className={`relative rounded-full px-3 py-1.5 text-xs font-bold ${activePill ? "" : "border border-slate-200/80 bg-white text-slate-600"}`}
                          >
                            {activePill && (
                              <motion.span
                                layoutId="selectedCareer"
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="absolute inset-0 rounded-full border"
                                style={{ backgroundColor: c.soft, borderColor: c.color }}
                              />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5" style={activePill ? { color: c.color } : undefined}>
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                              {c.label}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Ciclo *
                    <select className="input" value={cycle} onChange={(e) => setCycle(e.target.value)}>
                      {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Asignatura / Curso *
                    <input className="input" value={course} onChange={(e) => setCourse(e.target.value)} placeholder={cc.publishCoursePh} maxLength={100} />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Tipo de material
                    <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                      {DOC_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Categoría
                    <select className="input" value={kindIdx} onChange={(e) => setKindIdx(Number(e.target.value))}>
                      {BAZAR_KINDS.map((k, i) => <option key={k} value={i}>{k}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Modalidad
                    <select className="input" value={tx} onChange={(e) => setTx(e.target.value as "VENTA" | "ALQUILER")}>
                      <option value="VENTA">Venta Definitiva</option>
                      <option value="ALQUILER">Alquiler por Ciclo</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Punto de entrega
                    <select className="input" value={campus} onChange={(e) => setCampus(e.target.value)}>
                      {cc.bazarPlaces.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Garantía S/ (solo alquiler, opcional)
                    <input className="input" type="number" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Ej: 50.00" />
                  </label>
                </div>
              </>
            )}
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Descripción
              <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalla qué encontrará tu compañero…" maxLength={2000} />
            </label>
          </section>

          {/* Paso 2 */}
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">2 · {mode === "digital" ? "Archivo Principal y Muestra Protegida" : "Fotos del Producto y Cobro"}</h2>
              {mode === "digital" && <span className="badge-uni">PDF · JPG · PNG · EPUB (máx 25 MB)</span>}
            </div>
            {mode === "digital" ? (
              <>
                {!file ? (
                  <motion.label
                    animate={{
                      scale: dragActive ? 1.02 : 1,
                      borderColor: dragActive ? selColor : "rgba(203, 213, 225, 0)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); void pickFile(e.dataTransfer.files?.[0]); }}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-slate-50 p-8 text-center transition-colors hover:bg-slate-100"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary" style={{ color: selColor }}>
                      <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                    </span>
                    <span className="font-bold">{dragActive ? "Suelta tu documento aquí" : uploading ? "Subiendo…" : "Arrastra tu documento o haz clic"}</span>
                    <span className="max-w-sm text-sm text-slate-600">PDF de texto editable o vectorial de alta resolución.</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.epub" onChange={(e) => pickFile(e.target.files?.[0])} />
                  </motion.label>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-800">
                        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{file.name}</span>
                        <span className="text-xs text-slate-600">{mbOf(file)} · listo para publicar</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <label className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-slate-200" title="Reemplazar archivo">
                        <span className="material-symbols-outlined">sync</span>
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.epub" onChange={(e) => pickFile(e.target.files?.[0])} />
                      </label>
                      <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Eliminar archivo" onClick={() => { setFile(null); setFileUrl(""); setProgress(null); }}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {progress !== null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-slate-200/80 p-3"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                        <span>{fileUrl ? "Subida completa · listo para publicar" : "Subiendo archivo…"}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: selColor }}
                          initial={false}
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-primary/5 p-3">
                  <label className="flex flex-col gap-1 text-xs font-bold">Pág. inicial muestra
                    <input className="input text-center font-bold" type="number" min={1} max={99} value={pageStart} onChange={(e) => setPageStart(Number(e.target.value))} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-bold">Pág. final muestra
                    <input className="input text-center font-bold" type="number" min={1} max={99} value={pageEnd} onChange={(e) => setPageEnd(Number(e.target.value))} />
                  </label>
                  <div className="flex flex-col justify-end rounded-lg bg-white p-2 text-center">
                    <span className="text-[11px] text-slate-600">Resto bloqueado</span>
                    <span className="text-xs font-bold text-primary" style={accent ? { color: accent.color } : undefined}>~{blockedPct}%</span>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="mt-0.5 h-4 w-4" />
                  <span>Incrustar marca de agua automática: <em>"Muestra de {authorName} · Licencia D.L. 822 · Universo Agustino"</em></span>
                </label>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Fotos del producto (máx 4, se muestran tal cual, sin marcas)</span>
                  <PhotoManager value={photos} onChange={setPhotos} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    ¿Cómo te pagan?
                    <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value as "YAPE" | "PLIN" | "AMBAS")}>
                      <option value="YAPE">Yape</option>
                      <option value="PLIN">Plin</option>
                      <option value="AMBAS">Yape y Plin</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    Titular / número
                    <input className="input" value={payDetail} onChange={(e) => setPayDetail(e.target.value)} placeholder="Yape 999888777 - Tu Nombre" maxLength={160} />
                  </label>
                </div>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl bg-slate-50 p-6 text-center hover:bg-slate-100">
                  <span className="material-symbols-outlined text-3xl text-slate-600">qr_code_2</span>
                  <span className="text-sm font-bold">{qrBusy ? "Subiendo QR…" : payQr ? "Cambiar imagen QR" : "Subir imagen de tu QR"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => pickQr(e.target.files?.[0])} />
                </label>
                {qrPreview && <img src={qrPreview} alt="QR de cobro" className="h-36 w-36 rounded-xl border object-cover" />}
              </>
            )}
          </section>

          {/* Paso 3 */}
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">3 · Fijación de Precio y Ganancia Neta</h2>
              <span className="badge-uni">Retención {FEE_PCT}%</span>
            </div>
            <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
              <label className="flex flex-col gap-1 font-bold md:col-span-5">
                Precio de venta (PEN)
                <span className="flex items-center gap-2">
                  <span className="font-display text-xl font-bold text-[var(--career-accent)]">S/</span>
                  <input className="input w-full font-display text-xl font-bold" type="number" min={0} max={500} step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </span>
                <span className="text-xs font-normal text-slate-600">Sugerido{accent ? ` · ${accent.label}` : ""}: {soles(cc.suggestPrice)}</span>
              </label>
              <div className="rounded-xl bg-slate-50 p-4 text-sm md:col-span-7">
                <p className="font-bold">Desglose por cada venta</p>
                <div className="flex justify-between py-1 text-slate-600"><span>Precio pagado:</span><b className="text-slate-800">{soles(priceNum)}</b></div>
                <div className="flex justify-between py-1 text-slate-600"><span>Comisión plataforma ({FEE_PCT}%):</span><b className="text-red-600">- {soles(fee)}</b></div>
                <div className="my-1 h-0.5 bg-slate-200"></div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-bold text-emerald-700">Tu ganancia ({100 - FEE_PCT}%):</span>
                  <span className="font-display text-xl font-extrabold text-emerald-700">{soles(net)} netos</span>
                </div>
              </div>
            </div>
            {mode === "digital" && (
              <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  ¿Cómo te pagan?
                  <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value as "YAPE" | "PLIN" | "AMBAS")}>
                    <option value="YAPE">Yape</option>
                    <option value="PLIN">Plin</option>
                    <option value="AMBAS">Yape y Plin</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold">
                  Titular / número
                  <input className="input" value={payDetail} onChange={(e) => setPayDetail(e.target.value)} placeholder="Yape 999888777 - Tu Nombre" maxLength={160} />
                </label>
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl bg-white p-3 text-center text-sm font-bold hover:bg-slate-100 sm:col-span-2">
                  <span>{qrBusy ? "Subiendo QR…" : payQr ? "Cambiar imagen QR" : "Subir imagen de tu QR (opcional)"}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => pickQr(e.target.files?.[0])} />
                </label>
                {qrPreview && <img src={qrPreview} alt="QR de cobro" className="h-24 w-24 rounded-xl border object-cover" />}
              </div>
            )}
          </section>

          {/* Paso 4 */}
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">4 · Declaración Jurada (D.L. 822)</h2>
              <span className="rounded-md bg-red-100 px-2 py-1 text-[11px] font-bold text-red-800">Indispensable</span>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Universo Agustino promueve el estudio colaborativo y sanciona el plagio. Tu publicación puede pasar por revisión antes de listarse.
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" checked={chk1} onChange={(e) => setChk1(e.target.checked)} className="mt-0.5 h-5 w-5" />
              <span><b>Declaro bajo juramento que este material es de mi autoría</b> y <b>NO contiene</b> exámenes oficiales ni escaneos íntegros de libros protegidos (Arts. 21 y 22 del D.L. 822).</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" checked={chk2} onChange={(e) => setChk2(e.target.checked)} className="mt-0.5 h-5 w-5" />
              <span><b>Confirmo que todo dato sensible de terceros está anonimizado</b> (sin nombres, DNI ni datos identificables), según la Ley N° 29733.</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" checked={chk3} onChange={(e) => setChk3(e.target.checked)} className="mt-0.5 h-5 w-5" />
              <span>Acepto la retención del {FEE_PCT}% para el servidor y la devolución si el material está incompleto o dañado.</span>
            </label>
          </section>

          {err && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{err}</p>}
          <div className="flex justify-end pb-8">
            <button
              disabled={busy}
              onClick={submit}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-base disabled:opacity-50"
              style={accent ? { backgroundColor: accent.color } : undefined}
            >
              <span>{mode === "digital" ? "Revisar y Publicar en Marketplace" : "Publicar en Bazar"}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Vista previa viva */}
        <div className="flex flex-col gap-4 lg:col-span-4 lg:sticky lg:top-24">
          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--career-accent)]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                Vista previa en tienda
              </span>
              <span className="badge-uni">Tiempo real</span>
            </div>
            <div className="overflow-hidden rounded-xl shadow-md">
              <div className="relative">
                <CareerVisual className="h-44 w-full" />
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-primary/20 p-2" style={{ backgroundColor: `${selColor}33` }}>
                  <div className="flex items-start justify-between">
                    <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">Muestra: {mode === "digital" ? `${pageEnd - pageStart + 1} págs` : "Físico"}</span>
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">
                      <span className="material-symbols-outlined text-xs">lock_open</span>
                      {mode === "digital" ? "PDF Digital" : tx === "VENTA" ? "Venta" : "Alquiler"}
                    </span>
                  </div>
                  {watermark && mode === "digital" && (
                    <span className="self-center -rotate-12 rounded bg-white/85 px-2 py-1 text-[11px] font-bold text-[var(--career-accent)]">
                      © Universo Agustino · {authorName}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <div className="flex items-center justify-between">
                  <span className="badge-uni">{mode === "digital" ? `${careerLabel(career)} · ${docType}` : `${BAZAR_KINDS[kindIdx]} · ${tx}`}</span>
                  <span className="font-display text-xl font-extrabold text-[var(--career-accent)]">{soles(priceNum)}</span>
                </div>
                <h3 className="font-bold leading-tight line-clamp-2">{title || "Tu título aparecerá aquí…"}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{description || (mode === "digital" ? course || "Tu descripción…" : campus)}</p>
                <div className="my-1 h-0.5 bg-slate-100"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Por {authorName}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                    <span className="material-symbols-outlined text-sm">verified</span> D.L. 822
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">
              <span className="material-symbols-outlined shrink-0">lock</span>
              <span>Protegido con sellado al descargar. El comprador recibe copia nominada.</span>
            </div>
          </div>

          <div className="card space-y-2 p-4">
            <h4 className="flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[var(--career-accent)]">checklist_rtl</span>
              Checklist de aprobación exprés
            </h4>
            <p className="text-xs text-slate-600">Revisión del equipo moderador en menos de 2 horas:</p>
            <ul className="space-y-1 text-xs">
              {[
                "Título claro y archivo legible, sin fotos borrosas.",
                "Fuentes citadas y material de autoría propia.",
                "Sin nombres de docentes ni exámenes cerrados.",
                payQr || payDetail ? "Cobro configurado: el comprador verá tu QR." : "Configura tu QR para cobrar sin demoras.",
              ].map((li) => (
                <li key={li} className="flex items-start gap-1">
                  <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                  <span>{li}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 p-3">
            <div className="flex flex-col">
              <span className="text-sm font-bold">¿Dudas con tu material?</span>
              <span className="text-xs text-slate-600">Revisa el marco legal antes de publicar.</span>
            </div>
            <Link to="/legal" className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[var(--career-accent)] shadow-sm hover:bg-slate-50">
              <span className="material-symbols-outlined text-base">gavel</span> D.L. 822
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
