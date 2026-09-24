import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { pen } from "../lib/api";
import { ROUTES } from "../lib/routes";
import { careerContent } from "../data/career";
import { careerLabel } from "../data/unsa";
import { useDocAccess } from "../components/viewer/useDocAccess";
import { ViewerHeader } from "../components/viewer/ViewerHeader";
import { PdfPages, SheetSkeleton } from "../components/viewer/PdfPages";
import { Paywall } from "../components/viewer/Paywall";
import { CaptureShield, WatermarkLayer } from "../components/viewer/CaptureShield";
import { SPRING } from "../lib/motion";


// Barra flotante de compra: aparece al hacer scroll más allá de la cabecera.
function BuyBar({ show, label, busy, onBuy }: { show: boolean; label: string; busy: boolean; onBuy: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={SPRING}
          className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4"
        >
          <button
            type="button"
            onClick={onBuy}
            disabled={busy}
            className="btn btn-primary"
          >
            {busy ? "Creando pedido…" : label}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useScrolledPast(px: number) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const on = () => setPast(window.scrollY > px);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [px]);
  return past;
}

// Visor inmersivo /v/:id (spec 06/16): hojas centradas sobre zinc-50, solo
// las páginas de muestra que eligió el vendedor y el muro cubriendo el resto.
// Documentos de pago: marca de agua del lector y escudo anticaptura.
export function Visor() {
  const { id } = useParams<{ id: string }>();
  const a = useDocAccess(id);
  const scrolled = useScrolledPast(480);
  const d = a.doc;

  if (a.isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <div className="h-16 border-b-2 border-zinc-900 bg-white" />
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8" role="status" aria-label="Cargando visor">
          <SheetSkeleton />
          <SheetSkeleton />
        </div>
      </main>
    );
  }
  if (!d) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-zinc-50 px-4 text-center">
        <p className="font-display text-lg font-bold text-zinc-900">Este documento ya no existe.</p>
        <Link className="mt-2 text-sm font-semibold text-primary hover:underline" to={ROUTES.home}>
          Volver al inicio
        </Link>
      </main>
    );
  }

  const locked = d.priceCents > 0 && !a.fullAccess;
  const cc = careerContent(d.career);
  const person = d.author?.profile;
  const paywall = (range?: string, compact?: boolean, ratio?: number) => (
    <Paywall range={range} compact={compact} ratio={ratio} priceCents={d.priceCents} buying={a.buying} error={a.error} onBuy={a.buy} />
  );
  const fallbackSheet = (
    <div className="aspect-[1/1.414] w-full overflow-hidden sheet">
      <img src={cc.imgQuote} alt={d.title} className="h-full w-full object-cover" />
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-50 pb-24">
      <ViewerHeader
        doc={d}
        fileUrl={a.fileUrl}
        fullAccess={a.fullAccess}
        saved={a.saved}
        buying={a.buying}
        onSave={a.toggleSave}
        onBuy={a.buy}
      />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {d.type} · Ciclo {d.cycle} · {careerLabel(d.career)}
          </p>
          {d.description && <p className="text-sm leading-relaxed text-zinc-600">{d.description}</p>}
          <p className="text-xs text-zinc-500">
            Subido por <span className="font-semibold text-zinc-700">{person?.fullName ?? "Estudiante UNSA"}</span>
          </p>
        </section>

        <CaptureShield enabled={d.priceCents > 0}>
          {a.fileUrl && a.isPdf ? (
            <PdfPages url={a.fileUrl} fullAccess={!locked} watermark={d.priceCents > 0 ? a.watermark : ""} fallback={fallbackSheet} paywall={paywall} />
          ) : (
            <div className="space-y-6">
              {a.fileUrl ? (
                <div className="relative w-full select-none overflow-hidden sheet" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
                  <img src={a.fileUrl} alt={`${d.title} (página 1)`} className="h-auto w-full object-contain" />
                  {d.priceCents > 0 && <WatermarkLayer text={a.watermark} />}
                </div>
              ) : (
                fallbackSheet
              )}
              {locked && paywall()}
            </div>
          )}
        </CaptureShield>
      </div>
      <BuyBar show={locked && scrolled} label={`Comprar ${pen(d.priceCents)}`} busy={a.buying} onBuy={a.buy} />
    </main>
  );
}
