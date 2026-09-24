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
    }
  };

  return {
    busy,
    msg,
    confirming,
    askDelete: () => setConfirming(true),
    cancelDelete: () => !busy && setConfirming(false),
    save: (body: Record<string, unknown>) => run(() => api.patch(endpoint, body)),
    remove: () => run(() => api.delete(endpoint)),
  };
}
