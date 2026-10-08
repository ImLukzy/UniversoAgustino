import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isBlocking } from "@hub/shared";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { ReviewForm } from "./ReviewForm";
import { SanctionForm } from "./SanctionForm";
import { caseTime } from "./caseTypes";

type Ficha = { user: { id: string; email: string; fullName: string; career: string }; average: number | null;
  strikes: { id: string; createdAt: string; forgivenAt: string | null; kind: string; startsAt: string }[];
  reviews: { id: string; score: number; comment: string; createdAt: string; authorName: string }[];
  sanctions: { id: string; kind: "WARNING" | "SUSPENSION" | "BAN"; reason: string; endsAt: string | null; liftedAt: string | null; auto: boolean; createdAt: string }[];
  deals: { id: string; itemTitle: string; status: string; as: string }[] };
// Ficha interna del usuario: solo la ve el equipo. Levantar y perdonar: solo Técnico.
export function UserCard({ id }: { id: string }) {
  const { user } = useAuth(), admin = user?.role === "admin", client = useQueryClient(), key = ["staff", "user", id];
  const ficha = useQuery({ queryKey: key, queryFn: async () => (await api.get(`/staff/users/${id}`)).data.data as Ficha });
  const refresh = () => { void client.invalidateQueries({ queryKey: key }); };
  const act = useMutation({ mutationFn: async (v: { path: string }) => { const reason = window.prompt("Motivo (obligatorio, mínimo 5 caracteres)") ?? ""; if (reason.trim().length < 5) throw new Error("Falta el motivo"); await api.post(`/staff/users/${id}/${v.path}`, { reason }); }, onSuccess: refresh });
  if (ficha.isPending) return <p role="status">Cargando ficha…</p>;
  if (ficha.isError) return <p role="alert" className="text-[#b91c1c]">{apiError(ficha.error)}</p>;
  const f = ficha.data, live = f.strikes.filter((s) => !s.forgivenAt).length;
  return <article className="card flex min-w-0 flex-col gap-4 p-5" aria-label={`Ficha de ${f.user.email}`}>
    <header className="min-w-0 break-words"><h2 className="font-bold">{f.user.fullName || f.user.email}</h2><p className="text-sm">{f.user.email} · {f.user.career}</p>
      <p className="text-sm">Faltas vigentes: {live} · Calificación media: {f.average ?? "sin calificaciones"}</p></header>
    {act.isError && <p role="alert" className="text-sm text-[#b91c1c]">{apiError(act.error)}</p>}
    <section aria-label="Sanciones"><h3 className="font-bold">Sanciones</h3>
      {f.sanctions.length === 0 && <p className="text-sm">Sin sanciones.</p>}
      {f.sanctions.map((s) => <p key={s.id} className="min-w-0 break-words text-sm">{s.kind}{s.auto ? " (automática)" : ""} · {s.reason} · {caseTime(s.createdAt)}{s.endsAt ? ` → ${caseTime(s.endsAt)}` : ""}{s.liftedAt ? " · levantada" : ""}
        {admin && isBlocking(s) && <button type="button" className="btn btn-secondary btn-sm ml-2" disabled={act.isPending} onClick={() => act.mutate({ path: `sanctions/${s.id}/lift` })}>Levantar</button>}</p>)}
    </section>
    <section aria-label="Faltas"><h3 className="font-bold">Faltas</h3>
      {f.strikes.length === 0 && <p className="text-sm">Sin faltas.</p>}
      {f.strikes.map((s) => <p key={s.id} className="min-w-0 break-words text-sm">{s.kind} · {caseTime(s.startsAt)}{s.forgivenAt ? " · perdonada" : ""}
        {admin && !s.forgivenAt && <button type="button" className="btn btn-secondary btn-sm ml-2" disabled={act.isPending} onClick={() => act.mutate({ path: `strikes/${s.id}/forgive` })}>Perdonar</button>}</p>)}
    </section>
    <section aria-label="Calificaciones del equipo"><h3 className="font-bold">Calificaciones (solo equipo)</h3>
      {f.reviews.length === 0 && <p className="text-sm">Sin calificaciones.</p>}
      {f.reviews.map((r) => <p key={r.id} className="min-w-0 break-words text-sm">{r.score}/5 · {r.authorName} · {r.comment || "sin comentario"}</p>)}
    </section>
    <section aria-label="Tratos recientes"><h3 className="font-bold">Tratos recientes</h3>
      {f.deals.map((d) => <p key={d.id} className="min-w-0 break-words text-sm">{d.itemTitle} · {d.as} · {d.status}</p>)}
    </section>
    <ReviewForm userId={id} done={refresh} />
    <SanctionForm userId={id} admin={!!admin} done={refresh} />
  </article>;
}
