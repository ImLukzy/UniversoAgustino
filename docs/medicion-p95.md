# Medicion p95 - F0-c

Fecha: 2026-09-22 - bucle secuencial con fetch (N=25), API local :4000 contra Neon dev (sa-east-1), latencias de ida/vuelta incluidas.

> Los pedidos medidos quedan en estado PAID sobre items `Item p95 ...` creados para la medicion (cada pedido exige item fresco por el indice unico parcial). Ver limpieza en el reporte.

| Endpoint | n | min | p50 | p95 | max |
|---|---|---|---|---|---|
| `POST /api/v1/orders` | 25 | 950ms | 994ms | 1189ms | 1708ms |
| `POST /api/v1/orders/:id/pay` | 25 | 755ms | 771ms | 856ms | 1236ms |
| `GET /api/v1/orders/sales` | 25 | 567ms | 579ms | 1035ms | 1181ms |
| `GET /api/v1/orders/mine` | 25 | 191ms | 193ms | 292ms | 383ms |
