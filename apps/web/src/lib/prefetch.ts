// Precarga de chunks de rutas lazy (Sprint 4+). Usa import.meta.glob para
// que Vite pueda analizar estáticamente los módulos: un import() con
// variable pura NO funciona en build (lanza en runtime).
const pageMods = import.meta.glob("../pages/*.tsx");

const ROUTE_MODULE: Record<string, string> = {
  "/panel": "../pages/Panel.tsx",
  "/pedidos": "../pages/Pedidos.tsx",
  "/publicaciones": "../pages/Publicaciones.tsx",
  "/ventas": "../pages/Ventas.tsx",
  "/cuenta": "../pages/Cuenta.tsx",
  "/publicar": "../pages/Publicar.tsx",
  "/admin": "../pages/Admin.tsx",
  "/bazar": "../pages/Bazar.tsx",
  "/monetiza": "../pages/Monetiza.tsx",
  "/legal": "../pages/Legal.tsx",
};

function loadersFor(mod: string): Array<() => Promise<unknown>> {
  const out: Array<() => Promise<unknown>> = [];
  const p = (pageMods as Record<string, () => Promise<unknown>>)[mod];
  if (p) out.push(p);
  return out;
}

/** Precarga el chunk de una ruta (hover/focus). Silenciosa ante fallos. */
export function prefetchRoute(to: string): void {
  const mod = ROUTE_MODULE[to.split("?")[0]];
  if (!mod) return;
  for (const load of loadersFor(mod)) {
    void load().catch(() => {});
  }
}
