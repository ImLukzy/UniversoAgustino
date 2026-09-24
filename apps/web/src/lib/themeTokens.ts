// Tokens de color del tema por carrera. Sin carrera activa → teal UNSA.
export const DEFAULT_ACCENT = "#00685f";
export const DEFAULT_SOFT = "#e0f0ee";
export const THEME_STORE = "hub_theme";

export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function luminance(hex: string): number {
  return hexToRgbTriplet(hex)
    .split(" ")
    .map((s) => {
      const v = Number(s) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    })
    .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
}

export function contrastRatio(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Texto sobre el color base: blanco o negro, el de mayor contraste.
export function inkFor(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#000000") ? "#ffffff" : "#000000";
}

interface ThemeTokens {
  "--hub-p": string;
  "--hub-p-soft": string;
  "--hub-p-ink": string;
}

export function themeTokens(color: string, soft: string): ThemeTokens {
  return {
    "--hub-p": hexToRgbTriplet(color),
    "--hub-p-soft": hexToRgbTriplet(soft),
    "--hub-p-ink": hexToRgbTriplet(inkFor(color)),
  };
}
