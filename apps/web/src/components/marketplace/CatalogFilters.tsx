import type { CatalogFilter } from "../../lib/useCatalog";

const OPTIONS: { value: CatalogFilter; label: string; icon: string }[] = [
  { value: "all", label: "Todo", icon: "widgets" },
  { value: "docs", label: "Apuntes", icon: "description" },
  { value: "free", label: "Gratis", icon: "bolt" },
  { value: "bazar", label: "Bazar", icon: "storefront" },
];

// Chips del catálogo híbrido (sistema de diseño: .chip / .chip-active).
export function CatalogFilters({ value, onChange }: { value: CatalogFilter; onChange: (v: CatalogFilter) => void }) {
  return (
    <div role="tablist" aria-label="Filtrar catálogo" className="flex gap-2 overflow-x-auto p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`chip ${o.value === value ? "chip-active" : ""}`}
        >
          <span className="material-symbols-outlined text-base">{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
