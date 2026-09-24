import { MarketplaceHeader } from "../components/marketplace/MarketplaceHeader";
import { CatalogFilters } from "../components/marketplace/CatalogFilters";
import { CareerFilter } from "../components/marketplace/CareerFilter";
import { CatalogGrid } from "../components/marketplace/CatalogGrid";
import { AppLayout } from "../components/AppLayout";
import { useCatalog } from "../lib/useCatalog";
import { useDebounce } from "../lib/useDebounce";
import { useExploreParams } from "../lib/useExploreParams";
import { careerOf } from "../data/unsa";

// Marketplace híbrido (spec 07): apuntes gratis, apuntes de pago y productos
// del bazar en una sola grilla. ?q=, ?f= y ?career= viven en la URL; la
// carrera filtra los apuntes y tiñe el tema global (spec 05).
export function Explorar() {
  const { q, setQ, filter, setFilter, career, setCareer } = useExploreParams();
  const term = useDebounce(q, 300);
  const catalog = useCatalog(filter, term, career);

  return (
    <AppLayout fluid>
      <MarketplaceHeader
        query={q}
        onQueryChange={setQ}
        onSubmit={catalog.refetch}
        resultCount={catalog.loading ? undefined : catalog.entries.length}
        careerLabel={careerOf(career)?.faculty}
      />
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-3">
          <CatalogFilters value={filter} onChange={setFilter} />
          <CareerFilter value={career} onChange={setCareer} />
        </div>
      </div>
      <div className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8">
        <CatalogGrid entries={catalog.entries} loading={catalog.loading} error={catalog.error} onRetry={catalog.refetch} />
      </div>
    </AppLayout>
  );
}
