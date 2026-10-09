// Dialog navigation also catches programmatic focus escaping behind the drawer.
export function trapPanelFocus(dialog: HTMLElement, close: () => void) {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'))
    .filter((el) => el.getClientRects().length > 0);
  const first = () => (controls()[0] ?? dialog).focus();
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.key !== "Tab") return;
    const nodes = controls(), index = nodes.indexOf(document.activeElement as HTMLElement);
    if (nodes.length === 0) { event.preventDefault(); dialog.focus(); }
    else if (event.shiftKey && index <= 0) { event.preventDefault(); nodes[nodes.length - 1].focus(); }
    else if (!event.shiftKey && (index < 0 || index === nodes.length - 1)) { event.preventDefault(); nodes[0].focus(); }
  };
  const focus = (event: FocusEvent) => { if (!dialog.contains(event.target as Node)) first(); };
  first(); document.addEventListener("keydown", key); document.addEventListener("focusin", focus);
  return () => {
    document.removeEventListener("keydown", key); document.removeEventListener("focusin", focus);
    if (previous?.isConnected && previous.getClientRects().length > 0) previous.focus();
  };
}
