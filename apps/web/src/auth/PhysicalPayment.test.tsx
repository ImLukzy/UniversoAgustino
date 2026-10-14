import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PickupForm } from "../components/equipo/PickupForm";
import { PhysicalPaymentFields, paymentReady, type PhysicalPayment } from "../components/equipo/PhysicalPaymentFields";
import { BAZAR_KINDS } from "../lib/publishing";
const testState = vi.hoisted(() => ({ accounts: [] as { id: string; userId: string; method: "YAPE"; holder: string; number: string; photoUrl: string | null; qrUrl: string; active: boolean }[] }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: testState.accounts, isLoading: false }) }));
vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ user: { id: "worker" } }) }));
const v: PhysicalPayment = { method: "OPERATION", accountId: "account", proofUrl: "", reference: "", confirmed: true, uploading: false };
it("recojo inicial exige cuenta y foto para registrar", () => { const html = renderToStaticMarkup(<PickupForm caseId="case" rental={false} amountCents={1500} busy={false} save={async () => true} />); expect(html).toContain("Foto del comprobante (obligatoria)"); expect(html).toContain("Pago al equipo"); expect(html).not.toContain("Pago al vendedor"); expect(html).toContain('disabled=""'); });
it("transferencia confirmada sin foto o subiendo sigue bloqueada", () => { expect(paymentReady(v)).toBe(false); expect(paymentReady({ ...v, proofUrl: "/uploads/photo.png", uploading: true })).toBe(false); expect(paymentReady({ ...v, proofUrl: "/uploads/photo.png" })).toBe(true); });
it("efectivo exige recepción confirmada y no requiere foto", () => { const cash = { ...v, method: "CASH" as const }; const html = renderToStaticMarkup(<PhysicalPaymentFields value={cash} setValue={vi.fn()} amountCents={1500} busy={false} />); expect(html).toContain("recibí el efectivo"); expect(html).not.toContain("Foto del comprobante"); expect(paymentReady(cash)).toBe(true); expect(paymentReady({ ...cash, confirmed: false })).toBe(false); });
it("cobro en sede sin foto muestra el QR sin hueco del titular", () => {
  testState.accounts = [{ id: "account", userId: "worker", method: "YAPE", holder: "QA Cuenta", number: "900000000", photoUrl: null, qrUrl: "/uploads/qa-qr.png", active: true }];
  const html = renderToStaticMarkup(<PhysicalPaymentFields value={v} setValue={vi.fn()} amountCents={1500} busy={false} />);
  expect(html).toContain("Cargando QR de cobro del equipo"); expect(html).not.toContain("Titular del equipo");
});
it("publicador permite Apuntes físicos sin inventar categoría de documento", () => { expect(BAZAR_KINDS).toContainEqual({ label: "Apuntes físicos", value: "APUNTE" }); });
