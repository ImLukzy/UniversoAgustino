// Marca de agua del Visor (spec 16): identifica a quien lee. Se quema en los
// píxeles del <canvas> (no es un nodo que se pueda borrar desde DevTools).

interface Reader {
  email: string;
  profile?: { fullName?: string | null } | null;
}

// "Ana Pérez · ana***@unsa.edu.pe · 23/09/2026 14:05". El correo se enmascara
// a medias: basta para rastrear una filtración sin exponerlo completo.
export function watermarkText(user: Reader | null | undefined, now = new Date()): string {
  if (!user) return "Vista previa · Universo Agustino";
  const [local, domain = ""] = user.email.split("@");
  const masked = `${local.slice(0, 3)}***@${domain}`;
  const pad = (n: number) => String(n).padStart(2, "0");
  const when = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const name = user.profile?.fullName?.trim();
  return [name, masked, when].filter(Boolean).join(" · ");
}

// Texto en diagonal repetido sobre toda la hoja, tenue para no estorbar la lectura.
export function stampWatermark(canvas: HTMLCanvasElement, text: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || !text) return;
  const { width: w, height: h } = canvas;
  const size = Math.max(12, Math.round(w / 38));
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#18181b";
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  const step = size * 7;
  const span = Math.hypot(w, h);
  const textW = ctx.measureText(text).width + size * 4;
  for (let y = -span / 2; y < span / 2; y += step) {
    const shift = (Math.round(y / step) % 2) * (textW / 2);
    for (let x = -span / 2 - shift; x < span / 2; x += textW) ctx.fillText(text, x, y);
  }
  ctx.restore();
}
