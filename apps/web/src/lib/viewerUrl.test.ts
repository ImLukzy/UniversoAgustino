import { describe, expect, it } from "vitest";
import { isPdfUrl, safeFileUrl } from "./viewerUrl";

const O = "http://localhost:4000";
const ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

describe("safeFileUrl", () => {
  it("acepta /uploads/<uuid>.pdf relativo o absoluto del mismo origen", () => {
    expect(safeFileUrl(`/uploads/${ID}.pdf`, O)).toBe(`${O}/uploads/${ID}.pdf`);
    expect(safeFileUrl(`${O}/uploads/${ID}.png?x=1`, O)).toBe(`${O}/uploads/${ID}.png`);
  });

  it("rechaza orígenes externos, rutas raras y esquemas peligrosos", () => {
    expect(safeFileUrl(`https://evil.com/uploads/${ID}.pdf`, O)).toBeNull();
    expect(safeFileUrl(`/uploads/../secret.pdf`, O)).toBeNull();
    expect(safeFileUrl(`/uploads/nota.pdf`, O)).toBeNull();
    expect(safeFileUrl(`javascript:alert(1)`, O)).toBeNull();
    expect(safeFileUrl(`/uploads/${ID}.html`, O)).toBeNull();
    expect(safeFileUrl(null, O)).toBeNull();
  });

  it("detecta PDF por extensión", () => {
    expect(isPdfUrl(`${O}/uploads/${ID}.pdf`)).toBe(true);
    expect(isPdfUrl(`${O}/uploads/${ID}.png`)).toBe(false);
  });
});
