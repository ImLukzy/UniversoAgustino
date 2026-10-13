import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const urls = [process.env.DATABASE_URL, process.env.DIRECT_DATABASE_URL].filter(Boolean);
if (!urls.length || urls.some((url) => url.includes("ep-hidden-dew") || !url.includes("ep-orange-mountain"))) {
  console.error("qa:seed abortado: DATABASE_URL debe apuntar a la base de desarrollo autorizada.");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const bcryptModule = await import("bcryptjs");
const bcrypt = bcryptModule.default ?? bcryptModule;
const db = new PrismaClient();
const passwordHash = await bcrypt.hash(process.env.QA_PASSWORD || "QaPrueba2026!", 12);
const people = [
  ["qa-est@unsa.edu.pe", "Estudiante QA", "student"],
  ["qa-mod@unsa.edu.pe", "Moderación QA", "moderator"],
  ["qa-admin@unsa.edu.pe", "Administración QA", "admin"],
  ["qa-vendedor@unsa.edu.pe", "Vendedor QA", "creator"],
];

try {
  const users = {};
  for (const [email, fullName, role] of people) {
    users[email] = await db.user.upsert({
      where: { email },
      create: { email, passwordHash, role, profile: { create: { fullName, onboardedAt: new Date("2025-01-01T00:00:00Z") } } },
      update: { passwordHash, role, profile: { upsert: { create: { fullName, onboardedAt: new Date("2025-01-01T00:00:00Z") }, update: { fullName, onboardedAt: new Date("2025-01-01T00:00:00Z") } } } },
    });
  }
  const seller = users["qa-vendedor@unsa.edu.pe"], buyer = users["qa-est@unsa.edu.pe"];
  const title = "QA E2E publicación fija";
  const doc = await db.document.upsert({
    where: { id: "qa-e2e-document" },
    create: { id: "qa-e2e-document", authorId: seller.id, title, course: "Anatomía", cycle: "VI", type: "APUNTE", priceCents: 1500, description: "Fixture QA E2E", fileUrl: "/uploads/qa-e2e-previous-access.pdf", reviewStatus: "APPROVED", status: "PUBLISHED" },
    update: { authorId: seller.id, title, reviewStatus: "APPROVED", status: "PUBLISHED", pausedAt: null, removedAt: null, removedReason: null, removedById: null, fileUrl: "/uploads/qa-e2e-previous-access.pdf" },
  });
  for (const [id, title] of [["qa-e2e-pay-accepted", "QA E2E pago aceptado"], ["qa-e2e-pay-refund", "QA E2E pago reembolsado"]]) {
    await db.document.upsert({
      where: { id },
      create: { id, authorId: seller.id, title, course: "Anatomía", cycle: "VI", type: "APUNTE", priceCents: 1500, description: "Fixture QA E2E de pagos", fileUrl: "/uploads/qa-e2e-previous-access.pdf", reviewStatus: "APPROVED", status: "PUBLISHED" },
      update: { authorId: seller.id, title, priceCents: 1500, description: "Fixture QA E2E de pagos", fileUrl: "/uploads/qa-e2e-previous-access.pdf", reviewStatus: "APPROVED", status: "PUBLISHED", pausedAt: null, removedAt: null, removedReason: null, removedById: null },
    });
  }
  const bazar = await db.bazarItem.upsert({
    where: { id: "qa-e2e-bazar" },
    create: { id: "qa-e2e-bazar", sellerId: seller.id, title: "QA E2E libro fijo", kind: "LIBRO", tx: "VENTA", priceCents: 2500, description: "Fixture QA E2E", reviewStatus: "APPROVED", status: "AVAILABLE" },
    update: { sellerId: seller.id, title: "QA E2E libro fijo", reviewStatus: "APPROVED", status: "AVAILABLE", pausedAt: null, removedAt: null, removedReason: null, removedById: null },
  });
  let order = await db.order.findFirst({ where: { buyerId: buyer.id, itemType: "document", itemId: doc.id } });
  const orderData = { sellerId: seller.id, amountCents: 1500, feeCents: 75, netCents: 1425, itemTitle: title, itemPriceCents: 1500, feeBps: 500, status: "RELEASED" };
  order = order ? await db.order.update({ where: { id: order.id }, data: orderData }) : await db.order.create({ data: { buyerId: buyer.id, itemType: "document", itemId: doc.id, ...orderData } });
  await db.documentAccessGrant.upsert({ where: { orderId: order.id }, create: { buyerId: buyer.id, documentId: doc.id, orderId: order.id, fileUrl: doc.fileUrl, authorId: seller.id }, update: { buyerId: buyer.id, documentId: doc.id, fileUrl: doc.fileUrl, authorId: seller.id, revokedAt: null } });
  const uploadDir = resolve("apps/api/uploads");
  await mkdir(uploadDir, { recursive: true });
  const accountPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/cL8AAAAASUVORK5CYII=", "base64");
  await writeFile(resolve(uploadDir, "qa-e2e-account.png"), accountPng);
  const checksum = createHash("sha256").update(accountPng).digest("hex");
  await db.upload.upsert({ where: { storedName: "qa-e2e-account.png" }, create: { ownerId: users["qa-mod@unsa.edu.pe"].id, private: true, storedName: "qa-e2e-account.png", originalName: "qa-e2e-account.png", bytes: accountPng.length, detectedMime: "image/png", checksum }, update: { ownerId: users["qa-mod@unsa.edu.pe"].id, private: true, originalName: "qa-e2e-account.png", bytes: accountPng.length, detectedMime: "image/png", checksum } });
  const account = await db.paymentAccount.findFirst({ where: { userId: users["qa-mod@unsa.edu.pe"].id, number: "900000000" } });
  const accountData = { userId: users["qa-mod@unsa.edu.pe"].id, method: "YAPE", holder: "QA Cuenta", number: "900000000", photoUrl: "/uploads/qa-e2e-account.png", qrUrl: "/uploads/qa-e2e-account.png", active: true };
  if (account) await db.paymentAccount.update({ where: { id: account.id }, data: accountData });
  else await db.paymentAccount.create({ data: accountData });
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  pdf.addPage();
  await writeFile(resolve(uploadDir, "qa-e2e-previous-access.pdf"), await pdf.save());
  console.log(`QA fixtures ready: ${people.length} usuarios, 1 documento, 1 ítem, 1 pedido (${bazar.id ? "ok" : "error"}).`);
} finally {
  await db.$disconnect();
}
