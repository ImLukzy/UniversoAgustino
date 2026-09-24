import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING } from "../../lib/motion";
import { useCaptureShield } from "./useCaptureShield";

// Envuelve las hojas de un documento de pago: al detectar una señal de captura
// las oculta al instante (sin transición: la captura no espera) y muestra un
// aviso. `protected-sheets` además las oculta al imprimir (ui.css).
export function CaptureShield({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const hidden = useCaptureShield(enabled);
  return (
    <div className={enabled ? "protected-sheets" : undefined}>
      <div className={hidden ? "invisible" : undefined} aria-hidden={hidden || undefined}>
        {children}
      </div>
      <AnimatePresence>
        {hidden && (
          <motion.div
            role="status"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={SPRING}
            className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-50 px-4"
          >
            <div className="sheet flex max-w-sm flex-col items-center gap-2 p-6 text-center">
              <span className="material-symbols-outlined text-4xl text-zinc-400">visibility_off</span>
              <p className="font-display text-lg font-bold text-zinc-900">Contenido protegido</p>
              <p className="text-sm text-zinc-500">Vuelve a esta ventana para seguir leyendo. Las capturas y la impresión están deshabilitadas.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Marca de agua como capa para imágenes (en PDF va quemada en el canvas).
export function WatermarkLayer({ text }: { text: string }) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='200'><text x='0' y='120' transform='rotate(-30 180 100)' font-family='system-ui,sans-serif' font-size='14' font-weight='600' fill='%2318181b' fill-opacity='0.13'>${encodeURIComponent(text)}</text></svg>`;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,${svg}")` }} />;
}
