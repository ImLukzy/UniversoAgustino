import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, apiError, pen, resolveQr, type HubBazarItem, type HubDocument } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { careerLabel } from "../data/unsa";
import { CareerAvatar, CareerVisual } from "../components/CareerVisual";

const PAY_LABEL: Record<string, string> = { YAPE: "Yape", PLIN: "Plin", AMBAS: "Yape y Plin" };

// Fecha local YYYY-MM-DD (evita el desfase de toISOString, que es UTC).
function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

interface Person {
  fullName: string;
  career?: string | null;
  cycle?: string | null;
  university?: string | null;
}

export function Detalle() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(0);
  const kind = type === "bazar" ? "bazar" : "document";

  const doc = useQuery({
    queryKey: ["detail-doc", id],
    queryFn: async () => (await api.get(`/documents/${id}`)).data.data as HubDocument & { author?: { profile?: Person | null } | null },
    enabled: kind === "document" && !!id,
  });
  const item = useQuery({
    queryKey: ["detail-bazar", id],
    queryFn: async () => (await api.get(`/bazar/${id}`)).data.data as HubBazarItem & { seller?: { profile?: Person | null } | null },
    enabled: kind === "bazar" && !!id,
  });

  const loading = doc.isLoading || item.isLoading;
  const photos = kind === "bazar" ? (item.data?.photos ?? []) : [];
  const title = kind === "document" ? doc.data?.title : item.data?.title;
  const price = kind === "document" ? doc.data?.priceCents : item.data?.priceCents;
  const payMethod = kind === "document" ? doc.data?.payMethod : item.data?.payMethod;
  const payQr = resolveQr(kind === "document" ? doc.data?.payQrUrl : item.data?.payQrUrl);
  const payDetail = kind === "document" ? doc.data?.payDetail : item.data?.payDetail;
  const career = kind === "document" ? doc.data?.career : undefined;
  const person: Person | null | undefined =
    kind === "document" ? doc.data?.author?.profile : item.data?.seller?.profile;
  const available =
    kind === "document" ? !!doc.data : item.data?.status === "AVAILABLE";
  const isRental = kind === "bazar" && item.data?.tx === "ALQUILER";
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");

  const buy = async () => {
    if (!user) {
      nav("/login");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { itemType: kind, itemId: id };
      if (isRental) {
        if (!rentalStart || !rentalEnd) {
          setErr("Elige las fechas de inicio y fin del alquiler.");
          setBusy(false);
          return;
        }
        if (rentalStart < todayLocal()) {
          setErr("La fecha de inicio no puede ser anterior a hoy.");
          setBusy(false);
          return;
        }
        if (rentalEnd <= rentalStart) {
          setErr("La fecha de fin debe ser posterior a la de inicio.");
          setBusy(false);
          return;
        }
        body.rentalStart = new Date(`${rentalStart}T00:00:00`).toISOString();
        body.rentalEnd = new Date(`${rentalEnd}T23:59:00`).toISOString();
      }
      const r = await api.post("/orders", body);
      nav(`/checkout/${r.data.data.id}`);
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Cargando detalle…</p>
      </main>
    );
  }
  if ((kind === "document" && !doc.data) || (kind === "bazar" && !item.data)) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6 text-center">
          <p className="font-bold">Esta publicación ya no existe.</p>
          <Link className="mt-2 inline-block font-semibold text-primary underline" to="/">Volver al marketplace</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <Link to={kind === "document" ? "/" : "/bazar"} className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Volver a {kind === "document" ? "explorar" : "bazar"}
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        {career && <span className="badge-uni">{careerLabel(career)}</span>}
        <span className="badge-uni">{kind === "document" ? doc.data!.type : `${item.data!.kind} · ${item.data!.tx}`}</span>
        {kind === "bazar" && <span className="badge-uni">{item.data!.status}</span>}
        <span className="badge-uni">{kind === "bazar" && photos.length > 0 ? `${photos.length} foto${photos.length > 1 ? "s" : ""} del producto` : "Vista previa protegida"}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Vista previa + detalle */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card overflow-hidden">
            {kind === "bazar" && photos.length > 0 ? (
              <div>
                <img src={photos[Math.min(photo, photos.length - 1)]} alt={title} className="h-80 w-full object-cover" />
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">
                    {photos.map((u, i) => (
                      <button key={`${u}-${i}`} type="button" onClick={() => setPhoto(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === Math.min(photo, photos.length - 1) ? "border-primary" : "border-transparent"}`}>
                        <img src={u} alt={`Foto ${i + 1} de ${title}`} loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <CareerVisual className="h-64 w-full" label={kind === "document" ? "Vista previa del documento" : "Foto referencial del bazar"} />
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    Universo Agustino · Vista previa
                  </span>
                </div>
                {kind === "document" && (
                  <div className="flex flex-col items-center gap-2 border-t border-slate-100 p-5 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300">lock</span>
                    <p className="font-bold">Contenido completo bloqueado</p>
                    <p className="text-sm text-slate-500">El archivo y los datos de entrega se desbloquean al comprar por {pen(price ?? 0)}.</p>
                    <button disabled={!available || busy} onClick={buy} className="btn-primary text-sm disabled:opacity-50">
                      Desbloquear por {pen(price ?? 0)}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card space-y-2 p-5">
            <h2 className="font-display text-lg font-bold">Descripción</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {(kind === "document" ? doc.data!.description : item.data!.description) || "El vendedor aún no agregó una descripción."}
            </p>
            <dl className="grid grid-cols-2 gap-2 pt-2 text-sm sm:grid-cols-4">
              {kind === "document" ? (
                <>
                  <div><dt className="text-xs text-slate-500">Curso</dt><dd className="font-semibold">{doc.data!.course}</dd></div>
                  <div><dt className="text-xs text-slate-500">Ciclo</dt><dd className="font-semibold">{doc.data!.cycle}</dd></div>
                  <div><dt className="text-xs text-slate-500">Tipo</dt><dd className="font-semibold">{doc.data!.type}</dd></div>
                  <div><dt className="text-xs text-slate-500">Universidad</dt><dd className="font-semibold">{doc.data!.university}</dd></div>
                </>
              ) : (
                <>
                  <div><dt className="text-xs text-slate-500">Categoría</dt><dd className="font-semibold">{item.data!.kind}</dd></div>
                  <div><dt className="text-xs text-slate-500">Modalidad</dt><dd className="font-semibold">{item.data!.tx}</dd></div>
                  <div><dt className="text-xs text-slate-500">Garantía</dt><dd className="font-semibold">{item.data!.depositCents ? pen(item.data!.depositCents) : "—"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Estado</dt><dd className="font-semibold">{item.data!.status}</dd></div>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Panel de compra */}
        <div className="space-y-4">
          <div className="card space-y-3 p-5">
            <h1 className="font-display text-xl font-extrabold leading-snug">{title}</h1>
            <div className="flex items-center gap-2">
              <CareerAvatar name={person?.fullName ?? "?"} className="h-11 w-11" />
              <div className="text-sm">
                <p className="font-bold">{person?.fullName ?? "Vendedor UNSA"}</p>
                <p className="text-slate-500">
                  {[person?.career ? careerLabel(person.career) : null, person?.cycle ? `Ciclo ${person.cycle}` : null].filter(Boolean).join(" · ") || "Universo Agustino"}
                </p>
              </div>
            </div>
            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <span className="material-symbols-outlined text-base">verified</span>
              Vendedor verificado UNSA
            </p>
            <p className="font-display text-3xl font-extrabold text-primary">{pen(price ?? 0)}</p>
            <p className="text-xs text-slate-500">Precio final. La comisión de custodia se calcula al confirmar.</p>
            <div className="rounded-xl bg-slate-50 p-3 text-sm space-y-2">
              <p className="font-bold">Cobro por {PAY_LABEL[payMethod ?? "YAPE"]}</p>
              {payQr ? (
                <img src={payQr} alt="QR de cobro del vendedor" className="h-28 w-28 rounded-lg border object-cover" />
              ) : (
                <p className="text-slate-500">El vendedor aún no sube su QR.</p>
              )}
              {payDetail && <p className="text-slate-600">{payDetail}</p>}
            </div>
            {isRental && available && (
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                  Inicio del alquiler
                  <input type="date" className="input" value={rentalStart} min={todayLocal()} max={rentalEnd || undefined} onChange={(e) => setRentalStart(e.target.value)} />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
                  Fin del alquiler
                  <input type="date" className="input" value={rentalEnd} min={rentalStart || todayLocal()} onChange={(e) => setRentalEnd(e.target.value)} />
                </label>
                <p className="col-span-2 text-[11px] text-slate-500">El vendedor debe aceptar tu solicitud antes de que pagues.</p>
              </div>
            )}
            {err && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{err}</p>}
            <button disabled={!available || busy} onClick={buy} className="btn-primary w-full disabled:opacity-50">
              {!available ? "No disponible" : busy ? "Creando pedido…" : user ? (isRental ? "Solicitar alquiler" : "Comprar ahora") : "Entrar y comprar"}
            </button>
            <p className="text-center text-xs text-slate-500">Compra en custodia: pagas al vendedor y se libera al confirmar recepción.</p>
          </div>

          <div className="card space-y-2 p-5 text-sm">
            <p className="font-bold">Garantías del servicio estudiantil</p>
            <p className="flex items-start gap-2 text-slate-600"><span className="material-symbols-outlined text-base text-emerald-700">lock</span>Dinero en custodia hasta que confirmas recepción.</p>
            <p className="flex items-start gap-2 text-slate-600"><span className="material-symbols-outlined text-base text-emerald-700">gavel</span>Takedown en menos de 48h (D.L. 822).</p>
            <p className="flex items-start gap-2 text-slate-600"><span className="material-symbols-outlined text-base text-emerald-700">support_agent</span>Soporte de la comunidad agustina.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
