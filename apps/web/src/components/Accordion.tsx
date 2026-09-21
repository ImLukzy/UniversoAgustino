import { useState, type ReactNode } from "react";

// Acordeón accesible (Sprint 3): <button> con aria-expanded + región con
// aria-labelledby. Un solo item abierto a la vez (radio conductual);
// `defaultOpen` abre el primero en desktop si se desea.
export interface AccordionItem {
  id: string;
  icon?: string;
  eyebrow?: string;
  title: string;
  body: ReactNode;
}

export function Accordion({
  items,
  defaultOpen = -1,
  itemClassName = "bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden",
  buttonClassName = "w-full p-space-lg text-left flex items-center justify-between gap-space-md",
}: {
  items: AccordionItem[];
  defaultOpen?: number;
  itemClassName?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-space-sm">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.id} className={itemClassName}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`acc-panel-${it.id}`}
              id={`acc-button-${it.id}`}
              className={`${buttonClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <span className="flex min-w-0 items-center gap-space-sm">
                {it.icon && <span className="material-symbols-outlined text-primary text-title-lg shrink-0">{it.icon}</span>}
                <span className="min-w-0">
                  {it.eyebrow && <span className="block font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">{it.eyebrow}</span>}
                  <span className="block font-title-lg text-title-lg text-on-surface font-bold">{it.title}</span>
                </span>
              </span>
              <span
                className="material-symbols-outlined text-primary text-headline-sm shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                expand_more
              </span>
            </button>
            <div
              id={`acc-panel-${it.id}`}
              role="region"
              aria-labelledby={`acc-button-${it.id}`}
              hidden={!isOpen}
              className="px-space-lg pb-space-lg pt-0 text-on-surface-variant font-body-md text-body-md leading-relaxed"
            >
              {it.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
