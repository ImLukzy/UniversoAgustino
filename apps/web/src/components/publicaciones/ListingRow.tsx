import { Link } from "react-router-dom";
import { pen, resolveQr, type HubOrder } from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import { CareerVisual } from "../CareerVisual";
import { ListingEditor } from "./ListingEditor";
import { BAZAR_STATUS, itemStats, liveCount, type Listing } from "./listing";
import { PAY_LABEL } from "../../lib/payments";
import type { QrInfo } from "./QrModal";

const tool = "btn-ghost h-9 gap-1 px-3 text-xs";

// Fila de una publicación propia: portada, estado, métricas reales de venta y acciones.
export function ListingRow({ listing, sales, open, onToggle, onQr }: {
  listing: Listing;
  sales: HubOrder[];
  open: boolean;
  onToggle: () => void;
  onQr: (info: QrInfo) => void;
}) {
  const isDoc = listing.kind === "doc";
  const src = isDoc ? listing.doc : listing.item;
  const st = itemStats(sales, listing.id);
  const href = isDoc ? ROUTES.document(listing.id) : ROUTES.bazarItem(listing.id);
  const status = isDoc
    ? { label: listing.doc.status === "PUBLISHED" ? "Activa" : listing.doc.status, cls: "bg-[#dcfce7]" }
    : (BAZAR_STATUS[listing.item.status] ?? { label: listing.item.status, cls: "bg-zinc-100" });
  const photo = !isDoc ? listing.item.photos?.[0] : undefined;

  return (
    <article className="card flex flex-col gap-4 p-4 md:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border-2 border-zinc-900 bg-zinc-100 md:w-48">
        {photo ? <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" /> : <CareerVisual className="h-full w-full" iconClassName="text-4xl" />}
        <span className="tag absolute left-2 top-2 bg-white">{isDoc ? "PDF" : listing.item.tx === "ALQUILER" ? "Alquiler" : "Bazar"}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="tag">{listing.sub.split(" · ")[0]}</span>
            <span className={`tag ${status.cls}`}>{status.label}</span>
          </div>
          <span className="price text-xl text-primary">{pen(listing.price)}</span>
        </div>
        <div className="min-w-0">
          <Link to={href} className="block truncate text-lg font-extrabold text-zinc-950 hover:underline">{listing.title}</Link>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">{src.description || "Sin descripción."}</p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-zinc-300 pt-3">
          <dl className="flex gap-5 text-xs text-zinc-500">
            <div><dt>Ventas</dt><dd className="text-sm font-bold text-zinc-900">{st.ventas} · {st.pedidos} ped.</dd></div>
            <div><dt>Neto generado</dt><dd className="text-sm font-bold text-zinc-900">{pen(st.neto)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={tool}
              onClick={() => onQr({ title: listing.title, price: pen(listing.price), method: PAY_LABEL[src.payMethod ?? "YAPE"], qr: resolveQr(src.payQrUrl), detail: src.payDetail ?? "" })}
            >
              <span className="material-symbols-outlined text-base">qr_code</span> Cobro QR
            </button>
            <Link to={href} className={tool}><span className="material-symbols-outlined text-base">visibility</span> Ver</Link>
            <button type="button" className={tool} aria-expanded={open} onClick={onToggle}>
              <span className="material-symbols-outlined text-base">edit</span> {open ? "Cerrar" : "Editar"}
            </button>
          </div>
        </div>
        {open && <ListingEditor listing={listing} liveOrders={liveCount(sales, listing.id)} onDone={onToggle} />}
      </div>
    </article>
  );
}
