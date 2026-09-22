# Medicion p95 - F0-c

Fecha: 2026-09-22 - bucle secuencial con fetch (N=25), API local :4000 contra Neon dev (sa-east-1), latencias de ida/vuelta incluidas.

> Los pedidos medidos quedan en estado PAID sobre items `Item p95 ...` creados para la medicion (cada pedido exige item fresco por el indice unico parcial). Ver limpieza en el reporte.

| Endpoint | n | min | p50 | p95 | max |
|---|---|---|---|---|---|
| `POST /api/v1/orders` | 25 | 743ms | 754ms | 1034ms | 1299ms |
| `POST /api/v1/orders/:id/pay` | 25 | 741ms | 749ms | 837ms | 855ms |
| `GET /api/v1/orders/sales` | 25 | 555ms | 655ms | 1111ms | 1292ms |
| `GET /api/v1/orders/mine` | 25 | 187ms | 195ms | 372ms | 376ms |
