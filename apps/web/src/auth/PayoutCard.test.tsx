import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PayoutCard } from "../components/equipo/PayoutCard";
import type { PayoutRow } from "../components/equipo/payoutTypes";
const row: PayoutRow = { id: "payout", orderId: "order", status: "PENDING", amountCents: 1500, feeCents: 195, netCents: 1305, dueAt: "2026-10-11T04:00:00Z", createdAt: "2026-10-09T04:00:00Z", completedAt: null, proofUrl: null, paymentRef: null, frozenReason: null,
  payMethod: "PLIN", payDetail: "SELLER-TEST", seller: { email: "seller@unsa.edu.pe", profile: null }, order: { itemTitle: "Apunte", buyer: { email: "buyer@unsa.edu.pe", profile: null } } };
it("pendiente muestra neto, vendedor/comprador y exige foto para registrar", () => { const html = renderToStaticMarkup(<PayoutCard row={row} admin={false} refreshed={() => {}} />); expect(html).toContain("Monto a pagar"); expect(html).toContain("13.05"); expect(html).toContain("SELLER-TEST"); expect(html).toContain("obligatoria"); expect(html).toContain('disabled=""'); });
it("congelada no presenta formulario de pago al trabajador", () => { const html = renderToStaticMarkup(<PayoutCard row={{ ...row, status: "FROZEN", frozenReason: "Apunte incorrecto" }} admin={false} refreshed={() => {}} />); expect(html).toContain("Apunte incorrecto"); expect(html).not.toContain("Registrar liquidación"); expect(html).not.toContain("Autorizar liquidación"); });
it("Técnico dispone de resolución con motivo obligatorio", () => { const html = renderToStaticMarkup(<PayoutCard row={{ ...row, status: "FROZEN" }} admin refreshed={() => {}} />); expect(html).toContain("Motivo de resolución"); expect(html).toContain("Autorizar liquidación"); expect(html).toContain('disabled=""'); });

it("reembolso pendiente queda congelado sin controles para liquidar", () => { const html = renderToStaticMarkup(<PayoutCard row={{ ...row, status: "FROZEN", refundRequired: true, frozenReason: "Requiere reembolso (pendiente de spec 40)" }} admin refreshed={() => {}} />); expect(html).toContain("Requiere reembolso"); expect(html).not.toContain("Registrar liquidación"); expect(html).not.toContain("Autorizar liquidación"); });
