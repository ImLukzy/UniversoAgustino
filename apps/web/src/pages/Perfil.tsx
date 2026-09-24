import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "../components/AppLayout";
import { EmptyState } from "../components/EmptyState";
import { LoginRequired } from "../components/auth/LoginRequired";
import { api, fmtDate, pen, type HubDocument } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { careerLabel } from "../data/unsa";
import { ROUTES } from "../lib/routes";

// Mi perfil: nombre, carrera y subidas reales (documento, tipo, precio,
// estado, fecha). Sin seguidores, vistas ni ratings: no existen.
export function Perfil() {
  const { user } = useAuth();
  const docs = useQuery({ queryKey: ["docs-mine"], enabled: !!user, queryFn: async () => (await api.get("/documents/mine")).data.data as HubDocument[] });
  if (!user) return <AppLayout><LoginRequired what="ver tu perfil" /></AppLayout>;

  const rows = docs.data ?? [];
  const name = user.profile?.fullName?.trim() || user.email;
  const career = `${user.profile?.career ? careerLabel(user.profile.career) : "Universo Agustino"} · UNSA${user.profile?.cycle ? ` · Ciclo ${user.profile.cycle}` : ""}`;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <header className="flex items-center gap-4">
          <span className="price flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-zinc-900 bg-primary text-2xl text-primary-ink">{name.charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <h1 className="h-display truncate text-3xl">{name}</h1>
            <p className="mt-1 font-bold text-primary">{career}</p>
          </div>
        </header>

        <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-zinc-700">Ayuda a tus compañeros y gana con cada venta subiendo tus apuntes.</p>
          <Link to={ROUTES.publish} className="btn btn-primary"><span className="material-symbols-outlined">upload</span>Publicar apuntes</Link>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="h-display text-2xl">Mis subidas</h2>
          {docs.isLoading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" aria-label="Cargando subidas" />
          ) : rows.length === 0 ? (
            <EmptyState boxed icon="description" title="Aún no subes documentos" hint="Publica tu primer apunte y aparecerá aquí." action={<Link to={ROUTES.publish} className="btn btn-primary btn-sm">Publicar</Link>} />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3 text-right">Precio</th>
                    <th className="hidden px-3 py-3 sm:table-cell">Estado</th>
                    <th className="hidden px-4 py-3 md:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-zinc-300">
                  {rows.slice(0, 5).map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3"><Link to={ROUTES.document(d.id)} className="line-clamp-1 font-bold text-zinc-950 hover:underline">{d.title}</Link></td>
                      <td className="whitespace-nowrap px-3 py-3 text-zinc-600">{d.type}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-bold">{pen(d.priceCents)}</td>
                      <td className="hidden px-3 py-3 sm:table-cell"><span className="tag">{d.status === "PUBLISHED" ? "Publicado" : d.status}</span></td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-zinc-500 md:table-cell">{fmtDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > 5 && <Link to={ROUTES.myBazar} className="btn btn-secondary w-full">Ver todo ({rows.length})</Link>}
        </section>

        <div className="card flex flex-col gap-3 bg-primary-soft p-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-zinc-700"><b className="text-zinc-950">{career}.</b> El catálogo se filtra por tu carrera automáticamente.</p>
          <Link to={`${ROUTES.explore}?career=${user.profile?.career ?? "all"}`} className="btn btn-dark">Explorar mi carrera</Link>
        </div>
      </div>
    </AppLayout>
  );
}
