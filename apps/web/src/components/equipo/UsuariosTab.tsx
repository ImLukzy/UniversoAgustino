import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { UserCard } from "./UserCard";

type Found = { id: string; email: string; role: string; fullName: string };
export function UsuariosTab() {
  const [text, setText] = useState(""), [q, setQ] = useState(""), [picked, setPicked] = useState<string | null>(null);
  const found = useQuery({ queryKey: ["staff", "users", q], enabled: q.length >= 2,
    queryFn: async () => (await api.get("/staff/users", { params: { q } })).data.data as Found[] });
  const submit = (e: FormEvent) => { e.preventDefault(); setPicked(null); setQ(text.trim()); };
  return <section className="flex min-w-0 flex-col gap-4" aria-label="Usuarios">
    <form onSubmit={submit} className="card flex min-w-0 flex-col gap-3 p-5">
      <label htmlFor="user-q" className="text-sm font-bold">Buscar por correo o nombre (mínimo 2 letras)</label>
      <div className="flex min-w-0 flex-wrap gap-2">
        <input id="user-q" className="input min-w-0 flex-1" minLength={2} maxLength={80} required value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="btn btn-primary">Buscar</button>
      </div>
    </form>
    <div aria-live="polite" className={found.isFetching || found.isError || found.data?.length === 0 ? "min-h-6" : "sr-only"}>
      {found.isFetching && <p role="status">Buscando…</p>}
      {found.isError && <p role="alert" className="text-[#b91c1c]">{apiError(found.error)}</p>}
      {found.data?.length === 0 && <p>Sin resultados.</p>}
    </div>
    {found.data?.map((u) => <button key={u.id} type="button" onClick={() => setPicked(u.id)} aria-pressed={picked === u.id}
      className={`card min-w-0 break-words p-4 text-left ${picked === u.id ? "ring-2 ring-primary" : ""}`}>
      <span className="font-bold">{u.fullName || u.email}</span><span className="block text-sm">{u.email}</span></button>)}
    {picked && <UserCard id={picked} />}
  </section>;
}
