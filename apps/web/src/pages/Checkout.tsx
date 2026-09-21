import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, fmtDate, pen, resolveQr, type HubOrder } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { CareerAvatar, CareerVisual } from "../components/CareerVisual";
import { useToast } from "../context/ToastContext";

const PAY_LABEL: Record<string, string> = { YAPE: "Yape", PLIN: "Plin", AMBAS: "Yape / Plin" };

function Step({ n, label, state }: { n: number; label: string; state: "done" | "now" | "todo" }) {
  const { accent } = useCareerTheme();
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${
          state === "done" ? "bg-emerald-600 text-white" : state === "now" ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
        }`}
        style={state === "now" && accent ? { backgroundColor: accent.color } : undefined}
      >
        {state === "done" ? "✓" : n}
      </span>
      <span className={`text-sm font-bold ${state === "todo" ? "text-slate-400" : ""}`}>{label}</span>
    </div>
  );
}

export function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const { accent } = useCareerTheme();
  const qc = useQueryClient();
  const [proof, setProof] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const order = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => (await api.get(`/orders/${orderId}`)).data.data as HubOrder,
    enabled: !!user && !!orderId,
  });
  const o = order.data;
  const itemPath = o ? (o.itemType === "document" ? `/documents/${o.itemId}` : `/bazar/${o.itemId}`) : null;
  const item = useQuery({
    queryKey: ["order-item", o?.itemType, o?.itemId],
    queryFn: async () =>
      (await api.get(itemPath!)).data.data as {
        title: string;
        author?: { profile?: { fullName: string } | null } | null;
        seller?: { profile?: { fullName: string } | null } | null;
      },
    enabled: !!o,
  });
  const sellerName =
    item.data?.author?.profile?.fullName ?? item.data?.seller?.profile?.fullName ?? "el vendedor";

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="font-semibold text-primary underline" to="/login">entrar</Link> para finalizar tu compra.
        </div>
      </main>
    );
  }
  if (order.isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p>Cargando tu pedido…</p>
      </main>
    );
  }
  if (!o || o.buyerId !== user.id) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card space-y-2 p-6 text-center">
          <p className="font-bold">Este pedido no es tuyo o ya no existe.</p>
          <Link className="font-semibold text-primary underline" to="/pedidos">Ver mis pedidos</Link>
        </div>
      </main>
    );
  }

  const paid = o.status !== "PENDING";
  const qr = resolveQr(o.payQrUrl);
  const methodLabel = PAY_LABEL[o.payMethod ?? "YAPE"];
  const copyDetail = async () => {
    try {
      await navigator.clipboard.writeText(o.payDetail ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  const pay = async () => {
    setBusy(true);
    try {
      await api.post(`/orders/${o.id}/pay`, { payProof: proof.trim() || undefined });
      toast.success("Pago declarado", "El vendedor lo confirmará y pasará a custodia.");
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders", "mine"] });
    } catch (e) {
      toast.error("No se pudo declarar el pago", apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
            Pasarela protegida · Red estudiantil Arequipa
          </p>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Finaliza tu compra en custodia</h1>
          <p className="max-w-2xl text-sm text-slate-500">
            Pagas directo al vendedor por {methodLabel}. El dinero queda en custodia hasta que confirmes recepción.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="material-symbols-outlined">bolt</span> Compra en custodia
          </span>
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-primary" style={accent ? { color: accent.color } : undefined}>
            <span className="material-symbols-outlined">lock</span> Pago directo al vendedor
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* Izquierda */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          {/* Paso 1 */}
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white"
                  style={accent ? { backgroundColor: accent.color } : undefined}
                >
                  1
                </span>
                <div>
                  <h2 className="font-display font-bold">Datos de entrega</h2>
                  <p className="text-xs text-slate-500">Tu cuenta recibe el pedido automáticamente</p>
                </div>
              </div>
              <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 sm:inline">
                Validación automática
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">Correo: </span><b>{user.email}</b></p>
              <p className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">Nombre: </span><b>{user.profile?.fullName ?? "—"}</b></p>
              <p className="rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-400">Universidad: </span><b>{user.profile?.university ?? "UNSA"}</b></p>
              <p className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-slate-400">Carrera/ciclo: </span>
                <b>{[user.profile?.career, user.profile?.cycle].filter(Boolean).join(" · ") || "—"}</b>
              </p>
            </div>
            <Link to="/cuenta" className="text-xs font-bold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>
              Editar mis datos en Mi cuenta →
            </Link>
          </section>

          {/* Paso 2 */}
          <section className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-extrabold text-white">2</span>
                <div>
                  <h2 className="font-display font-bold">Método de pago · {methodLabel}</h2>
                  <p className="text-xs text-slate-500">Sin comisiones ocultas para el comprador</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <span className="material-symbols-outlined">verified_user</span> 0% tarifa extra
              </span>
            </div>

            {o.status === "PENDING" && o.rentalStart ? (
              <div className="rounded-xl bg-amber-50 p-4 text-sm">
                <p className="font-bold text-amber-800">Solicitud enviada. El vendedor debe aceptar tu alquiler ({fmtDate(o.rentalStart)} → {fmtDate(o.rentalEnd)}) antes de que puedas pagar.</p>
                <p className="mt-1 text-amber-700">Te avisará aquí mismo cuando la acepte.</p>
              </div>
            ) : null}
            {(o.status === "ACCEPTED" || (o.status === "PENDING" && !o.rentalStart)) ? (
              <>
                {o.status === "ACCEPTED" && (
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
                    Solicitud aceptada. Ya puedes pagar al vendedor.
                  </div>
                )}
                <div className="flex flex-col items-center gap-3 rounded-xl bg-slate-50 p-4 md:flex-row">
                  <div className="flex shrink-0 flex-col items-center rounded-xl bg-white p-2 shadow-md">
                    {qr ? (
                      <img src={qr} alt="QR de cobro del vendedor" className="h-40 w-40 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-40 w-40 flex-col items-center justify-center rounded-lg bg-slate-100 p-2 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-400">qr_code_2</span>
                        <span className="mt-1 text-[11px] text-slate-500">El vendedor aún no sube su QR. Coordina el pago con él.</span>
                      </div>
                    )}
                    <span className="mt-1 text-xs font-bold">{methodLabel} del vendedor</span>
                  </div>
                  <div className="flex w-full grow flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dato receptor</span>
                      {o.payDetail && (
                        <button onClick={copyDetail} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                          {copied ? "¡Copiado!" : "Copiar dato"}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-white p-3">
                      <div className="flex flex-col">
                        <span className="font-display text-xl font-extrabold text-primary" style={accent ? { color: accent.color } : undefined}>
                          {o.payDetail || "A coordinar"}
                        </span>
                        <span className="text-xs text-slate-500">Titular: {sellerName}</span>
                      </div>
                      <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      <p className="flex items-start gap-1 rounded-lg bg-white/60 p-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-base text-indigo-600">qr_code_scanner</span>
                        <span>1. Abre tu app y paga <b>{pen(o.amountCents)}</b> al dato de arriba.</span>
                      </p>
                      <p className="flex items-start gap-1 rounded-lg bg-white/60 p-2 text-xs text-slate-500">
                        <span className="material-symbols-outlined text-base text-emerald-700">pin</span>
                        <span>2. Declara tu n° de operación abajo para avisar al vendedor.</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="flex flex-col gap-1 text-sm font-semibold">
                    <span>N° de operación o código de aprobación <span className="text-red-500">*</span></span>
                    <span className="flex items-center rounded-lg bg-slate-50 px-3 py-2">
                      <span className="material-symbols-outlined mr-2 text-slate-400">numbers</span>
                      <input
                        className="w-full bg-transparent font-bold focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        placeholder="Ej. 7842 o 094821"
                        maxLength={160}
                      />
                    </span>
                    <span className="text-xs font-normal text-slate-500">Visible en la constancia de tu app Yape/Plin.</span>
                  </label>
                </div>

                <button disabled={busy} onClick={pay} className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-base disabled:opacity-50" style={accent ? { backgroundColor: accent.color } : undefined}>
                  <span className="material-symbols-outlined text-xl">download_for_offline</span>
                  <span>{busy ? "Enviando…" : "Validar Pago y Pasar a Custodia"}</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="flex items-center justify-center gap-1 text-center text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  El vendedor confirma tu pago y el pedido queda en custodia.
                </p>
              </>
            ) : (
              <div className="rounded-xl bg-emerald-50 p-4 text-sm">
                <p className="font-bold text-emerald-800">
                  {o.status === "PAID" && "Pago declarado. Esperando que el vendedor lo confirme."}
                  {o.status === "ESCROW" && "Pago en custodia. Confirma la recepción en Mis pedidos para liberarlo."}
                  {(o.status === "RELEASED" || o.status === "REFUNDED" || o.status === "CANCELLED") && `Pedido ${o.status.toLowerCase()}.`}
                </p>
                <Link className="mt-2 inline-block font-bold text-primary underline" style={accent ? { color: accent.color } : undefined} to="/pedidos">
                  Ir a Mis pedidos →
                </Link>
              </div>
            )}
          </section>

          <section className="flex items-start gap-3 rounded-xl bg-slate-100 p-4">
            <span className="material-symbols-outlined shrink-0 text-2xl text-primary" style={accent ? { color: accent.color } : undefined}>gavel</span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">Respaldo regulatorio D.L. 822</span>
              <p className="text-sm leading-relaxed text-slate-500">
                Universo Agustino promueve material original entre estudiantes. Queda prohibida la redistribución de copias sin autorización; los reportes se atienden en menos de 48 horas.
              </p>
            </div>
          </section>
        </div>

        {/* Resumen */}
        <div className="flex flex-col gap-4 lg:col-span-5 lg:sticky lg:top-24">
          <div className="card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold">Resumen del pedido</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                1 ítem · {o.itemType === "document" ? "Digital" : "Bazar"}
              </span>
            </div>
            <div className="flex gap-3 rounded-xl bg-slate-50 p-2">
              <CareerVisual className="h-24 w-20 shrink-0 rounded-lg" iconClassName="text-title-lg" />
              <div className="flex min-w-0 flex-col justify-between py-0.5">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-bold">{item.data?.title ?? `${o.itemType} · ${o.itemId.slice(0, 8)}…`}</span>
                  <span className="truncate text-xs text-slate-500">Vendido por {sellerName}</span>
                  {o.rentalStart && o.rentalEnd && (
                    <span className="truncate text-xs font-semibold text-indigo-700">
                      Alquiler: {fmtDate(o.rentalStart)} → {fmtDate(o.rentalEnd)}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                  <span className="material-symbols-outlined text-sm">check_circle</span> Pago protegido
                </span>
              </div>
              <span className="ml-auto font-display text-lg font-extrabold">{pen(o.amountCents)}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm text-slate-500">
              <div className="flex items-center justify-between"><span>Subtotal del producto:</span><b className="text-slate-800">{pen(o.amountCents)}</b></div>
              <div className="flex items-center justify-between"><span>Comisión de custodia:</span><b className="text-emerald-700">Incluida</b></div>
              <div className="my-1 h-px bg-slate-100"></div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Total a pagar:</span>
                <span className="font-display text-3xl font-extrabold text-primary" style={accent ? { color: accent.color } : undefined}>
                  {pen(o.amountCents)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
              <CareerAvatar name={sellerName} className="h-10 w-10" />
              <div className="flex flex-col text-sm">
                <span className="font-bold">Apoyo directo al compañero</span>
                <span className="text-xs text-slate-500">{pen(o.netCents)} van a {sellerName} tras tu confirmación.</span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col gap-3 p-5">
            <span className="font-display font-bold">Garantías del servicio estudiantil</span>
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <span className="material-symbols-outlined">verified</span>
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Custodia del 100%</span>
                <p className="text-xs leading-relaxed text-slate-500">El dinero se retiene hasta que confirmas recepción. Si algo falla, se devuelve.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
                <span className="material-symbols-outlined">shield_person</span>
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Compra protegida D.L. 822</span>
                <p className="text-xs leading-relaxed text-slate-500">Solo material original. Reportes con takedown en menos de 48 horas.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-primary" style={accent ? { color: accent.color } : undefined}>
                <span className="material-symbols-outlined">support_agent</span>
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Soporte UNSA</span>
                <p className="text-xs leading-relaxed text-slate-500">
                  ¿Problemas con tu pago? Revisa el <Link to="/legal" className="font-bold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>marco legal</Link> o tus pedidos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-around rounded-xl bg-slate-100 p-3 text-center">
            <div className="flex flex-col items-center">
              <span className="font-display text-lg font-extrabold text-primary" style={accent ? { color: accent.color } : undefined}>100%</span>
              <span className="text-[11px] text-slate-500">Custodia</span>
            </div>
            <div className="h-8 w-px bg-slate-300"></div>
            <div className="flex flex-col items-center">
              <span className="font-display text-lg font-extrabold text-indigo-700">48h</span>
              <span className="text-[11px] text-slate-500">Takedown</span>
            </div>
            <div className="h-8 w-px bg-slate-300"></div>
            <div className="flex flex-col items-center">
              <span className="font-display text-lg font-extrabold text-emerald-700">D.L. 822</span>
              <span className="text-[11px] text-slate-500">Respaldo legal</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
