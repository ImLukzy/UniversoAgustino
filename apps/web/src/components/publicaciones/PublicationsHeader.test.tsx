import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { describe, expect, it } from "vitest";
import { PublicationsHeader } from "./PublicationsHeader";

describe("PublicationsHeader definition lists", () => {
  it("places every dt/dd in a dl whose direct children are permitted", () => {
    const html = renderToStaticMarkup(
      <StaticRouter location="/publicaciones">
        <PublicationsHeader stats={{ active: 2, docs: 1, bazar: 1, net: 120, orders: 3, escrow: 1 }} onMyQr={() => {}} qrMsg="" />
      </StaticRouter>,
    );
    const lists = [...html.matchAll(/<dl\b[^>]*>(.*?)<\/dl>/gs)];
    expect(lists).toHaveLength(4);
    expect(html.replace(/<dl\b[^>]*>.*?<\/dl>/gs, "")).not.toMatch(/<(?:dt|dd)\b/);
    for (const [, content] of lists) {
      expect(content).toMatch(/^<dt\b[^>]*>.*?<\/dt><dd\b[^>]*>.*?<\/dd>$/s);
      expect(content).not.toMatch(/<(?!\/?(?:dt|dd)\b)[a-z]/i);
    }
  });
});
