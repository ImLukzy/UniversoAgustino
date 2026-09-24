// Tramos del Visor (spec 16): páginas visibles (índice dentro del PDF servido
// + número real) y rangos bloqueados entre ellas, que cubre el muro de pago.
export type Segment =
  | { kind: "page"; index: number; page: number }
  | { kind: "locked"; from: number; to: number };

export function pageSegments(visible: readonly number[], total: number): Segment[] {
  const out: Segment[] = [];
  let next = 1;
  visible.forEach((page, i) => {
    if (page > next) out.push({ kind: "locked", from: next, to: page - 1 });
    out.push({ kind: "page", index: i + 1, page });
    next = page + 1;
  });
  if (total >= next) out.push({ kind: "locked", from: next, to: total });
  return out;
}

export const rangeLabel = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
