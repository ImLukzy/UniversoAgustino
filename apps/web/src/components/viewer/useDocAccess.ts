import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiError, previewUrl, type HubDocument } from "../../lib/api";
import { ROUTES } from "../../lib/routes";
import { safeFileUrl } from "../../lib/viewerUrl";
import { watermarkText } from "../../lib/watermark";
import { useAuth } from "../../auth/AuthContext";
import { useAuthModal } from "../AuthModalHost";

export interface Person {
  fullName: string;
  career?: string | null;
  cycle?: string | null;
}

export type ViewerDoc = HubDocument & {
  saved?: boolean;
  fullAccess?: boolean;
  fileType?: "pdf" | "image" | null;
  author?: { profile?: Person | null } | null;
};

// Acceso del Visor (spec 06/16). La API decide `fullAccess` (gratis, autor o
// pago verificado ESCROW/RELEASED) y `saved`; el cliente solo lo refleja.
export function useDocAccess(id: string | undefined) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");
  // Hora fija de apertura: la marca de agua no cambia (ni repinta) cada minuto.
  const [openedAt] = useState(() => new Date());
  const key = ["documents", id, user?.id ?? "anon"];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get(`/documents/${id}`)).data.data as ViewerDoc,
    enabled: !!id,
  });
  const doc = query.data;

  const save = useMutation({
    mutationFn: async (next: boolean) => {
      if (next) await api.post(`/documents/${id}/save`);
      else await api.delete(`/documents/${id}/save`);
    },
    onMutate: async (next) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ViewerDoc>(key);
      if (prev) qc.setQueryData<ViewerDoc>(key, { ...prev, saved: next });
      return { prev };
    },
    onError: (e, _next, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      setError(apiError(e));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["documents", "saved"] }),
  });

  const toggleSave = () => {
    if (!user) return openAuth();
    save.mutate(!doc?.saved);
  };

  const buy = async () => {
    if (!user) return openAuth();
    setBuying(true);
    setError("");
    try {
      const r = await api.post("/orders", { itemType: "document", itemId: id });
      nav(ROUTES.checkout(r.data.data.id));
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBuying(false);
    }
  };

  return {
    doc,
    isLoading: query.isLoading,
    // Sin acceso completo la API no envía fileUrl: se pinta la vista previa (spec 15).
    fileUrl: doc?.fullAccess ? safeFileUrl(doc.fileUrl) : doc?.fileType && id ? previewUrl(id) : null,
    isPdf: doc?.fileType === "pdf",
    watermark: watermarkText(user, openedAt),
    fullAccess: !!doc?.fullAccess,
    saved: !!doc?.saved,
    toggleSave,
    buy,
    buying,
    error,
  };
}
