import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";

// Calificación 1–5 y comentario; visibles solo al equipo (spec 33).
export function ReviewForm({ userId, done }: { userId: string; done: () => void }) {
  const [score, setScore] = useState(5), [comment, setComment] = useState("");
  const send = useMutation({ mutationFn: async () => { await api.post(`/staff/users/${userId}/reviews`, { score, comment }); },
    onSuccess: () => { setComment(""); done(); } });
  const submit = (e: FormEvent) => { e.preventDefault(); send.mutate(); };
  return <form onSubmit={submit} className="flex min-w-0 flex-col gap-2" aria-label="Calificar usuario">
    <label className="flex flex-col gap-1 text-sm" htmlFor={`score-${userId}`}>Calificación
      <select id={`score-${userId}`} className="input w-24" value={score} onChange={(e) => setScore(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
    <label className="flex flex-col gap-1 text-sm" htmlFor={`comment-${userId}`}>Comentario interno (opcional, máx. 500)
      <textarea id={`comment-${userId}`} className="input min-h-20" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} /></label>
    {send.isError && <p role="alert" className="break-words text-sm text-[#b91c1c]">{apiError(send.error)}</p>}
    <button type="submit" className="btn btn-secondary btn-sm self-start" disabled={send.isPending}>Guardar calificación</button>
  </form>;
}
