// Etiquetas y resumen de métodos de cobro (PayMethod de @hub/shared).
export const PAY_LABEL: Record<string, string> = { YAPE: "Yape", PLIN: "Plin", AMBAS: "Yape y Plin" };

// Métodos configurados en un conjunto de publicaciones ("Yape / Plin").
export function paySummary(items: Array<{ payMethod?: string | null }>) {
  const m = new Set<string>();
  for (const i of items) {
    const v = i.payMethod ?? "YAPE";
    if (v !== "PLIN") m.add("Yape");
    if (v !== "YAPE") m.add("Plin");
  }
  return m.size ? [...m].join(" / ") : "Sin configurar";
}
