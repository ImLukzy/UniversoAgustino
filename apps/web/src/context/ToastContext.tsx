import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

// Sistema liviano de toasts (Sprint 3): éxito / error / info, apilables,
// auto-cierre salvo error, cierre manual y accionables. Sin dependencias.
export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
  durationMs?: number;
}

interface ToastCtx {
  push: (t: Omit<ToastItem, "id">) => number;
  dismiss: (id: number) => void;
  success: (title: string, detail?: string) => number;
  error: (title: string, detail?: string) => number;
  info: (title: string, detail?: string) => number;
}

const Ctx = createContext<ToastCtx | null>(null);
let seq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((cur) => cur.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = seq++;
      const durationMs = t.durationMs ?? (t.tone === "error" ? 0 : 5000);
      setItems((cur) => [...cur.slice(-2), { ...t, id, durationMs }]);
      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), durationMs),
        );
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastCtx>(
    () => ({
      push,
      dismiss,
      success: (title, detail) => push({ tone: "success", title, detail }),
      error: (title, detail) => push({ tone: "error", title, detail }),
      info: (title, detail) => push({ tone: "info", title, detail }),
    }),
    [push, dismiss],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return v;
}

// Viewport separado para no re-renderizar consumidores al apilar.
import { ToastStack } from "../components/Toast";

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return <ToastStack items={items} onDismiss={onDismiss} />;
}
