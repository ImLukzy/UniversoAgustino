import { LIVE_ORDER_STATUS } from "@hub/shared";
import type { HubBazarItem, HubDocument, HubOrder } from "../../lib/api";

// Estados visibles del bazar (BazarStatus del backend) con color propio.
export const BAZAR_STATUS: Record<string, { label: string; cls: string }> = {
  AVAILABLE: { label: "Disponible", cls: "bg-[#dcfce7]" },
  RESERVED: { label: "En custodia", cls: "bg-[#fef3c7]" },
  SOLD: { label: "Vendido", cls: "bg-zinc-200" },
  RENTED: { label: "Alquilado", cls: "bg-[#e0e7ff]" },
};

export const SORTS = [
  { id: "recent", label: "Recientes" },
  { id: "sold", label: "Más vendidos" },
  { id: "price_asc", label: "Precio: menor a mayor" },
  { id: "price_desc", label: "Precio: mayor a menor" },
] as const;
export type SortKey = (typeof SORTS)[number]["id"];
export const isSortKey = (v: string): v is SortKey => SORTS.some((s) => s.id === v);

export type ListingFilter = "all" | "digital" | "bazar";

export type Listing =
  | { kind: "doc"; id: string; title: string; sub: string; price: number; createdAt: string; doc: HubDocument }
  | { kind: "bazar"; id: string; title: string; sub: string; price: number; createdAt: string; item: HubBazarItem };

export function toListings(docs: HubDocument[], bazar: HubBazarItem[]): Listing[] {
  return [
    ...docs.map((d): Listing => ({ kind: "doc", id: d.id, title: d.title, sub: `${d.course} · Ciclo ${d.cycle} · ${d.type}`, price: d.priceCents, createdAt: d.createdAt ?? "", doc: d })),
    ...bazar.map((b): Listing => ({ kind: "bazar", id: b.id, title: b.title, sub: `${b.kind} · ${b.tx}`, price: b.priceCents, createdAt: b.createdAt ?? "", item: b })),
  ];
}

export function itemStats(sales: HubOrder[], id: string) {
  const rows = sales.filter((o) => o.itemId === id && o.status !== "CANCELLED" && o.status !== "REFUNDED");
  const rel = rows.filter((o) => o.status === "RELEASED");
  return { pedidos: rows.length, ventas: rel.length, neto: rel.reduce((a, o) => a + o.netCents, 0) };
}

// Sprint F2-09: pedidos vivos que congelaron el precio anterior.
export function liveCount(sales: HubOrder[], id: string) {
  return sales.filter((o) => o.itemId === id && (LIVE_ORDER_STATUS as readonly string[]).includes(o.status)).length;
}

export function visibleListings(rows: Listing[], sales: HubOrder[], filter: ListingFilter, q: string, sort: SortKey) {
  const needle = q.trim().toLowerCase();
  return rows
    .filter((r) => filter === "all" || (filter === "digital" ? r.kind === "doc" : r.kind === "bazar"))
    .filter((r) => !needle || r.title.toLowerCase().includes(needle) || r.sub.toLowerCase().includes(needle))
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "sold") return itemStats(sales, b.id).ventas - itemStats(sales, a.id).ventas;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
}

export function statusBars(sales: HubOrder[]) {
  const defs = [
    { s: "PENDING", label: "Espera", color: "#e4e4e7" },
    { s: "PAID", label: "Pagado", color: "#a1a1aa" },
    { s: "ESCROW", label: "Custodia", color: "#52525b" },
    { s: "RELEASED", label: "Liberado", color: "rgb(var(--hub-p))" },
  ];
  const max = Math.max(1, ...defs.map((d) => sales.filter((o) => o.status === d.s).length));
  return defs.map((d) => {
    const n = sales.filter((o) => o.status === d.s).length;
    return { ...d, n, h: Math.max(6, Math.round((n / max) * 100)) };
  });
}
