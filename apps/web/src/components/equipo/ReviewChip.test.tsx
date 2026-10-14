import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewChip } from "./ReviewChip";

it("explica que una publicación en revisión solo la ve su dueño", () => {
  const html = renderToStaticMarkup(<ReviewChip status="PENDING" />);
  expect(html).toContain("En revisión");
  expect(html).toContain("Solo tú la ves hasta que el equipo la apruebe.");
});

it("no añade explicación a aprobadas ni rechazadas", () => {
  expect(renderToStaticMarkup(<ReviewChip status="APPROVED" />)).toBe("");
  const rejected = renderToStaticMarkup(<ReviewChip status="REJECTED" note="Actualiza el archivo" />);
  expect(rejected).toContain("Rechazada: Actualiza el archivo");
  expect(rejected).not.toContain("Solo tú la ves");
});
