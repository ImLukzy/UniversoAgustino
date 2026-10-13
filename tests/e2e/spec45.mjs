import { api, audit, browserFor, check, checkIconFont, fixture, login, withDatabase, WEB } from "./helper.mjs";

await withDatabase(async (db) => {
  const data = await fixture(db);
  const baseline = { pausedAt: data.doc.pausedAt, status: data.doc.status, reviewStatus: data.doc.reviewStatus };
  const session = await browserFor("vendedor");
  try {
    await checkIconFont(session.page);
    await session.page.goto(`${WEB}/publicaciones`);
    const row = session.page.locator("article.card").filter({ hasText: data.doc.title });
    await row.getByRole("button", { name: "Editar" }).click();
    await row.getByRole("button", { name: "Pausar" }).click();
    const modal = session.page.getByRole("alertdialog");
    await modal.getByRole("button", { name: "Pausar" }).click();
    await row.getByText("Pausada", { exact: true }).waitFor();
    const detail = await api(`/documents/${data.doc.id}`);
    check(detail.status === 200 && detail.data.paused === true, "API muestra publicación pausada");
    const order = await api("/orders", { token: await login("est"), method: "POST", body: { itemType: "document", itemId: data.doc.id } });
    check(order.status === 409 && order.error?.code === "LISTING_PAUSED", "compra bloqueada con LISTING_PAUSED");
    const buyer = await browserFor("est");
    try {
      await buyer.page.goto(`${WEB}/p/document/${data.doc.id}`);
      await buyer.page.getByRole("status").filter({ hasText: "Pausada" }).waitFor();
      await audit(buyer.page);
      const downloaded = await api(`/documents/${data.doc.id}/download`, { token: await login("est") });
      check(downloaded.status === 200, "comprador previo conserva acceso al archivo pausado");
    } finally { await buyer.browser.close(); }
    await row.getByRole("button", { name: "Editar" }).click();
    await row.getByRole("button", { name: "Reactivar" }).click();
    await row.getByText("Activa", { exact: true }).waitFor();
    const restored = await db.document.findUniqueOrThrow({ where: { id: data.doc.id } });
    check(restored.reviewStatus === baseline.reviewStatus && restored.status === baseline.status, "reactivar conserva aprobación");
    globalThis.console.log("✓ spec45: pausar, compra bloqueada, acceso previo y reactivar; responsive/axe");
  } finally {
    await db.document.update({ where: { id: data.doc.id }, data: baseline });
    await session.browser.close();
  }
});
