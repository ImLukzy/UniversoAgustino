import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentAccountForm } from "../components/equipo/PaymentAccountForm";
it("cuenta nueva exige fotos y datos del titular", () => {
  const html = renderToStaticMarkup(<PaymentAccountForm userId="worker" saved={() => {}} />);
  expect(html).toContain("Titular"); expect(html).toContain("Número o cuenta");
  expect(html).toContain("Foto de perfil"); expect(html).toContain("QR"); expect(html).toContain('disabled=""');
});
it("técnico puede elegir miembro sin dato bancario preconfigurado", () => {
  const html = renderToStaticMarkup(<PaymentAccountForm userId="worker" members={[{ id: "worker", fullName: "Persona de prueba" }]} saved={() => {}} />);
  expect(html).toContain("Trabajador"); expect(html).toContain("Persona de prueba"); expect(html).not.toMatch(/value="[0-9]{9}"/);
});
