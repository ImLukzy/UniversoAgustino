# RFC 0001 — Reseñas post-compra (diferido)

## Contexto
El modelo `Review` se eliminó del schema en Sprint F2-08 (tablas vacías,
sin rutas ni UI). Este documento registra el diseño acordado para
reintroducirlo cuando el negocio lo pida.

## Diseño diferido
- Reseña solo tras `RELEASED`, una por pedido, ventana de 14 días.
- Edición dentro de 24 h; reporte por abuso reutilizando el flujo
  TAKEDOWN + SLA 48 h ya existente (`POST /reports`, `POST /reports/:id/action`).
- Reputación agregada en columna denormalizada del perfil del vendedor
  (evita N+1 al listar), recalculada por job, no por trigger.
- Anti-abuso: solo el comprador del pedido puede reseñar; el vendedor no
  puede auto-reseñarse (misma guarda `SELF_PURCHASE` de `POST /orders`).

## Reversión de esta decisión
Recrear el modelo con esta forma mínima y una migración nueva
(no reutilizar el nombre de la migración de borrado):

```prisma
model Review {
  id        String   @id @default(cuid())
  orderId   String   @unique
  authorId  String
  targetId  String
  stars     Int
  comment   String?
  createdAt DateTime @default(now())

  @@index([targetId, createdAt])
}
```
