import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { ReviewCard, type ReviewItem } from "./ReviewCard";
import { PanelLoading } from "../teamPanel/PanelLoading";

interface Queue { data: ReviewItem[]; total: number; pendingTotal: number }
export function PublicacionesTab() {
  const { user } = useAuth();
  const [type, setType] = useState<"document" | "bazar">("document");
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState("");
  const qc = useQueryClient();
  const queue = useQuery({ queryKey: ["staff", "reviews", user?.id, type, page],
    enabled: user?.role === "admin" || user?.role === "moderator",
    queryFn: async () => (await api.get("/staff/reviews", { params: { type, page, pageSize: 50 } })).data as Queue });
  const action = useMutation({
    mutationFn: async ({ item, reason }: { item: ReviewItem; reason?: string }) =>
      api.post(`/staff/reviews/${item.type}/${encodeURIComponent(item.id)}/${reason === undefined ? "approve" : "reject"}`,
        reason === undefined ? {} : { reason }),
    onSuccess: () => { setMsg("Revisión guardada."); void qc.invalidateQueries({ queryKey: ["staff"] }); },
    onError: (error) => setMsg(apiError(error)),
  });
  function decide(item: ReviewItem, reason?: string) { setMsg(""); action.mutate({ item, reason }); }
  if (user?.role !== "admin" && user?.role !== "moderator") return null;
  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label="Publicaciones en revisión">
      <div className="flex flex-wrap gap-2">
        {(["document", "bazar"] as const).map((value) => <button key={value} type="button" aria-pressed={type === value}
          onClick={() => { setType(value); setPage(1); setMsg(""); }} className={`btn btn-sm ${type === value ? "btn-primary" : "btn-secondary"}`}>
          {value === "document" ? "Documentos" : "Bazar"}</button>)}
      </div>
      <p role="status" className={msg ? "break-words text-sm" : "sr-only"}>{msg}</p>
      {queue.isPending && <PanelLoading label="Cargando publicaciones…" />}
      {queue.isError && <p role="alert">{apiError(queue.error)}</p>}
      {queue.data?.data.length === 0 && <p className="card p-5">No hay publicaciones pendientes de este tipo.</p>}
      {queue.data?.data.map((item) => <ReviewCard key={`${item.type}-${item.id}`} item={item} busy={action.isPending} decide={decide} />)}
      <nav aria-label="Páginas de publicaciones" className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1 || queue.isPending} onClick={() => setPage(page - 1)}>Anterior</button>
        <span className="text-sm">Página {page}</span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!queue.data || page * 50 >= queue.data.total || queue.isPending} onClick={() => setPage(page + 1)}>Siguiente</button>
      </nav>
    </section>
  );
}
