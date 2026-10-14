import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PLATFORM_FEE_PCT } from "@hub/shared";
import { PayFields } from "./PayFields";

it("explica la cuenta de liquidación y el QR de Yape o Plin", () => {
  const html = renderToStaticMarkup(<PayFields method="YAPE" detail="" qr="" onMethod={() => {}} onDetail={() => {}} onQr={() => {}} />);
  expect(html).toContain("¿Dónde te pagamos tu parte?");
  expect(html).toContain(`el precio menos la comisión del ${PLATFORM_FEE_PCT} %`);
  expect(html).toContain("normalmente en 24–48 h.");
  expect(html).toContain("QR de tu Yape o Plin (imagen)");
});
