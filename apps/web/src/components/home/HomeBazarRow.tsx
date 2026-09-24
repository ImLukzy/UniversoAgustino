import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BazarCard } from "../marketplace/BazarCard";
import { api, type HubBazarItem } from "../../lib/api";
import { ROUTES } from "../../lib/routes";

// Fila "Del Bazar" (spec 07): scroll horizontal con snap y alto reservado
// (h-[16rem] = card + holgura del hover) para que no haya layout shift.
export function HomeBazarRow() {
  const { data, isLoading } = useQuery({
    queryKey: ["bazar", ""],
    queryFn: async () => (await api.get("/bazar", { params: { pageSize: 24 } })).data as { data: HubBazarItem[]; total: number },
  });
  const items = data?.data ?? [];
  if (!isLoading && items.length === 0) return null;

  return (
    <section className="px-4 pb-16" aria-labelledby="home-bazar">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="home-bazar" className="flex items-center gap-2 text-xl font-bold text-zinc-900">
            <span className="h-5 w-1 rounded-full bg-primary theme-transition" aria-hidden="true" />
            Del Bazar
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Libros, instrumental y scrubs de segunda mano, con pago en custodia.</p>
        </div>
        <Link to={ROUTES.bazar} className="shrink-0 text-sm font-semibold text-primary hover:underline">Ver todo</Link>
      </div>
      <div className="-mx-4 mt-6 flex h-[16rem] snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-2 pt-1 [scrollbar-width:thin]">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[15.5rem] w-48 shrink-0 animate-pulse rounded-xl bg-zinc-100" aria-hidden="true" />)
          : items.map((b) => (
              <div key={b.id} className="shrink-0 snap-start">
                <BazarCard item={b} />
              </div>
            ))}
      </div>
    </section>
  );
}
