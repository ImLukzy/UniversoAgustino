import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeamPayPanel } from "../components/checkout/TeamPayPanel";

const testState = vi.hoisted(() => ({ accounts: [] as { id: string; userId: string; method: "YAPE"; holder: string; number: string; photoUrl: string | null; qrUrl: string; active: boolean }[] }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: testState.accounts, isPending: false }) }));
vi.mock("../components/checkout/ProofForm", () => ({ ProofForm: () => <p>Formulario del comprobante</p> }));

it("checkout sin foto del titular conserva el QR y no reserva imagen vacía", () => {
  testState.accounts = [{ id: "account", userId: "worker", method: "YAPE", holder: "QA Cuenta", number: "900000000", photoUrl: null, qrUrl: "/uploads/qa-qr.png", active: true }];
  const html = renderToStaticMarkup(<TeamPayPanel orderId="order" amountCents={1500} onPaid={() => {}} />);
  expect(html).toContain("Cargando QR de cobro del equipo"); expect(html).not.toContain("Foto del titular");
});
