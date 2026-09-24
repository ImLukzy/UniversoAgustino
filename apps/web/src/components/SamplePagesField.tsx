import { parsePageRange } from "@hub/shared";

// "1-2, 5" → [1,2,5] o null. Vacío = null (el formulario exige al menos una).
export const samplePages = (text: string) => parsePageRange(text);

// Páginas de muestra (spec 16): el vendedor elige qué ve cualquiera antes de
// comprar. Lo demás nunca sale del servidor sin pago verificado.
export function SamplePagesField({ id, value, onChange, className = "" }: { id: string; value: string; onChange: (v: string) => void; className?: string }) {
  const invalid = value.trim() !== "" && !samplePages(value);
  const hint = `${id}-hint`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold text-zinc-800">Páginas de muestra</label>
      <input
        id={id}
        className={`input ${invalid ? "border-[#b91c1c]" : ""}`}
        value={value}
        maxLength={60}
        inputMode="numeric"
        placeholder="1-2"
        aria-invalid={invalid || undefined}
        aria-describedby={hint}
        onChange={(e) => onChange(e.target.value)}
      />
      <p id={hint} className={`min-h-[1rem] text-xs ${invalid ? "font-bold text-[#b91c1c]" : "text-zinc-500"}`}>
        {invalid ? "Usa números y rangos, p. ej. 1-2, 5 (máx. 20 páginas)." : "Visibles antes de comprar, p. ej. 1-2, 5. El resto queda bloqueado."}
      </p>
    </div>
  );
}
