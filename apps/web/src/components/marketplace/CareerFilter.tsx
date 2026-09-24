import { UNSA_CAREERS } from "../../data/unsa";

// Selector de escuela de /explorar: refleja ?career= y el tema global (spec 05).
// La escuela activa usa su propio color como acento.
export function CareerFilter({ value, onChange }: { value: string; onChange: (career: string) => void }) {
  const options = [{ key: "all", label: "Todas las escuelas", color: "#18181b" }, ...UNSA_CAREERS];
  return (
    <div role="radiogroup" aria-label="Escuela profesional" className="flex gap-2 overflow-x-auto p-1">
      {options.map((c) => {
        const active = c.key === value;
        return (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.key)}
            className={`chip ${active ? "chip-active" : ""}`}
            style={active ? { backgroundColor: c.color, borderColor: "#18181b" } : undefined}
          >
            {!active && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />}
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
