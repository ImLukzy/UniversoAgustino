import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { CHAT_MAX } from "@hub/shared";

type Message = { id: string; body: string; createdAt: string; authorId: string; authorName: string; staff: boolean };
const when = (iso: string) => new Date(iso).toLocaleString("es-PE", { timeZone: "America/Lima", dateStyle: "short", timeStyle: "short" });

// Chat interno del caso: comprador, vendedor, custodio y Técnico. `base` = /cases (participantes) o /staff/cases (equipo).
export function CaseChat({ caseId, base, closed = false }: { caseId: string; base: "/cases" | "/staff/cases"; closed?: boolean }) {
  const { user } = useAuth(), client = useQueryClient();
  const [open, setOpen] = useState(false), [text, setText] = useState("");
  const key = ["case-chat", caseId, user?.id];
  const list = useQuery({ queryKey: key, enabled: open, refetchInterval: 30_000,
    queryFn: async () => (await api.get(`${base}/${caseId}/messages`)).data.data as Message[] });
  const send = useMutation({ mutationFn: async () => { await api.post(`${base}/${caseId}/messages`, { body: text }); },
    onSuccess: () => { setText(""); void client.invalidateQueries({ queryKey: key }); } });
  const regionId = `chat-${caseId}`;
  return <section className="flex min-w-0 flex-col gap-2" aria-label="Mensajes del trato">
    <button type="button" className="btn btn-secondary btn-sm self-start" aria-expanded={open} aria-controls={regionId} onClick={() => setOpen(!open)}>
      {open ? "Ocultar mensajes" : "Mensajes del trato"}</button>
    {open && <div id={regionId} className="flex min-w-0 flex-col gap-2">
      <ul aria-live="polite" className="flex max-h-64 min-h-16 min-w-0 flex-col gap-2 overflow-y-auto rounded-lg border bg-white p-2">
        {list.isPending && <li role="status" className="text-sm">Cargando mensajes…</li>}
        {list.isError && <li role="alert" className="break-words text-sm text-[#b91c1c]">{apiError(list.error)}</li>}
        {list.data?.length === 0 && <li className="text-sm text-zinc-600">Aún no hay mensajes.</li>}
        {list.data?.map((m) => <li key={m.id} className={`min-w-0 break-words rounded-lg p-2 text-sm ${m.authorId === user?.id ? "bg-primary-soft" : "bg-zinc-50"}`}>
          <p className="text-xs font-bold">{m.authorId === user?.id ? "Tú" : m.authorName}{m.staff ? " · Equipo" : ""} · {when(m.createdAt)}</p>
          <p className="whitespace-pre-wrap">{m.body}</p></li>)}
      </ul>
      {closed ? <p className="text-sm text-zinc-600">El trato terminó; el chat quedó solo de lectura.</p> :
        <form className="flex min-w-0 flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate(); }}>
          <label className="flex flex-col gap-1 text-sm" htmlFor={`${regionId}-text`}>Escribe un mensaje
            <textarea id={`${regionId}-text`} className="input min-h-20 w-full" maxLength={CHAT_MAX} required value={text} onChange={(e) => setText(e.target.value)} /></label>
          {send.isError && <p role="alert" className="break-words text-sm text-[#b91c1c]">{apiError(send.error)}</p>}
          <button type="submit" className="btn btn-primary btn-sm self-start" disabled={send.isPending || !text.trim()}>{send.isPending ? "Enviando…" : "Enviar"}</button>
        </form>}
    </div>}
  </section>;
}
