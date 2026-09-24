import { useEffect, useState } from "react";

const WARN_MS = 5 * 60_000;
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

// Tiempo restante de la reserva (Order.expiresAt, solo vive en PENDING).
// Avisa una sola vez al llegar a 0 para que la página muestre "Reserva expirada".
export function ReservationTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const end = new Date(expiresAt).getTime();
  const [left, setLeft] = useState(() => end - Date.now());

  useEffect(() => {
    const id = setInterval(() => setLeft(end - Date.now()), 1000);
    return () => clearInterval(id);
  }, [end]);

  useEffect(() => {
    if (left <= 0) onExpire();
  }, [left <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const warn = left < WARN_MS;
  return (
    <span
      role="timer"
      aria-live="off"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
        warn ? "bg-red-50 text-red-600" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      <span className="material-symbols-outlined text-sm">timer</span>
      Reservado · {mmss(left)}
    </span>
  );
}
