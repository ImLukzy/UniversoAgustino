import { motion } from "framer-motion";
import { SPRING } from "../../lib/motion";

export type OptionState = "idle" | "ok" | "bad" | "dim";

const CLS: Record<OptionState, string> = {
  idle: "border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-50",
  ok: "border-primary bg-primary-soft font-bold text-zinc-950",
  bad: "border-[#b91c1c] bg-[#fef2f2] text-[#b91c1c]",
  dim: "border-zinc-300 bg-white text-zinc-400",
};

// Opción de respuesta: al responder se marca la correcta y, si fallaste, la elegida.
export function QuizOption({ label, letter, state, locked, onPick }: { label: string; letter: string; state: OptionState; locked: boolean; onPick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      disabled={locked}
      aria-pressed={state === "ok" || state === "bad"}
      whileTap={locked ? undefined : { scale: 0.98 }}
      transition={SPRING}
      className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-default ${CLS[state]}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-current text-[11px] font-bold">{letter}</span>
      <span className="min-w-0 flex-1">{label}</span>
      <span className={`material-symbols-outlined shrink-0 text-lg ${state === "ok" ? "text-primary" : ""}`} aria-hidden="true">
        {state === "ok" ? "check_circle" : state === "bad" ? "cancel" : "radio_button_unchecked"}
      </span>
      {state === "ok" && <span className="sr-only">(correcta)</span>}
      {state === "bad" && <span className="sr-only">(tu respuesta, incorrecta)</span>}
    </motion.button>
  );
}
