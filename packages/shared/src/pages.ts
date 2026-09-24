import { z } from "zod";

// Páginas de muestra de un documento (spec 16): el vendedor elige cuáles ve
// cualquiera antes de comprar. 1-based, ascendentes, sin duplicados.
export const MAX_PREVIEW_PAGES = 20;
export const MAX_PAGE_NUMBER = 5000;
export const DEFAULT_PREVIEW_PAGES: readonly number[] = [1, 2];

export const PreviewPagesSchema = z
  .array(z.number().int().min(1).max(MAX_PAGE_NUMBER))
  .min(1)
  .max(MAX_PREVIEW_PAGES)
  .transform((pages) => [...new Set(pages)].sort((a, b) => a - b));

/** "1-3, 7" → [1,2,3,7]. null si el texto es inválido o excede los límites. */
export function parsePageRange(text: string): number[] | null {
  const out = new Set<number>();
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  for (const part of parts) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!m) return null;
    const from = Number(m[1]);
    const to = m[2] ? Number(m[2]) : from;
    if (from < 1 || to < from || to > MAX_PAGE_NUMBER || to - from >= MAX_PREVIEW_PAGES) return null;
    for (let p = from; p <= to; p++) out.add(p);
    if (out.size > MAX_PREVIEW_PAGES) return null;
  }
  return [...out].sort((a, b) => a - b);
}

/** [1,2,3,7] → "1-3, 7". */
export function formatPageRange(pages: readonly number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const runs: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (sorted[i + 1] === sorted[i] + 1) i++;
    runs.push(start === sorted[i] ? `${start}` : `${start}-${sorted[i]}`);
  }
  return runs.join(", ");
}
