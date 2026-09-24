import { motion } from "framer-motion";
import { pen } from "../../lib/api";
import { careerLabel } from "../../data/unsa";
import type { ViewerDoc } from "./useDocAccess";
import { SPRING } from "../../lib/motion";
import { DownloadButton } from "../DownloadButton";


interface Props {
  doc: ViewerDoc;
  fileUrl: string | null;
  fullAccess: boolean;
  saved: boolean;
  buying: boolean;
  onSave: () => void;
  onBuy: () => void;
}

// Cabecera sticky mínima (spec 06): título en 1 línea, curso · carrera y
// acciones coloreadas con el `primary` de la carrera activa.
export function ViewerHeader({ doc, fileUrl, fullAccess, saved, buying, onSave, onBuy }: Props) {
  const paid = doc.priceCents > 0 && !fullAccess;
  return (
    <header className="sticky top-0 z-30 border-b-2 border-zinc-900 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-base font-bold text-zinc-900">{doc.title}</h1>
          <p className="truncate text-xs text-zinc-500">
            {doc.course} · {careerLabel(doc.career)}
          </p>
        </div>
        <motion.button
          type="button"
          onClick={onSave}
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
          aria-pressed={saved}
          aria-label={saved ? "Quitar de guardados" : "Guardar documento"}
          className={`btn btn-sm ${saved ? "bg-primary-soft" : "bg-white"}`}
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: `"FILL" ${saved ? 1 : 0}` }}>
            bookmark
          </span>
          <span className="hidden sm:inline">{saved ? "Guardado" : "Guardar"}</span>
        </motion.button>
        {fullAccess && fileUrl && (
          <DownloadButton url={fileUrl} className="btn btn-secondary btn-sm">
            <span className="material-symbols-outlined text-xl">download</span>
            <span className="hidden sm:inline">Descargar</span>
          </DownloadButton>
        )}
        {paid && (
          <motion.button
            type="button"
            onClick={onBuy}
            disabled={buying}
            whileTap={{ scale: 0.96 }}
            transition={SPRING}
            className="btn btn-primary btn-sm"
          >
            {buying ? "Creando…" : `Comprar ${pen(doc.priceCents)}`}
          </motion.button>
        )}
      </div>
    </header>
  );
}
