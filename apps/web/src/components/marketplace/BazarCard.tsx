import { Link } from "react-router-dom";
import { pen, resolveQr, type HubBazarItem } from "../../lib/api";
import { ROUTES } from "../../lib/routes";

const KIND_ICON: Record<string, string> = { LIBRO: "menu_book", SCRUB: "checkroom", INSTRUMENTO: "medical_services" };

// Card de producto físico con la MISMA geometría que DocumentCard (w-48,
// cover h-32, título en 2 líneas, alto fijo 15.5rem = skeleton) para que convivan en una sola grilla.
// Sin botón "Comprar": el clic lleva al detalle (/p/bazar/:id).
export function BazarCard({ item }: { item: HubBazarItem }) {
  const photo = resolveQr(item.photos?.[0]);
  const rent = item.tx === "ALQUILER";
  const reserved = item.status === "RESERVED";
  return (
    <Link
      to={ROUTES.bazarItem(item.id)}
      aria-disabled={reserved || undefined}
      className={`card group flex h-[15.5rem] w-48 flex-col overflow-hidden ${reserved ? "" : "card-hover"}`}
    >
      <div className="relative h-32 overflow-hidden border-b-2 border-zinc-900 bg-zinc-100">
        {photo ? (
          <img src={photo} alt="" loading="lazy" width={192} height={128} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-zinc-300">
            <span className="material-symbols-outlined text-4xl">{KIND_ICON[item.kind] ?? "storefront"}</span>
          </span>
        )}
        <span className="tag absolute bottom-1.5 right-1.5 bg-white">
          {rent ? "Alquiler" : "Venta"}
        </span>
        {reserved && (
          <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/45 text-xs font-bold uppercase tracking-wide text-white">
            Reservado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-zinc-900 group-hover:underline">{item.title}</p>
        <p className="truncate text-xs text-zinc-500">
          {rent && item.depositCents ? `Garantía ${pen(item.depositCents)}` : "Bazar UNSA"}
        </p>
        <p className="mt-auto flex h-7 items-center gap-1 border-t border-dashed border-zinc-300 pt-2 text-sm">
          <span className="price text-primary theme-transition">{pen(item.priceCents)}</span>
          {rent && <span className="text-xs text-zinc-500">/ ciclo</span>}
        </p>
      </div>
    </Link>
  );
}
