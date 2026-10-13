import { api, audit, browserFor, check, fixture, login, withDatabase, WEB } from "./helper.mjs";

await withDatabase(async (db) => {
  const data = await fixture(db), started = new Date();
  const baseline = { removedAt: data.doc.removedAt, removedReason: data.doc.removedReason, removedById: data.doc.removedById, pausedAt: data.doc.pausedAt, status: data.doc.status, reviewStatus: data.doc.reviewStatus };
  const reporter = await browserFor("est");
  try {
    await reporter.page.goto(`${WEB}/pedidos`);
    await reporter.page.getByRole("button", { name: "Reportar al vendedor" }).first().click();
    await reporter.page.getByLabel("Cuéntanos los detalles").fill("QA E2E: el vendedor no se presentó en la entrega acordada.");
    await reporter.page.getByRole("button", { name: "Enviar reporte" }).click();
    await reporter.page.getByRole("status").filter({ hasText: "Reporte enviado" }).waitFor();
    const report = await db.report.findFirstOrThrow({ where: { reporterId: data.buyer.id, targetId: data.order.id, createdAt: { gte: started } }, orderBy: { createdAt: "desc" } });
    const moderator = await browserFor("mod");
    try {
      await moderator.page.goto(`${WEB}/panel/denuncias`);
      const card = moderator.page.locator("article.card").filter({ hasText: data.doc.title });
      await card.getByText(report.reason).waitFor();
      await audit(moderator.page);
      await card.getByRole("button", { name: "Sancionar vendedor" }).click();
      await card.getByLabel("Tipo de sanción").selectOption("SUSPENSION");
      await card.getByLabel("Motivo (obligatorio, 5–300)").fill("QA E2E: suspensión de prueba por reporte.");
      await card.getByRole("button", { name: "Aplicar suspensión" }).click();
      await moderator.page.getByRole("alertdialog").getByRole("button", { name: "Confirmar sanción" }).click();
      await card.getByRole("status").filter({ hasText: "Sanción aplicada" }).waitFor();
      const reason = "QA E2E: retiro por reporte verificable.";
      await card.getByRole("button", { name: "Retirar publicación" }).click();
      await card.getByLabel("Motivo para retirar (10–500)").fill(reason);
      await card.getByRole("button", { name: "Confirmar retiro" }).click();
      await moderator.page.getByRole("status").filter({ hasText: "Publicación retirada y reporte resuelto" }).waitFor();
      check((await db.report.findUniqueOrThrow({ where: { id: report.id } })).status === "ACTIONED", "moderación resuelve el reporte");
      const removed = await api(`/documents/${data.doc.id}`);
      check(removed.status === 200 && removed.data.removed === true, "detalle refleja retirada");
      const blocked = await api("/orders", { token: await login("est"), method: "POST", body: { itemType: "document", itemId: data.doc.id } });
      check(blocked.status === 409 && blocked.error?.code === "LISTING_REMOVED", "compra bloqueada con LISTING_REMOVED");
      const admin = await login("admin");
      const restore = await api(`/staff/listings/document/${data.doc.id}/restore`, { token: admin, method: "POST" });
      check(restore.status === 200, "admin restaura publicación retirada");
      check((await api(`/documents/${data.doc.id}`)).data.removed === false, "publicación restaurada");
      globalThis.console.log("✓ spec46: reportar, contexto moderador, sancionar, retirar y restaurar como admin; responsive/axe");
    } finally { await moderator.browser.close(); }
  } finally {
    await reporter.browser.close();
    await db.document.update({ where: { id: data.doc.id }, data: baseline });
    await db.report.deleteMany({ where: { reporterId: data.buyer.id, targetId: data.order.id, reason: { startsWith: "QA E2E:" }, createdAt: { gte: started } } });
    await db.sanction.deleteMany({ where: { userId: data.seller.id, reason: { startsWith: "QA E2E:" }, createdAt: { gte: started } } });
    await db.notification.deleteMany({ where: { userId: data.seller.id, createdAt: { gte: started }, body: { contains: data.doc.title } } });
    await db.auditLog.deleteMany({ where: { createdAt: { gte: started }, entityId: { in: [data.doc.id, data.seller.id] } } });
  }
});
