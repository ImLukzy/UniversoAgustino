import { Link } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PLATFORM_FEE_PCT } from "@hub/shared";
import { api, pen, type HubOrder, type HubReport } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../lib/routes";
import { LoginRequired } from "../components/auth/LoginRequired";
import { RentalCard } from "../components/RentalCard";
import { RentalSkeleton } from "../components/Skeleton";
import { EmptyState } from "../components/EmptyState";
import { DigitalSales } from "../components/ventas/DigitalSales";
import { ReportsCenter } from "../components/ventas/ReportsCenter";

// /ventas: solicitudes de alquiler, ventas digitales y reportes del vendedor.
export function Ventas() {
  const { user } = useAuth();
  // F0-c p95: /sales pagina en servidor (keyset). Clave propia "paged": la forma
  // de datos (páginas) no puede compartir caché con las listas planas de /panel.
  const sales = useInfiniteQuery({
    queryKey: ["orders", "sales", "paged"],
    queryFn: async ({ pageParam }: { pageParam: string | null }) =>
      (await api.get(`/orders/sales${pageParam ? `?cursor=${pageParam}&limit=50` : "?limit=50"}`)).data as { data: HubOrder[]; nextCursor: string | null },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!user,
    refetchInterval: 30000,
  });
  const reports = useQuery({ queryKey: ["reports", "mine"], enabled: !!user, refetchInterval: 30000, queryFn: async () => (await api.get("/reports/mine")).data.data as HubReport[] });
  if (!user) return <LoginRequired what="gestionar tus ventas" />;

  const rows = (sales.data?.pages ?? []).flatMap((p) => p.data);
  const rentals = rows.filter((o) => o.itemType === "bazar");
  const digitals = rows.filter((o) => o.itemType === "document");
  const myReports = reports.data ?? [];
  const kpis = [
    { label: "Alquileres por revisar", value: String(rentals.filter((o) => o.status === "PENDING").length), href: "#seccion-alquileres" },
    { label: "Pagos por confirmar", value: String(rows.filter((o) => o.status === "PAID").length), href: "#seccion-digitales" },
    { label: "Neto liberado (apuntes)", value: pen(digitals.filter((o) => o.status === "RELEASED").reduce((a, o) => a + o.netCents, 0)) },
    { label: "Reportes abiertos", value: String(myReports.filter((r) => r.status === "OPEN").length), href: "#seccion-reportes" },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">Módulo de ventas · comisión {PLATFORM_FEE_PCT}%</p>
          <h1 className="h-display mt-2 text-3xl sm:text-4xl">Gestión de ventas</h1>
          <p className="mt-2 text-sm text-zinc-600">Acepta alquileres, confirma pagos y gestiona tus reportes.</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.myOrders} className="btn btn-secondary">Mis pedidos</Link>
          <Link to={ROUTES.publish} className="btn btn-primary">Nueva publicación</Link>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card flex flex-col gap-1 p-5">
            <dt className="text-xs font-bold text-zinc-600">{k.label}</dt>
            <dd className="price text-3xl text-zinc-950">{k.value}</dd>
            {k.href && <dd><a href={k.href} className="text-xs font-bold text-zinc-950 underline">Ver</a></dd>}
          </div>
        ))}
      </dl>
      <section id="seccion-alquileres" className="flex flex-col gap-4">
        <div>
          <h2 className="h-display text-2xl">Solicitudes de alquiler</h2>
          <p className="mt-1 text-sm text-zinc-600">Al aceptar, el comprador paga a tu QR; al confirmar su pago, el pedido pasa a custodia.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {sales.isLoading && Array.from({ length: 2 }, (_, i) => <RentalSkeleton key={i} />)}
          {!sales.isLoading && rentals.length === 0 && (
            <EmptyState boxed className="lg:col-span-2" icon="storefront" title="Sin solicitudes de alquiler" hint="Cuando alguien reserve tu artículo, aparecerá aquí." action={<Link to={ROUTES.publish} className="btn btn-primary btn-sm">Publicar un artículo</Link>} />
          )}
          {rentals.map((o) => <RentalCard key={o.id} order={o} />)}
        </div>
      </section>
      <DigitalSales rows={digitals} more={!!sales.hasNextPage} loadingMore={sales.isFetchingNextPage} onMore={() => void sales.fetchNextPage()} />
      <ReportsCenter reports={myReports} onSent={() => void reports.refetch()} />
    </main>
  );
}
