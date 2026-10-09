import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PanelSidebar } from "./PanelSidebar";
import { trapPanelFocus } from "./focusTrap";
import { SPRING } from "../../lib/motion";
export function PanelDrawer({ close }: { close: () => void }) {
  const dialog = useRef<HTMLDivElement>(null), reduced = useReducedMotion();
  useEffect(() => {
    if (!dialog.current) return;
    const stop = trapPanelFocus(dialog.current, close);
    const media = window.matchMedia("(min-width: 1024px)");
    const resize = () => { if (media.matches) close(); };
    media.addEventListener("change", resize);
    return () => { stop(); media.removeEventListener("change", resize); };
  }, [close]);
  return <div className="fixed inset-0 z-[70] lg:hidden">
    <div className="absolute inset-0 bg-zinc-900/50" onClick={close} aria-hidden="true" />
    <motion.div id="panel-drawer" ref={dialog} role="dialog" aria-modal="true" aria-label="Menú del panel" tabIndex={-1}
      initial={reduced ? false : { x: "-100%" }} animate={{ x: 0 }} transition={SPRING}
      className="relative flex h-full w-80 max-w-[90vw] flex-col border-r border-zinc-200 bg-white p-4 shadow-xl">
      <PanelSidebar close={close} />
    </motion.div>
  </div>;
}
