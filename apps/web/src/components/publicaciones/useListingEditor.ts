import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, apiError } from "../../lib/api";

// Guardar / eliminar una publicación propia (apunte o bazar) con el mismo
// ciclo de vida: PATCH o DELETE, invalida la lista y cierra el editor.
export function useListingEditor(endpoint: string, listKey: string, onDone: () => void) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmingPause, setConfirmingPause] = useState(false);
  const id = endpoint.slice(endpoint.lastIndexOf("/") + 1);
  const pausedAt = qc.getQueryData<{ id: string; pausedAt?: string | null }[]>([listKey])?.find((row) => row.id === id)?.pausedAt ?? null;

  const run = async (op: () => Promise<unknown>) => {
    setBusy(true);
    setMsg("");
    try {
      await op();
      void qc.invalidateQueries({ queryKey: [listKey] });
      onDone();
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setBusy(false);
      setConfirming(false);
      setConfirmingPause(false);
    }
  };

  return {
    busy,
    msg,
    confirming,
    confirmingPause,
    pausedAt,
    askDelete: () => setConfirming(true),
    cancelDelete: () => !busy && setConfirming(false),
    askPause: () => setConfirmingPause(true),
    cancelPause: () => !busy && setConfirmingPause(false),
    save: (body: Record<string, unknown>) => run(() => api.patch(endpoint, body)),
    remove: () => run(() => api.delete(endpoint)),
    pause: () => { setConfirmingPause(false); return run(() => api.post(`${endpoint}/pause`)); },
    resume: () => run(() => api.post(`${endpoint}/resume`)),
  };
}
