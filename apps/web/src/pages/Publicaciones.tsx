import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, pen, resolveQr, type HubBazarItem, type HubDocument, type HubOrder } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../lib/routes";
import { LoginRequired } from "../components/auth/LoginRequired";
import { EmptyState } from "../components/EmptyState";
import { PublicationsHeader } from "../components/publicaciones/PublicationsHeader";
import { ListingRow } from "../components/publicaciones/ListingRow";
import { SalesOverview } from "../components/publicaciones/SalesOverview";
import { QrModal, type QrInfo } from "../components/publicaciones/QrModal";
import { SORTS, isSortKey, toListings, visibleListings, type ListingFilter, type SortKey } from "../components/publicaciones/listing";
import { PAY_LABEL } from "../lib/payments";

// /publicaciones: panel del autor (apuntes + bazar propios, cobro y ventas).
export function Publicaciones() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ListingFilter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [openId, setOpenId] = useState("");
  const [qr, setQr] = useState<QrInfo | null>(null);
  const [qrMsg, setQrMsg] = useState("");

  const docs = useQuery({ queryKey: ["docs-mine"], enabled: !!user, queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[] });
  const bazar = useQuery({ queryKey: ["bazar-mine"], enabled: !!user, queryFn: async () => (await api.get("/bazar/mine")).data.data as HubBazarItem[] });
  const sales = useQuery({ queryKey: ["orders", "sales"], enabled: !!user, queryFn: async () => (await api.get("/orders/sales")).data.data as HubOrder[] });

  if (!user) return <LoginRequired what="gestionar tus publicaciones" />;

  const myDocs = docs.data ?? [];
  const myBazar = bazar.data ?? [];
  const mySales = sales.data ?? [];
  const rows = toListings(myDocs, myBazar);
  const visible = visibleListings(rows, mySales, filter, q, sort);
  const counts: Record<ListingFilter, string> = { all: `Todo (${rows.length})`, digital: `Apuntes (${myDocs.length})`, bazar: `Bazar (${myBazar.length})` };

  const openMyQr = () => {
    const w = [...myDocs, ...myBazar].find((i) => i.payQrUrl);
    if (!w) return setQrMsg("Aún no tienes QR. Edita una publicación para subirlo.");
    setQrMsg("");
    setQr({ title: w.title, price: pen(w.priceCents), method: PAY_LABEL[w.payMethod ?? "YAPE"], qr: resolveQr(w.payQrUrl), detail: w.payDetail ?? "" });
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <QrModal info={qr} onClose={() => setQr(null)} />
      <PublicationsHeader
        onMyQr={openMyQr}
        qrMsg={qrMsg}
        stats={{
          active: myDocs.filter((d) => d.status === "PUBLISHED").length + myBazar.filter((b) => b.status === "AVAILABLE").length,
          docs: myDocs.length,
          bazar: myBazar.length,
          net: mySales.filter((o) => o.status === "RELEASED").reduce((a, o) => a + o.netCents, 0),
          orders: mySales.length,
          escrow: mySales.filter((o) => o.status === "ESCROW").length,
        }}
      />
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div role="tablist" aria-label="Tipo" className="flex gap-2 overflow-x-auto p-1">
          {(Object.keys(counts) as ListingFilter[]).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={`chip ${filter === v ? "chip-active" : ""}`}>{counts[v]}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="searchbar h-11 md:w-64">
            <span className="material-symbols-outlined text-zinc-500" aria-hidden="true">search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar mis publicaciones" placeholder="Título o curso…" />
          </label>
          <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(isSortKey(e.target.value) ? e.target.value : "recent")} className="input h-11 w-auto font-bold">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {visible.length === 0 && (
          <EmptyState boxed icon="search_off" title="Sin resultados" action={<Link to={ROUTES.publish} className="btn btn-primary btn-sm">Publica tu primer material</Link>} />
        )}
        {visible.map((r) => (
          <ListingRow key={r.id} listing={r} sales={mySales} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? "" : r.id)} onQr={setQr} />
        ))}
      </div>
      <SalesOverview sales={mySales} isStaff={user.role === "admin" || user.role === "moderator"} />
    </main>
  );
}
