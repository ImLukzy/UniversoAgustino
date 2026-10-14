import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OwnerListingNotice } from "./OwnerListingNotice";

const render = (props: Parameters<typeof OwnerListingNotice>[0]) => renderToStaticMarkup(<OwnerListingNotice {...props} />);

it("avisa al dueño de revisión pendiente y rechazo con o sin motivo", () => {
  expect(render({ review: { reviewStatus: "PENDING" }, paused: false, removed: false })).toContain("En revisión: solo tú la ves.");
  expect(render({ review: { reviewStatus: "REJECTED", reviewNote: "Falta una página" }, paused: false, removed: false })).toContain("Rechazada: Falta una página.");
  expect(render({ review: { reviewStatus: "REJECTED" }, paused: false, removed: false })).toContain("Rechazada: sin motivo registrado.");
});

it("avisa pausa y retiro, y omite estados de revisión para quien no es dueño", () => {
  expect(render({ review: null, paused: true, removed: false })).toContain("Reactívala desde Mis publicaciones.");
  expect(render({ review: null, paused: false, removed: true })).toContain("Retirada por moderación");
  expect(render({ review: null, paused: false, removed: false })).toBe("");
});
