// Laptop + celular con el mismo apunte y su marca de agua (rudo: borde zinc-900, sombra dura).
// Solo divs: cero imágenes, cero CLS.
const shadow = { boxShadow: "5px 5px 0 0 rgb(var(--ua-ink))" };

function Lines({ n, hi }: { n: number; hi?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={`h-1.5 rounded-full ${i === hi ? "bg-primary" : "bg-zinc-200"}`} style={{ width: `${[92, 70, 100, 64, 86, 78][i % 6]}%` }} />
      ))}
    </div>
  );
}

export function DevicesMock() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-64 w-full max-w-md sm:h-72">
      <div className="absolute left-0 top-2 w-[82%]">
        <div className="rounded-t-xl border-2 border-zinc-900 bg-white p-2.5" style={shadow}>
          <div className="mb-2 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full border border-zinc-900 bg-white" />)}
            <span className="ml-2 h-3 flex-1 rounded-full border border-zinc-900 bg-zinc-50" />
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <div className="space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 p-2">
              {["Mis pedidos", "Visor", "Avisos"].map((t, i) => (
                <p key={t} className={`truncate rounded px-1 text-[9px] font-bold ${i === 1 ? "bg-primary text-primary-ink" : "text-zinc-600"}`}>{t}</p>
              ))}
            </div>
            <div className="relative h-32 overflow-hidden rounded-md border border-zinc-900 bg-white p-2 sm:h-36">
              <p className="mb-2 text-[9px] font-bold text-zinc-900">Farmacología clínica</p>
              <Lines n={6} hi={2} />
              <p className="absolute inset-x-0 top-1/2 -rotate-12 text-center text-[10px] font-bold text-zinc-900/20">ana***@unsa.edu.pe · 14:05</p>
            </div>
          </div>
        </div>
        <div className="mx-[-6%] h-3 rounded-b-xl border-2 border-t-0 border-zinc-900 bg-zinc-300" />
      </div>
      <div className="absolute bottom-0 right-2 w-[34%] rounded-[1.4rem] border-2 border-zinc-900 bg-white p-2" style={shadow}>
        <div className="mx-auto mb-2 h-1.5 w-8 rounded-full bg-zinc-900" />
        <p className="mb-1.5 text-[8px] font-bold text-zinc-900">Farmacología clínica</p>
        <div className="rounded-md border border-zinc-200 p-1.5">
          <Lines n={6} hi={2} />
        </div>
        <div className="mt-2 flex items-center gap-1 rounded-md border-2 border-zinc-900 bg-primary-soft px-1.5 py-1">
          <span className="material-symbols-outlined text-[12px] text-primary">notifications</span>
          <span className="truncate text-[8px] font-bold text-zinc-900">Pago confirmado</span>
        </div>
      </div>
    </div>
  );
}
