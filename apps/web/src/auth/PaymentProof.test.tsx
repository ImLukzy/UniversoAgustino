import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProofForm } from "../components/checkout/ProofForm";
import { PaymentReviewCard } from "../components/equipo/PaymentReviewCard";
vi.mock("../context/ToastContext", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));
it("formulario exige foto, operación opcional y no permite enviar vacío", () => {
  const html = renderToStaticMarkup(<ProofForm orderId="order" paymentAccountId="account" onPaid={() => {}} />);
  expect(html).toContain("obligatoria"); expect(html).toContain("opcional"); expect(html).toContain('disabled=""');
});
it("ficha muestra comprador, monto, destino y opciones de revisión", () => {
  const html = renderToStaticMarkup(<PaymentReviewCard order={{ id: "order", buyerId: "buyer", createdAt: "2026-10-09", itemType: "document", itemId: "doc", amountCents: 1000, feeCents: 130, netCents: 870,
    status: "PAID", itemTitle: "Apunte de prueba", payHolder: "Titular del equipo", payDetail: "TEST-ACCOUNT", buyer: { id: "buyer", email: "buyer@unsa.edu.pe" } }} refreshed={() => {}} />);
  expect(html).toContain("Apunte de prueba"); expect(html).toContain("buyer@unsa.edu.pe"); expect(html).toContain("TEST-ACCOUNT");
  expect(html).toContain("Aceptar pago"); expect(html).toContain("Denegar comprobante");
});
