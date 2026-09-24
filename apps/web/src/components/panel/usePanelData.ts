import { useQuery } from "@tanstack/react-query";
import { LIVE_ORDER_STATUS } from "@hub/shared";
import { api, type HubBazarItem, type HubDocument, type HubOrder, type HubUser } from "../../lib/api";

const isLive = (o: HubOrder) => (LIVE_ORDER_STATUS as readonly string[]).includes(o.status);

// Datos reales del panel: pedidos, publicaciones, ventas y reportes (con las
// mismas queryKeys que el resto de la app para compartir caché).
export function usePanelData(user: HubUser | null) {
  const on = !!user;
  const isMod = user?.role === "admin" || user?.role === "moderator";
  const orders = useQuery({ queryKey: ["orders", "mine"], enabled: on, queryFn: async () => (await api.get("/orders/mine")).data.data as HubOrder[] });
  const docs = useQuery({ queryKey: ["docs-mine"], enabled: on, queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[] });
  const bazar = useQuery({ queryKey: ["bazar-mine"], enabled: on, queryFn: async () => (await api.get("/bazar/mine")).data.data as HubBazarItem[] });
  const sales = useQuery({ queryKey: ["orders", "sales"], enabled: on, queryFn: async () => (await api.get("/orders/sales")).data.data as HubOrder[] });
  const reports = useQuery({ queryKey: ["reports", "open"], enabled: on && isMod, retry: false, queryFn: async () => (await api.get("/reports")).data.data as Array<{ status: string }> });
  const mine = useQuery({ queryKey: ["reports", "mine"], enabled: on, retry: false, queryFn: async () => (await api.get("/reports/mine")).data.data as Array<{ status: string }> });

  const list = orders.data ?? [];
  const myDocs = docs.data ?? [];
  const myBazar = bazar.data ?? [];
  const mySales = sales.data ?? [];
  const escrow = list.filter((o) => o.status === "ESCROW");
  const open = (r?: Array<{ status: string }>) => (r ?? []).filter((x) => x.status === "OPEN").length;
  const pubDocs = myDocs.filter((d) => d.status === "PUBLISHED").length;
  const pubBazar = myBazar.filter((b) => b.status === "AVAILABLE").length;

  return {
    isMod,
    loading: orders.isLoading,
    list,
    myDocs,
    myBazar,
    live: list.filter(isLive).length,
    digital: list.filter((o) => o.itemType === "document").length,
    physical: list.filter((o) => o.itemType === "bazar").length,
    escrowCount: escrow.length,
    escrowSum: escrow.reduce((a, o) => a + o.amountCents, 0),
    pubDocs,
    pubBazar,
    pubsActive: pubDocs + pubBazar,
    releasedNet: mySales.filter((o) => o.status === "RELEASED").reduce((a, o) => a + o.netCents, 0),
    releasedCount: mySales.filter((o) => o.status === "RELEASED").length,
    salesPending: mySales.filter((o) => o.itemType === "bazar" && o.status === "PENDING").length + open(mine.data),
    openReports: open(reports.data),
  };
}

export type PanelData = ReturnType<typeof usePanelData>;

