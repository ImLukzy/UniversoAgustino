import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { StaffListing } from "../../lib/apiTypes";
import { CatalogoRow } from "./CatalogoRow";

const item: StaffListing = { id: "1", type: "document", title: "Apunte", priceCents: 500, state: "removed", owner: { id: "u", nombre: "Dueño", correo: "dueno@unsa.edu.pe" }, openReports: 2, createdAt: "2026-10-12T12:00:00.000Z" };
const render = (admin: boolean) => renderToStaticMarkup(<CatalogoRow item={item} admin={admin} busy={false} act={vi.fn()} />);

it("solo ofrece Restaurar al técnico", () => {
  expect(render(true)).toContain("Restaurar");
  expect(render(false)).not.toContain("Restaurar");
});
