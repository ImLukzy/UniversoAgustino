# Runbook: rotación de secretos — Universo Agustino

## Cuándo rotar
- Rutina: cada 90 días.
- Incidente: sospecha de filtración (ver F4-03, `scripts/check-secrets.sh` + gitleaks).

## Procedimiento (sin caída)
1. Generar: `openssl rand -base64 48` (dos valores distintos: access y refresh).
2. Desplegar la API aceptando ambos secretos durante la ventana de gracia:
   - Añadir `JWT_ACCESS_SECRET_PREV` / `JWT_REFRESH_SECRET_PREV` al entorno,
   - la verificación de access prueba nuevo y luego previo (cambio de 3 líneas en `lib/auth.ts`).
3. Esperar 24 h (cubre el TTL máximo del access, 15 min, y da margen al refresh de 7 días para rotar solo).
4. Retirar los valores `*_PREV` y redesplegar.
5. Si la rotación es por incidente: además revocar todos los refresh tokens
   (`UPDATE "RefreshToken" SET revoked = true`) para expulsar sesiones activas.

## Verificación
- `GET /ready` responde `db: up` tras el despliegue.
- Login + refresh + una acción autenticada en staging antes de pasar a producción.
- `GET /health` detrás del balanceador.
