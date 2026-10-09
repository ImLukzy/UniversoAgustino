import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarketplaceHeader } from "../components/marketplace/MarketplaceHeader";

describe("MarketplaceHeader", () => {
  it("el buscador tiene nombre accesible propio", () => {
    const html = renderToStaticMarkup(<MarketplaceHeader query="" onQueryChange={() => {}} onSubmit={() => {}} />);
    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="Buscar en Explorar"');
  });
});
