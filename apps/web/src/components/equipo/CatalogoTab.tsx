import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, type StaffListing } from "../../lib/api";
import { useDebounce } from "../../lib/useDebounce";
import { useAuth } from "../../auth/AuthContext";
import { PanelLoading } from "../teamPanel/PanelLoading";
import { CatalogoRow } from "./CatalogoRow";

interface ListingPage { data: StaffListing[]; page: number; pageSize: number; total: number }
const PAGE_SIZE = 20;

export function CatalogoTab() {
  const { user } = useAuth();
  const [type, setType] = useState<"" | "document" | "bazar">("");
  const [state, setState] = useState<"" | StaffListing["state"]>("");
  const [q, setQ] = useState("");
  const appliedQ = useDebounce(q, 300);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["staff", "listings", type, state, appliedQ, page], enabled: (user?.role === "admin" || user?.role === "moderator") && q === appliedQ,
    queryFn: async () => (await api.get("/staff/listings", { params: { type: type || undefined, state: state || undefined, q: appliedQ.trim() || undefined, page, pageSize: PAGE_SIZE } })).data as ListingPage });
  const action = useMutation({ mutationFn: async ({ kind, item, reason }: { kind: "remove" | "restore"; item: StaffListing; reason?: string }) => {
    const path = `/staff/listings/${item.type}/${encodeURIComponent(item.id)}/${kind}`;
    return kind === "remove" ? api.post(path, { reason }) : api.post(path);
  }, onSuccess: (_data, variables) => { setMessage(variables.kind === "remove" ? "Publicación retirada." : "Publicación restaurada."); void qc.invalidateQueries({ queryKey: ["staff", "listings"] }); }, onError: (error) => setMessage(apiError(error)) });
  if (user?.role !== "admin" && user?.role !== "moderator") return null;
  const reset = () => setPage(1);
  return <section className="flex min-w-0 flex-col gap-4" aria-label="Todas las publicaciones">
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm font-bold">Tipo<select className="input" value={type} onChange={(e) => { setType(e.target.value as typeof type); reset(); }}><option value="">Todos</option><option value="document">Apuntes</option><option value="bazar">Bazar</option></select></label>
      <label className="flex flex-col gap-1 text-sm font-bold">Estado<select className="input" value={state} onChange={(e) => { setState(e.target.value as typeof state); reset(); }}><option value="">Todos</option><option value="active">Activas</option><option value="paused">Pausadas</option><option value="removed">Retiradas</option><option value="pending">Pendientes</option></select></label>
      <label className="flex flex-col gap-1 text-sm font-bold">Buscar<input className="input min-w-0" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} placeholder="Título" /></label>
    </div>
    <p role="status" className={message ? "wrap-break-word text-sm" : "sr-only"}>{message}</p>
    {query.isPending && <PanelLoading label="Cargando publicaciones…" />}
    {query.isError && <p role="alert" className="text-[#b91c1c]">{apiError(query.error)}</p>}
    {query.data?.data.length === 0 && <p className="card p-5">No se encontraron publicaciones.</p>}
    <div className="flex min-w-0 flex-col gap-3">{query.data?.data.map((item) => <CatalogoRow key={`${item.type}-${item.id}`} item={item} admin={user.role === "admin"} busy={action.isPending} act={(kind, row, reason) => { setMessage(""); action.mutate({ kind, item: row, reason }); }} />)}</div>
    <nav aria-label="Páginas del catálogo" className="flex flex-wrap items-center gap-3"><button type="button" className="btn btn-secondary btn-sm" disabled={page === 1 || query.isPending} onClick={() => setPage(page - 1)}>Anterior</button><span className="text-sm">Página {page}</span><button type="button" className="btn btn-secondary btn-sm" disabled={!query.data || page * PAGE_SIZE >= query.data.total || query.isPending} onClick={() => setPage(page + 1)}>Siguiente</button></nav>
  </section>;
}
