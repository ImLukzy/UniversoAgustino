import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";

export function ResumenTab() {
  const { user } = useAuth();
  const reports = useQuery({
    queryKey: ["reports", "open", user?.id],
    queryFn: async () => (await api.get("/reports")).data.data as Array<{ status: string }>,
    enabled: user?.role === "moderator" || user?.role === "admin",
  });
  return (
    <section className="card flex min-w-0 flex-col gap-3 p-5" aria-label="Resumen del equipo">
      <h2 className="h-display text-xl">Denuncias abiertas</h2>
      {reports.isPending ? <p role="status">Cargando resumen…</p> : reports.isError ?
        <p role="alert">{apiError(reports.error)}</p> :
        <p className="text-3xl font-bold text-primary">{reports.data?.filter((r) => r.status === "OPEN").length ?? 0}</p>}
      <p className="text-sm text-zinc-600">Reportes D.L. 822 por resolver en menos de 48 horas.</p>
    </section>
  );
}
