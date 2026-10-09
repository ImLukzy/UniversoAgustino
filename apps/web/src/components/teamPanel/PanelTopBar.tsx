// Barra superior solo en móvil: menú + logo + título de la sección.
export function PanelTopBar({ title, open, onOpen }: { title: string; open: boolean; onOpen: () => void }) {
  return <div className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 lg:hidden">
    <button type="button" disabled={open} aria-label="Abrir menú del panel" aria-expanded={open} aria-controls="panel-drawer" onClick={onOpen}
      className="btn btn-primary !h-10 !w-10 shrink-0 !px-0"><span className="material-symbols-outlined" aria-hidden="true">menu</span></button>
    <img src="/logo-ua.svg" width={28} height={28} alt="" className="shrink-0" />
    <p aria-hidden="true" className="min-w-0 truncate font-display text-base font-bold">{title}</p>
  </div>;
}
