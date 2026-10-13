import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { BuyPanel } from "./BuyPanel";
import { DetailMedia } from "./DetailMedia";
import type { Detail } from "./useDetail";

const detail = (fullAccess: boolean) => ({ src: { id: "doc", title: "Apunte pausado", paused: true }, doc: { id: "doc", title: "Apunte pausado", paused: true }, item: undefined,
  person: null, quote: { amountCents: 1000, feeCents: 130, netCents: 870, feeBps: 1300 }, isRental: false, available: false, pausedForViewer: true, removed: false, fullAccess,
  busy: false, loggedIn: true, rental: { start: "", end: "" }, setRental: () => {}, err: "", buy: () => {},
}) as unknown as Detail;

it("avisa de pausa y oculta comprar a quien no tiene acceso", () => {
  const html = renderToStaticMarkup(<StaticRouter location="/"><BuyPanel d={detail(false)} /></StaticRouter>);
  expect(html).toContain("Pausada por su autor"); expect(html).not.toContain("Comprar ahora");
});

it("avisa de retirada y oculta comprar sin quitar acceso existente", () => {
  const d = { ...detail(false), removed: true, pausedForViewer: false } as unknown as Detail;
  const html = renderToStaticMarkup(<StaticRouter location="/"><BuyPanel d={d} /></StaticRouter>);
  expect(html).toContain('role="status"'); expect(html).toContain("Retirada por moderación"); expect(html).not.toContain("Comprar ahora");
});

it("mantiene acceso completo a documento retirado", () => {
  const d = { ...detail(true), removed: true, pausedForViewer: false } as unknown as Detail;
  const html = renderToStaticMarkup(<StaticRouter location="/"><BuyPanel d={d} /></StaticRouter>);
  expect(html).toContain("Abrir documento"); expect(html).toContain("Retirada por moderación");
});

it("conserva el acceso al documento pausado", () => {
  const html = renderToStaticMarkup(<StaticRouter location="/"><BuyPanel d={detail(true)} /></StaticRouter>);
  expect(html).toContain("Abrir documento"); expect(html).not.toContain("Comprar ahora");
});

it("oculta el CTA de desbloqueo en la portada de un apunte pausado", () => {
  const d = { ...detail(false), doc: { id: "doc", title: "Apunte pausado", fileType: null, priceCents: 1000 }, src: { id: "doc", title: "Apunte pausado", description: "Resumen", priceCents: 1000 }, item: undefined } as unknown as Detail;
  const html = renderToStaticMarkup(<DetailMedia d={d} />);
  expect(html).not.toContain("Desbloquear por"); expect(html).not.toContain("Contenido completo bloqueado");
});
