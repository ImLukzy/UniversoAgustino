import type { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../middleware/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { itemOwner } from "./itemOwner.js";

// Lecturas: mis compras, mis ventas (paginadas) y detalle de un pedido.
// Las rutas fijas (/mine, /sales) se registran ANTES que /:id.
export function registerQueries(router: Router) {
  router.get(
    "/mine",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const rows = await prisma.order.findMany({ where: { buyerId: req.user!.sub }, orderBy: { createdAt: "desc" }, include: { escrow: true } });
      // Sprint 2B+: el comprador descarga sus digitales RELEASED sin fetch por
      // fila. Solo se expone el fileUrl de SUS pedidos liberados (una consulta).
      const docIds = [...new Set(rows.filter((o) => o.itemType === "document" && o.status === "RELEASED").map((o) => o.itemId))];
      const docs = docIds.length ? await prisma.document.findMany({ where: { id: { in: docIds } }, select: { id: true, fileUrl: true } }) : [];
      const files = new Map(docs.map((d) => [d.id, d.fileUrl ?? null]));
      const data = rows.map((o) => ({ ...o, fileUrl: o.itemType === "document" && o.status === "RELEASED" ? (files.get(o.itemId) ?? null) : null }));
      res.json({ data });
    }),
  );

  // Ventas: pedidos sobre MIS publicaciones, con comprador, título del ítem y
  // reputación del comprador (un solo groupBy, no un count por fila).
  router.get(
    "/sales",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const me = req.user!.sub;
      const [docs, items] = await Promise.all([
        prisma.document.findMany({ where: { authorId: me }, select: { id: true, title: true } }),
        prisma.bazarItem.findMany({ where: { sellerId: me }, select: { id: true, title: true, tx: true, description: true } }),
      ]);
      const meta = new Map<string, { title: string; desc?: string | null; tx?: string }>([
        ...docs.map((d): [string, { title: string }] => [d.id, { title: d.title }]),
        ...items.map((b): [string, { title: string; desc?: string | null; tx?: string }] => [b.id, { title: b.title, desc: b.description, tx: b.tx }]),
      ]);
      // F0-c p95: paginación keyset (createdAt desc, id desc). Sin params devuelve la 1ª página.
      const rawLimit = Number(req.query.limit ?? 50);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 50;
      const cursor = typeof req.query.cursor === "string" && req.query.cursor ? req.query.cursor : null;
      const cursorRow = cursor ? await prisma.order.findUnique({ where: { id: cursor }, select: { id: true, createdAt: true } }) : null;
      if (cursor && !cursorRow) return res.status(400).json({ error: { code: "VALIDATION", message: "Cursor inválido" } });
      const rows = await prisma.order.findMany({
        where: {
          itemId: { in: [...meta.keys()] },
          ...(cursorRow ? { OR: [{ createdAt: { lt: cursorRow.createdAt } }, { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } }] } : {}),
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        include: { escrow: true, buyer: { select: { id: true, email: true, profile: true } } },
      });
      const buyerIds = [...new Set(rows.map((o) => o.buyerId))];
      const completed = buyerIds.length
        ? await prisma.order.groupBy({ by: ["buyerId"], where: { buyerId: { in: buyerIds }, status: "RELEASED" }, _count: { _all: true } })
        : [];
      const completions = new Map(completed.map((r) => [r.buyerId, r._count._all]));
      const page = rows.slice(0, limit);
      const data = page.map((o) => ({
        ...o,
        itemTitle: meta.get(o.itemId)?.title ?? o.itemId,
        itemDesc: meta.get(o.itemId)?.desc ?? null,
        itemTx: meta.get(o.itemId)?.tx ?? null,
        buyerCompleted: completions.get(o.buyerId) ?? 0,
      }));
      res.json({ data, nextCursor: rows.length > limit ? (page[page.length - 1]?.id ?? null) : null });
    }),
  );

  // Detalle: solo participan comprador, vendedor o moderación.
  router.get(
    "/:id",
    requireAuth,
    asyncHandler(async (req: AuthedRequest, res) => {
      const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { escrow: true } });
      if (!order) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Pedido no existe" } });
      const item = await itemOwner(order.itemType, order.itemId);
      const me = req.user!.sub;
      const allowed = order.buyerId === me || item.ownerId === me || ["admin", "moderator"].includes(req.user!.role);
      if (!allowed) return res.status(403).json({ error: { code: "FORBIDDEN", message: "No participas en este pedido" } });
      res.json({ data: order });
    }),
  );
}
