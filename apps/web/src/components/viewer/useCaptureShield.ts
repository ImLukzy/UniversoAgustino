import { useEffect, useState } from "react";

// Escudo anticaptura (spec 16), best effort: el navegador no puede impedir una
// captura del sistema operativo, pero sí ocultar el contenido en las señales
// que la preceden. Oculta al perder el foco (Recortes, Win+Shift+S, cambio de
// app), al pulsar Win/Cmd o Impr Pant y al imprimir; vuelve al recuperar foco.
export function useCaptureShield(enabled: boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    const hide = () => {
      window.clearTimeout(timer);
      setHidden(true);
    };
    const show = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHidden(false), 250);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Meta" || e.key === "PrintScreen") hide();
      if ((e.ctrlKey || e.metaKey) && ["p", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        hide();
        show();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        // Pisa la captura del portapapeles cuando el navegador lo permite.
        void navigator.clipboard?.writeText("Contenido protegido · Universo Agustino").catch(() => {});
        hide();
        timer = window.setTimeout(() => setHidden(false), 1500);
      } else if (e.key === "Meta" && document.hasFocus()) show();
    };
    const onVisibility = () => (document.hidden ? hide() : show());
    const events: [EventTarget, string, EventListener][] = [
      [window, "blur", hide],
      [window, "focus", show],
      [window, "beforeprint", hide],
      [window, "afterprint", show],
      [window, "keydown", onKeyDown as EventListener],
      [window, "keyup", onKeyUp as EventListener],
      [document, "visibilitychange", onVisibility],
    ];
    for (const [t, n, f] of events) t.addEventListener(n, f);
    return () => {
      window.clearTimeout(timer);
      for (const [t, n, f] of events) t.removeEventListener(n, f);
    };
  }, [enabled]);

  return enabled && hidden;
}
