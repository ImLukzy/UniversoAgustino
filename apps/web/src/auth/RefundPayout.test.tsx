import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PayoutCard } from "../components/equipo/PayoutCard";
import type { PayoutRow } from "../components/equipo/payoutTypes";
const row: PayoutRow = { id: "p", orderId: "o", status: "FROZEN", refundRequired: true, amountCents: 1500, feeCents: 195, netCents: 1305,
  dueAt: "2026-10-11T00:00:00Z", createdAt: "2026-10-09T00:00:00Z", completedAt: null, proofUrl: null, paymentRef: null, frozenReason: "Requiere reembolso", order: { itemTitle: "Producto" } };
const html = (r = row, admin = true) => renderToStaticMarkup(<PayoutCard row={r} admin={admin} refreshed={() => {}} />);
it("Técnico devuelve precio completo y exige foto propia", () => { expect(html()).toContain("Monto a reembolsar"); expect(html()).toContain("15.00"); expect(html()).toContain("Foto del reembolso al comprador (obligatoria)"); expect(html()).toContain("Registrar reembolso"); expect(html()).not.toContain("Registrar liquidación"); });
it("trabajador no recibe controles de reembolso", () => { expect(html(row, false)).not.toContain("Registrar reembolso"); expect(html(row, false)).not.toContain('type="file"'); });
it.each(["CLOSED", "DELIVERED", "RENTED_OUT", "RETURN_SCHEDULED"])("físico %s bloquea botón explicando retorno", (status) => {
  const out = html({ ...row, order: { ...row.order, handoverCase: { status } } });
  expect(out).toContain("Primero recibe el objeto devuelto en sede"); expect(out).toContain("Registrar reembolso"); expect(out).toContain('disabled=""'); expect(out).not.toContain('type="file"');
});
it("físico recibido habilita formulario que sigue bloqueado sin foto", () => { const out = html({ ...row, order: { ...row.order, handoverCase: { status: "RETURNED" } } }); expect(out).toContain('type="file"'); expect(out).toContain('disabled=""'); });
it("reembolsado no ofrece pago al vendedor", () => { const out = html({ ...row, status: "REFUNDED" }); expect(out).toContain("No genera comisión"); expect(out).not.toContain("Registrar reembolso"); expect(out).not.toContain("Registrar liquidación"); });
