import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PaymentAccountForm } from "../components/equipo/PaymentAccountForm";
it("cuenta nueva identifica la foto opcional y mantiene el QR obligatorio", () => {
  const html = renderToStaticMarkup(<PaymentAccountForm userId="worker" saved={() => {}} />);
  expect(html).toContain("Titular"); expect(html).toContain("Número o cuenta");
  expect(html).toContain("Foto del titular (opcional)"); expect(html).toContain("QR"); expect(html).toContain('disabled=""');
});
it("permite guardar una cuenta con QR y sin foto del titular", () => {
  const account = { id: "a", userId: "worker", method: "YAPE" as const, holder: "QA Cuenta", number: "900000000", photoUrl: null, qrUrl: "/uploads/qr.png", active: true };
  const html = renderToStaticMarkup(<PaymentAccountForm account={account} userId="worker" saved={() => {}} />);
  expect(html).toContain("Foto del titular (opcional)"); expect(html).toContain("Cargando QR de cobro");
  expect(html).not.toContain("Quitar foto"); expect(html).not.toContain('disabled=""');
});
it("permite quitar una foto ya guardada", () => {
  const account = { id: "a", userId: "worker", method: "YAPE" as const, holder: "QA Cuenta", number: "900000000", photoUrl: "/uploads/photo.png", qrUrl: "/uploads/qr.png", active: true };
  const html = renderToStaticMarkup(<PaymentAccountForm account={account} userId="worker" saved={() => {}} />);
  expect(html).toContain("Quitar foto");
});
it("técnico puede elegir miembro sin dato bancario preconfigurado", () => {
  const html = renderToStaticMarkup(<PaymentAccountForm userId="worker" members={[{ id: "worker", fullName: "Persona de prueba" }]} saved={() => {}} />);
  expect(html).toContain("Trabajador"); expect(html).toContain("Persona de prueba"); expect(html).not.toMatch(/value="[0-9]{9}"/);
});
