import { api, browserFor, check, login, withDatabase, WEB } from "./helper.mjs";
import { activateAppointment, book, expireAppointment, futureSlot, uploadProof } from "./sede-helpers.mjs";

await withDatabase(async (db) => {
  const started = new Date(), seller = await db.user.findUniqueOrThrow({ where: { email: "qa-vendedor@unsa.edu.pe" } });
  const buyer = await db.user.findUniqueOrThrow({ where: { email: "qa-est@unsa.edu.pe" } });
  const worker = await db.user.findUniqueOrThrow({ where: { email: "qa-mod@unsa.edu.pe" } });
  const item = await db.bazarItem.findUniqueOrThrow({ where: { id: "qa-e2e-bazar" } });
  const base = { status: item.status, pausedAt: item.pausedAt, removedAt: item.removedAt, removedReason: item.removedReason, removedById: item.removedById };
  let orderId, proofUrl, session;
  try {
    const buyerToken = await login("est"), sellerToken = await login("vendedor"), workerToken = await login("mod"), adminToken = await login("admin");
    const created = await api("/orders", { token: buyerToken, method: "POST", body: { itemType: "bazar", itemId: item.id } });
    check(created.status === 201, `solicitud física QA: ${created.status} ${created.error?.message ?? ""}`); orderId = created.data.id;
    const accepted = await api(`/orders/${orderId}/accept`, { token: sellerToken, method: "POST" });
    check(accepted.status === 200, `aceptación del vendedor: ${accepted.status}`);
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    check(order.status === "ACCEPTED" && order.feeCents === 325 && order.netCents === 2175, "pedido aceptado con comisión 13% a cargo del vendedor");
    const handover = await db.handoverCase.findUniqueOrThrow({ where: { orderId } });
    const caseId = handover.id;
    check((await api(`/staff/cases/${caseId}/take`, { token: workerToken, method: "POST" })).status === 200, "trabajador toma el caso");
    const firstSlot = await futureSlot(workerToken, caseId, "DROP_OFF");
    const first = await book(workerToken, caseId, "DROP_OFF", firstSlot);
    await expireAppointment(db, first.id);
    check((await api(`/staff/cases/${caseId}/appointments/${first.id}/no-show`, { token: workerToken, method: "POST" })).status === 200, "equipo registra ausencia tras la cita");
    const strike = await db.strike.findUniqueOrThrow({ where: { appointmentId: first.id } });
    check(await db.notification.count({ where: { userId: seller.id, type: "ORDER_APPOINTMENT_NO_SHOW", createdAt: { gte: started } } }) > 0, "ausencia notificada al vendedor");
    const replacementSlot = await futureSlot(workerToken, caseId, "DROP_OFF");
    const replacement = await book(workerToken, caseId, "DROP_OFF", replacementSlot, first.id);
    await activateAppointment(db, replacement.id);
    proofUrl = await uploadProof(workerToken);
    check((await api(`/staff/cases/${caseId}/receive`, { token: workerToken, method: "POST", body: { photoUrl: proofUrl, conditionNote: "Objeto recibido para la prueba QA." } })).status === 200, "trabajador recibe objeto en sede");
    const pickupSlot = await futureSlot(workerToken, caseId, "PICKUP");
    const pickup = await book(workerToken, caseId, "PICKUP", pickupSlot);
    await activateAppointment(db, pickup.id);
    const account = await db.paymentAccount.findFirstOrThrow({ where: { userId: worker.id, holder: "QA Cuenta", number: "900000000", active: true } });
    const collected = await api(`/staff/cases/${caseId}/pickup`, { token: workerToken, method: "POST", body: { paymentMethod: "OPERATION", paymentAccountId: account.id, paymentProofUrl: proofUrl, paymentRef: "QA-SEDE-001", paymentConfirmed: true } });
    check(collected.status === 200, `cobro y entrega en sede: ${collected.status} ${collected.error?.message ?? ""}`);
    const payout = await db.payout.findUniqueOrThrow({ where: { orderId } });
    check(payout.status === "PENDING" && payout.feeCents === 325 && payout.netCents === 2175, "cobro verificado crea liquidación pendiente del neto");
    check((await db.handoverCase.findUniqueOrThrow({ where: { id: caseId } })).status === "CLOSED", "venta física entregada y caso cerrado");
    check((await db.bazarItem.findUniqueOrThrow({ where: { id: item.id } })).status === "SOLD", "artículo marcado vendido tras entrega");
    check((await api(`/staff/payouts/${payout.id}/complete`, { token: workerToken, method: "POST", body: { proofUrl, paymentRef: "QA-LIQ-001" } })).status === 200, "trabajador liquida con comprobante");
    check((await db.order.findUniqueOrThrow({ where: { id: orderId } })).status === "RELEASED", "liquidación completa libera el pedido");
    check((await api("/orders/payouts", { token: sellerToken })).data.some((row) => row.orderId === orderId && row.status === "COMPLETED"), "Mis cobros del vendedor muestra el payout pagado");
    session = await browserFor("vendedor"); await session.page.goto(`${WEB}/ventas`);
    const myPayout = session.page.locator("#mis-cobros article.card").filter({ hasText: item.title });
    await session.page.getByRole("heading", { name: "Mis cobros" }).waitFor();
    await myPayout.getByText("Pagado", { exact: true }).waitFor();
    check((await api(`/staff/users/${seller.id}/strikes/${strike.id}/forgive`, { token: adminToken, method: "POST", body: { reason: "Perdón de falta tras prueba QA física." } })).status === 200, "Técnico perdona la falta de prueba");
    globalThis.console.log("✓ sede: aceptar, cita de entrega, ausencia/falta, recepción, cobro con comprobante, entrega y liquidación en Mis cobros");
  } finally {
    if (session) await session.browser.close();
    if (orderId) {
      const current = await db.handoverCase.findUnique({ where: { orderId } });
      const appointments = current ? await db.appointment.findMany({ where: { caseId: current.id }, select: { id: true } }) : [];
      const payout = await db.payout.findUnique({ where: { orderId }, select: { id: true } });
      await db.notification.deleteMany({ where: { createdAt: { gte: started }, userId: { in: [buyer.id, seller.id, worker.id] }, OR: [
        { type: "ORDER_APPOINTMENT_NO_SHOW", userId: seller.id }, { body: { contains: item.title } }, { link: { contains: orderId } },
      ] } });
      await db.auditLog.deleteMany({ where: { createdAt: { gte: started }, entityId: { in: [orderId, ...(current ? [current.id] : []), ...(payout ? [payout.id] : []), ...appointments.map((a) => a.id)] } } });
      await db.sanction.deleteMany({ where: { userId: seller.id, auto: true, createdAt: { gte: started } } });
      if (current) {
        await db.strike.deleteMany({ where: { appointment: { caseId: current.id } } });
        await db.appointment.deleteMany({ where: { caseId: current.id } });
        await db.caseMessage.deleteMany({ where: { caseId: current.id } });
        await db.handoverCase.delete({ where: { id: current.id } });
      }
      await db.payout.deleteMany({ where: { orderId } });
      await db.escrow.deleteMany({ where: { orderId } });
      await db.order.delete({ where: { id: orderId } });
      await db.bazarItem.update({ where: { id: item.id }, data: base });
    }
    if (proofUrl) {
      const name = proofUrl.slice("/uploads/".length);
      await db.upload.deleteMany({ where: { storedName: name } });
      const { rm } = await import("node:fs/promises");
      await rm(new globalThis.URL(`../../apps/api/uploads/${name}`, import.meta.url), { force: true });
    }
  }
});
