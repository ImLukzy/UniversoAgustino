# SKILL: Bazar Engine Expert
**Cuándo usar:** Siempre que debas tocar Prisma, pagos, o lógica comercial.

## Reglas Estrictas:
1. **Regla del 13%:** Todo cálculo de precio debe usar la función `computePrice()` compartida. Nunca calcules el fee manualmente en el frontend.
2. **Escrow (Custodia):** Los pedidos pasan por `PENDING` -> `ACCEPTED` -> `PAID` -> `ESCROW`. No rompas esta máquina de estados.
3. **Seguridad:** Mantén la validación de correos `@unsa.edu.pe`.
