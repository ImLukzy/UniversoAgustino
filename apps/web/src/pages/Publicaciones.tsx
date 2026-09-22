import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, pen, resolveQr, uploadFile, type HubBazarItem, type HubDocument, type HubOrder, type PayMethod } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { useCareerTheme } from "../live/careerTheme";
import { careerContent } from "../data/careerContent";
import { careerLabel } from "../data/unsa";
import { CareerVisual } from "../components/CareerVisual";
import { PhotoManager } from "../components/PhotoManager";
import { ConfirmModal } from "../components/ConfirmModal";
import { SaleActions } from "../components/SaleActions";
import { getOrderLabel } from "../lib/orderLabels";

const PAY_LABEL: Record<string, string> = { YAPE: "Yape", PLIN: "Plin", AMBAS: "Yape y Plin" };

type QrInfo = { title: string; price: string; method: string; qr: string | null; detail: string };

function QrModal({ info, onClose }: { info: QrInfo | null; onClose: () => void }) {
  if (!info) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-5 text-center shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100" aria-label="Cerrar">
          <span className="material-symbols-outlined">close</span>
        </button>
        <span className="material-symbols-outlined mb-1 text-4xl text-primary">qr_code_2</span>
        <h3 className="font-display text-lg font-extrabold">Cobro de material</h3>
        <p className="max-w-full truncate text-sm text-slate-500">{info.title}</p>
        <div className="my-3 rounded-xl bg-slate-50 p-3">
          {info.qr ? (
            <img src={info.qr} alt={`QR de cobro · ${info.title}`} className="h-44 w-44 rounded-lg border object-cover" />
          ) : (
            <p className="max-w-[220px] text-xs text-slate-500">Esta publicación aún no tiene QR. Edítala para subirlo.</p>
          )}
        </div>
        <div className="w-full rounded-lg bg-primary/10 px-2 py-1 text-lg font-extrabold text-primary">{info.price}</div>
        <p className="mt-1 text-xs text-slate-500">{info.method}{info.detail ? ` · ${info.detail}` : ""}</p>
        <button onClick={onClose} className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-bold text-white">
          Listo / Cerrar
        </button>
      </div>
    </div>
  );
}

function PayFields({
  method, detail, qr, onMethod, onDetail, onQr,
}: {
  method: string; detail: string; qr: string;
  onMethod: (v: PayMethod) => void; onDetail: (v: string) => void; onQr: (v: string) => void;
}) {
  const [up, setUp] = useState(false);
  const [upErr, setUpErr] = useState("");
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setUp(true);
    setUpErr("");
    try {
      onQr(await uploadFile(f));
    } catch (e) {
      setUpErr(apiError(e));
    } finally {
      setUp(false);
    }
  };
  const preview = resolveQr(qr);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        ¿Cómo te pagan?
        <select className="input" value={method} onChange={(e) => onMethod(e.target.value as PayMethod)}>
          <option value="YAPE">Yape</option>
          <option value="PLIN">Plin</option>
          <option value="AMBAS">Yape y Plin</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
        Titular / número (ej. Yape 999888777 - Rosa Q.)
        <input className="input" value={detail} onChange={(e) => onDetail(e.target.value)} placeholder="Yape 999888777 - Tu Nombre" maxLength={160} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold text-slate-500 sm:col-span-2">
        QR de cobro (imagen)
        <input type="file" accept="image/*" className="text-xs font-normal" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {up && <p className="text-xs text-slate-500 sm:col-span-2">Subiendo QR…</p>}
      {upErr && <p className="text-xs font-semibold text-red-600 sm:col-span-2">{upErr}</p>}
      {preview && (
        <div className="flex items-center gap-2 sm:col-span-2">
          <img src={preview} alt="QR de cobro" className="h-20 w-20 rounded-lg border object-cover" />
          <button type="button" className="text-xs font-bold text-red-600 hover:underline" onClick={() => onQr("")}>
            Quitar QR
          </button>
        </div>
      )}
    </div>
  );
}

function EditDoc({ doc, liveOrders, onDone }: { doc: HubDocument; liveOrders: number; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    title: doc.title,
    course: doc.course,
    cycle: doc.cycle,
    soles: String(doc.priceCents / 100),
    description: doc.description ?? "",
    payMethod: (doc.payMethod ?? "YAPE") as PayMethod,
    payDetail: doc.payDetail ?? "",
    payQrUrl: doc.payQrUrl ?? "",
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api.patch(`/documents/${doc.id}`, {
        title: f.title.trim(),
        course: f.course.trim(),
        cycle: f.cycle.trim(),
        priceCents: Math.round(Number(f.soles) * 100),
        description: f.description.trim() || null,
        payMethod: f.payMethod,
        payDetail: f.payDetail.trim() || null,
        payQrUrl: f.payQrUrl || null,
      });
      void qc.invalidateQueries({ queryKey: ["docs-mine"] });
      setMsg("Guardado.");
      onDone();
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/documents/${doc.id}`);
      void qc.invalidateQueries({ queryKey: ["docs-mine"] });
      onDone();
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <input className="input font-bold" value={f.title} onChange={set("title")} placeholder="Título" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className="input" value={f.course} onChange={set("course")} placeholder="Curso" />
        <input className="input" value={f.cycle} onChange={set("cycle")} placeholder="Ciclo (I, II…)" />
        <input className="input" type="number" min={0} value={f.soles} onChange={set("soles")} placeholder="Precio S/" />
      </div>
      <textarea className="input" rows={2} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} placeholder="Descripción" />
      <PayFields
        method={f.payMethod} detail={f.payDetail} qr={f.payQrUrl}
        onMethod={(v) => setF((s) => ({ ...s, payMethod: v }))}
        onDetail={(v) => setF((s) => ({ ...s, payDetail: v }))}
        onQr={(v) => setF((s) => ({ ...s, payQrUrl: v }))}
      />
      {msg && <p className="text-xs font-semibold text-slate-600">{msg}</p>}
      {liveOrders > 0 && Math.round(Number(f.soles) * 100) !== doc.priceCents && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Tienes {liveOrders} pedido(s) activos con el precio anterior ({pen(doc.priceCents)}). El cambio solo aplicará a nuevas reservas.
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={busy} onClick={save} className="btn-primary text-sm disabled:opacity-50">Guardar cambios</button>
        <button disabled={busy} onClick={() => setConfirming(true)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 disabled:opacity-50">Eliminar</button>
      </div>
      <ConfirmModal
        info={confirming ? { title: "Eliminar publicación", message: `¿Eliminar "${doc.title}"? Esta acción no se puede deshacer.` } : null}
        busy={busy}
        onConfirm={remove}
        onClose={() => { if (!busy) setConfirming(false); }}
      />
    </div>
  );
}

function EditBazar({ item, liveOrders, onDone }: { item: HubBazarItem; liveOrders: number; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    title: item.title,
    soles: String(item.priceCents / 100),
    description: item.description ?? "",
    payMethod: (item.payMethod ?? "YAPE") as PayMethod,
    payDetail: item.payDetail ?? "",
    payQrUrl: item.payQrUrl ?? "",
  });
  const [photos, setPhotos] = useState<string[]>(item.photos ?? []);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api.patch(`/bazar/${item.id}`, {
        title: f.title.trim(),
        priceCents: Math.round(Number(f.soles) * 100),
        description: f.description.trim() || null,
        photos,
        payMethod: f.payMethod,
        payDetail: f.payDetail.trim() || null,
        payQrUrl: f.payQrUrl || null,
      });
      void qc.invalidateQueries({ queryKey: ["bazar-mine"] });
      setMsg("Guardado.");
      onDone();
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/bazar/${item.id}`);
      void qc.invalidateQueries({ queryKey: ["bazar-mine"] });
      onDone();
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input className="input font-bold" value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} placeholder="Título" />
        <input className="input" type="number" min={0} value={f.soles} onChange={(e) => setF((s) => ({ ...s, soles: e.target.value }))} placeholder="Precio S/" />
      </div>
      <textarea className="input" rows={2} value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} placeholder="Descripción" />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-slate-500">Fotos del producto (máx 4, se muestran sin marcas)</span>
        <PhotoManager value={photos} onChange={setPhotos} />
      </div>
      <PayFields
        method={f.payMethod} detail={f.payDetail} qr={f.payQrUrl}
        onMethod={(v) => setF((s) => ({ ...s, payMethod: v }))}
        onDetail={(v) => setF((s) => ({ ...s, payDetail: v }))}
        onQr={(v) => setF((s) => ({ ...s, payQrUrl: v }))}
      />
      {msg && <p className="text-xs font-semibold text-slate-600">{msg}</p>}
      {liveOrders > 0 && Math.round(Number(f.soles) * 100) !== item.priceCents && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Tienes {liveOrders} pedido(s) activos con el precio anterior ({pen(item.priceCents)}). El cambio solo aplicará a nuevas reservas.
        </p>
      )}
      <div className="flex gap-2">
        <button disabled={busy} onClick={save} className="btn-primary text-sm disabled:opacity-50">Guardar cambios</button>
        <button disabled={busy} onClick={() => setConfirming(true)} className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-bold text-red-600 disabled:opacity-50">Eliminar</button>
      </div>
      <ConfirmModal
        info={confirming ? { title: "Eliminar publicación", message: `¿Eliminar "${item.title}"? Esta acción no se puede deshacer.` } : null}
        busy={busy}
        onConfirm={remove}
        onClose={() => { if (!busy) setConfirming(false); }}
      />
    </div>
  );
}

function SaleRow({ order }: { order: HubOrder }) {
  const { accent } = useCareerTheme();
  return (
    <div className="card flex flex-col gap-2 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto font-bold">{order.itemType} · {order.itemId.slice(0, 8)}…</p>
        <span className="badge-uni">{getOrderLabel(order.status, "seller", order.cancelledReason)}</span>
        <span className="font-bold text-primary">{pen(order.amountCents)}</span>
      </div>
      {order.payProof && <p className="text-slate-500">Constancia del comprador: <b>{order.payProof}</b></p>}
      <SaleActions order={order} accentColor={accent?.color ?? null} />
    </div>
  );
}

const SORTS = ["recent", "sold", "price_asc", "price_desc"] as const;
type SortKey = (typeof SORTS)[number];
const isSortKey = (v: string): v is SortKey => (SORTS as readonly string[]).includes(v);

function itemStats(sales: HubOrder[], id: string) {
  const rows = sales.filter((o) => o.itemId === id && o.status !== "CANCELLED" && o.status !== "REFUNDED");
  const rel = rows.filter((o) => o.status === "RELEASED");
  return { pedidos: rows.length, ventas: rel.length, neto: rel.reduce((a, o) => a + o.netCents, 0) };
}

// Sprint F2-09: pedidos que congelaron el precio anterior (el cambio de
// precio solo aplica a nuevas reservas).
const LIVE_STATUSES = ["PENDING", "ACCEPTED", "PAID", "ESCROW"];
function liveCount(sales: HubOrder[], id: string) {
  return sales.filter((o) => o.itemId === id && LIVE_STATUSES.includes(o.status)).length;
}

export function Publicaciones() {
  const { user } = useAuth();
  const { career, accent } = useCareerTheme();
  const cc = careerContent(career);
  const [filter, setFilter] = useState<"all" | "digital" | "bazar">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [openDoc, setOpenDoc] = useState("");
  const [openBazar, setOpenBazar] = useState("");
  const [qr, setQr] = useState<QrInfo | null>(null);
  const [qrMsg, setQrMsg] = useState("");

  const docs = useQuery({
    queryKey: ["docs-mine"],
    queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[],
    enabled: !!user,
  });
  const bazar = useQuery({
    queryKey: ["bazar-mine"],
    queryFn: async () => (await api.get("/bazar/mine")).data.data as HubBazarItem[],
    enabled: !!user,
  });
  const sales = useQuery({
    queryKey: ["orders", "sales"],
    queryFn: async () => (await api.get("/orders/sales")).data.data as HubOrder[],
    enabled: !!user,
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="card p-6">
          Debes <Link className="underline font-semibold text-primary" to="/login">entrar</Link> para gestionar tus publicaciones.
        </div>
      </main>
    );
  }

  const myDocs = docs.data ?? [];
  const myBazar = bazar.data ?? [];
  const mySales = sales.data ?? [];
  const activeDocs = myDocs.filter((d) => d.status === "PUBLISHED");
  const activeBazar = myBazar.filter((b) => b.status === "AVAILABLE");
  const releasedNet = mySales.filter((o) => o.status === "RELEASED").reduce((a, o) => a + o.netCents, 0);

  type Row =
    | { kind: "doc"; id: string; title: string; sub: string; price: number; createdAt: string; ref: HubDocument }
    | { kind: "bazar"; id: string; title: string; sub: string; price: number; createdAt: string; ref: HubBazarItem };
  const rows: Row[] = [
    ...myDocs.map((d): Row => ({
      kind: "doc", id: d.id, title: d.title,
      sub: `${d.course} · Ciclo ${d.cycle} · ${d.type}`,
      price: d.priceCents, createdAt: d.createdAt ?? "", ref: d,
    })),
    ...myBazar.map((b): Row => ({
      kind: "bazar", id: b.id, title: b.title,
      sub: `${b.kind} · ${b.tx} · ${b.status}`,
      price: b.priceCents, createdAt: b.createdAt ?? "", ref: b,
    })),
  ];
  const needle = q.trim().toLowerCase();
  const visible = rows
    .filter((r) => (filter === "all" ? true : filter === "digital" ? r.kind === "doc" : r.kind === "bazar"))
    .filter((r) => !needle || r.title.toLowerCase().includes(needle) || r.sub.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "sold") return itemStats(mySales, b.id).ventas - itemStats(mySales, a.id).ventas;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  const openMyQr = () => {
    const withQr = [...myDocs, ...myBazar].find((i) => (i as { payQrUrl?: string | null }).payQrUrl);
    if (!withQr) {
      setQrMsg("Aún no tienes QR. Edita una publicación para subirlo.");
      return;
    }
    const w = withQr as HubDocument & HubBazarItem;
    setQrMsg("");
    setQr({
      title: w.title,
      price: pen(w.priceCents),
      method: PAY_LABEL[w.payMethod ?? "YAPE"],
      qr: resolveQr(w.payQrUrl) ?? "",
      detail: w.payDetail ?? "",
    });
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <QrModal info={qr} onClose={() => setQr(null)} />

      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-xl bg-white p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="relative z-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex max-w-xl flex-col">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary" style={accent ? { color: accent.color } : undefined}>
                Panel de autor UNSA
              </span>
              <span className="flex items-center gap-0.5 text-xs text-emerald-700">
                <span className="material-symbols-outlined text-base">verified</span> Cuenta verificada
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Mi Bazar · Mis Publicaciones</h1>
            <p className="mt-1 text-sm text-slate-500">Administra tus apuntes e ítems de bazar y controla tus ingresos por Yape/Plin. Tus ventas y alquileres se gestionan en <Link to="/ventas" className="font-bold text-primary underline">Gestión de Ventas</Link>.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={openMyQr} className="flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-left shadow-sm transition-all hover:bg-slate-50">
              <span className="material-symbols-outlined text-indigo-600">qr_code_2</span>
              <span className="flex flex-col">
                <span className="text-[11px] text-slate-500">Cobro rápido</span>
                <span className="font-bold">Mi QR Yape</span>
              </span>
            </button>
            <Link to="/publicar" className="flex items-center gap-1 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:brightness-110" style={accent ? { backgroundColor: accent.color } : undefined}>
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>+ Publicar Nuevo Material</span>
            </Link>
          </div>
        </div>
        {qrMsg && <p className="relative z-10 mt-2 text-xs font-semibold text-amber-700">{qrMsg}</p>}

        {/* Stats */}
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" style={accent ? { color: accent.color } : undefined}>
              <span className="material-symbols-outlined">menu_book</span>
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs text-slate-500">Publicaciones activas</span>
              <span className="font-display text-xl font-extrabold">{activeDocs.length + activeBazar.length} <span className="text-xs font-normal text-slate-500">{myDocs.length} ap. · {myBazar.length} bz.</span></span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <span className="material-symbols-outlined">payments</span>
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs text-slate-500">Neto liberado</span>
              <span className="font-display text-xl font-extrabold text-emerald-700">{pen(releasedNet)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <span className="material-symbols-outlined">download_for_offline</span>
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs text-slate-500">Pedidos recibidos</span>
              <span className="font-display text-xl font-extrabold">{mySales.length}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <span className="material-symbols-outlined">lock</span>
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xs text-slate-500">En custodia (ventas)</span>
              <span className="font-display text-xl font-extrabold">{mySales.filter((o) => o.status === "ESCROW").length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col justify-between gap-3 rounded-xl bg-white p-3 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[["all", `Todos (${rows.length})`], ["digital", `Apuntes (${myDocs.length})`], ["bazar", `Bazar (${myBazar.length})`]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v as "all" | "digital" | "bazar")}
              className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${filter === v ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:text-slate-800"}`}
              style={filter === v && accent ? { backgroundColor: accent.color } : undefined}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2 md:justify-end">
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-lg text-slate-500">search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} className="w-full rounded-lg bg-slate-100 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Buscar por título o curso..." type="text" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden text-xs text-slate-500 lg:inline">Ordenar:</span>
            <select value={sort} onChange={(e) => setSort(isSortKey(e.target.value) ? e.target.value : "recent")} className="cursor-pointer rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold focus:outline-none">
              <option value="sold">Más vendidos</option>
              <option value="recent">Recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="grid grid-cols-1 gap-3">
        {visible.length === 0 && (
          <div className="card p-8 text-center text-sm text-slate-500">
            Sin resultados. <Link className="font-bold text-primary underline" to="/publicar">Publica tu primer material aquí</Link>.
          </div>
        )}
        {visible.map((r) => {
          const st = itemStats(mySales, r.id);
          const isDoc = r.kind === "doc";
          const doc = isDoc ? (r.ref as HubDocument) : null;
          const item = !isDoc ? (r.ref as HubBazarItem) : null;
          const open = isDoc ? openDoc === r.id : openBazar === r.id;
          const cover = !isDoc && item?.photos?.[0]
            ? <img src={item.photos[0]} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
            : <CareerVisual className="h-full w-full" iconClassName="text-title-lg" />;
          return (
            <div key={r.id} className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md md:flex-row md:p-4">
              <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 md:w-52">
                {cover}
                <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                  <span className="material-symbols-outlined text-xs">{isDoc ? "picture_as_pdf" : "storefront"}</span>
                  {isDoc ? "Digital PDF" : `Bazar ${item?.tx === "ALQUILER" ? "Alquiler" : ""}`}
                </span>
                <span className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded bg-primary/90 px-1.5 py-0.5 text-[11px] text-white backdrop-blur-sm" style={accent ? { backgroundColor: accent.color } : undefined}>
                  <span className="material-symbols-outlined text-xs">verified</span> D.L. 822 OK
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{r.sub.split("·")[0]}</span>
                      <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        {isDoc ? (doc?.status === "PUBLISHED" ? "Activa" : doc?.status) : (item?.status === "AVAILABLE" ? "Disponible" : item?.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Precio:</span>
                      <span className="font-display text-lg font-extrabold text-primary" style={accent ? { color: accent.color } : undefined}>{pen(r.price)}</span>
                    </div>
                  </div>
                  <Link to={isDoc ? `/v/${r.id}` : `/p/bazar/${r.id}`} className="truncate font-display text-lg font-extrabold hover:text-primary hover:underline" style={{}}>
                    {r.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {(isDoc ? doc?.description : item?.description) || "Sin descripción."}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-base text-emerald-700">download</span>
                      <span className="flex flex-col leading-tight"><span className="text-[11px]">Ventas</span><b className="text-sm text-slate-800">{st.ventas} · {st.pedidos} ped.</b></span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-base text-emerald-700">monetization_on</span>
                      <span className="flex flex-col leading-tight"><span className="text-[11px]">Neto generado</span><b className="text-sm text-emerald-700">{pen(st.neto)}</b></span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => setQr({
                        title: r.title, price: pen(r.price),
                        method: PAY_LABEL[((isDoc ? doc?.payMethod : item?.payMethod) ?? "YAPE") as PayMethod] ?? "Yape",
                        qr: resolveQr(isDoc ? doc?.payQrUrl : item?.payQrUrl) ?? "",
                        detail: (isDoc ? doc?.payDetail : item?.payDetail) ?? "",
                      })}
                      className="flex items-center gap-1 rounded bg-white px-2 py-1.5 text-xs shadow-sm hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">qr_code</span> Cobro QR
                    </button>
                    {isDoc && (doc?.fileUrl ? (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded bg-white px-2 py-1.5 text-xs shadow-sm hover:text-primary">
                        <span className="material-symbols-outlined text-base">preview</span> Muestra
                      </a>
                    ) : (
                      <Link to={`/v/${r.id}`} className="flex items-center gap-1 rounded bg-white px-2 py-1.5 text-xs shadow-sm hover:text-primary">
                        <span className="material-symbols-outlined text-base">visibility</span> Ver
                      </Link>
                    ))}
                    {!isDoc && (
                      <Link to={`/p/bazar/${r.id}`} className="flex items-center gap-1 rounded bg-white px-2 py-1.5 text-xs shadow-sm hover:text-primary">
                        <span className="material-symbols-outlined text-base">visibility</span> Ver
                      </Link>
                    )}
                    <button
                      onClick={() => (isDoc ? setOpenDoc(open ? "" : r.id) : setOpenBazar(open ? "" : r.id))}
                      className="flex items-center gap-1 rounded bg-white px-2 py-1.5 text-xs shadow-sm hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-base">edit</span> Editar
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="mt-2">
                    {isDoc && doc ? <EditDoc doc={doc} liveOrders={liveCount(mySales, r.id)} onDone={() => setOpenDoc("")} /> : null}
                    {!isDoc && item ? <EditBazar item={item} liveOrders={liveCount(mySales, r.id)} onDone={() => setOpenBazar("")} /> : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ventas recibidas */}
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Ventas recibidas ({mySales.length})</h2>
        <p className="text-xs text-slate-500">Confirma los pagos para pasarlos a custodia. Gestión completa en <Link to="/ventas" className="font-bold text-primary underline">Gestión de Ventas</Link>.</p>
        {mySales.length === 0 && <div className="card p-5 text-sm text-slate-500">Sin ventas todavía.</div>}
        {mySales.map((o) => <SaleRow key={o.id} order={o} />)}
      </section>

      {/* Rendimiento + DL */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold">Ventas por estado</h3>
              <p className="text-xs text-slate-500">Tus pedidos recibidos como vendedor</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">{mySales.length} pedidos</span>
          </div>
          <div className="flex h-44 w-full items-end justify-between gap-2 pt-2">
            {statusBars(mySales).map((b) => (
              <div key={b.label} className="group flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-xs text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">{b.n}</span>
                <div
                  className="w-full max-w-[36px] rounded-t transition-all"
                  style={{ height: `${b.h}%`, backgroundColor: b.color }}
                  title={`${b.label}: ${b.n}`}
                ></div>
                <span className="mt-1 text-[11px] text-slate-500">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-slate-100 p-4 shadow-sm">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm" style={accent ? { backgroundColor: accent.color } : undefined}>
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <h3 className="font-display font-bold">Cumplimiento D.L. 822</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Tus {myDocs.length} apuntes están registrados como obras de autoría propia. Prohibida la reproducción no autorizada por terceros.
            </p>
          </div>
          <Link to="/ventas" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline" style={accent ? { color: accent.color } : undefined}>
            <span>Ir a Gestión de Ventas</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
          {(user.role === "admin" || user.role === "moderator") && (
            <Link to="/admin" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:underline">
              <span>Cola global de Moderación</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function statusBars(sales: HubOrder[]) {
  const defs = [
    { s: "PENDING", label: "Espera", color: "#e2e7ff" },
    { s: "PAID", label: "Pagado", color: "#c0c1ff" },
    { s: "ESCROW", label: "Custodia", color: "#4648d4" },
    { s: "RELEASED", label: "Liberado", color: "#00685f" },
  ];
  const max = Math.max(1, ...defs.map((d) => sales.filter((o) => o.status === d.s).length));
  return defs.map((d) => {
    const n = sales.filter((o) => o.status === d.s).length;
    return { ...d, n, h: Math.max(6, Math.round((n / max) * 100)) };
  });
}
