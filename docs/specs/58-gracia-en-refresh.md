# Especificación: 58 - Periodo de gracia al rotar el refresh token

## 1. Objetivo
**Problema:** `POST /auth/refresh` (`apps/api/src/modules/auth/account.ts:60-82`) revoca el refresh usado y emite uno nuevo en la cookie `hub_refresh`. Si la respuesta no llega al navegador (recarga completa, F5 o cierre de pestaña justo durante la petición), la cookie vieja ya está revocada y la nueva se perdió: el usuario pierde la sesión. Con la sesión diferida de la spec 57 la ventana es algo mayor. Comprobado por Michael en E2E (refresh abortado → `/auth/me` y refresh 401).
**Resultado esperado:** un refresh revocado **por rotación** sigue siendo válido durante una gracia corta (30 s) y vuelve a emitir sesión; fuera de la gracia, o si fue revocado por logout, cambio de contraseña o expulsión del equipo, sigue siendo rechazado.

## 2. Fuera de alcance
- Cambiar TTLs de access/refresh, cookies, CSRF o el flujo de login.
- Web: no cambia.

**Decisiones de producto:** aprobada por el humano 2026-10-13 (arreglar antes de publicar la spec 57).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/prisma/schema.prisma` | modificar | `RefreshToken.rotatedAt DateTime?` (momento de la revocación por rotación) |
| `apps/api/prisma/migrations/<fecha>_refresh_grace/migration.sql` | crear | `ADD COLUMN "rotatedAt" TIMESTAMP(3)` nullable, sin backfill |
| `apps/api/src/modules/auth/account.ts` | modificar | en `/refresh`: la rotación marca `revoked: true` y `rotatedAt: now`; acepta un token revocado solo si `rotatedAt` existe y `now - rotatedAt ≤ 30 s` y no ha expirado; `/logout` revoca SIN `rotatedAt` (no reutilizable) |
| `apps/api/src/modules/auth/password.ts`, `apps/api/src/modules/staff/routes.ts:83` | revisar | revocaciones por cambio de contraseña / expulsión no deben fijar `rotatedAt` (no reutilizables) |
| tests en `apps/api/src/**` | crear | casos de §5 |
| `apps/api/docs/openapi.yaml` | modificar | si documenta el comportamiento de `/auth/refresh` |

## 4. Diseño y lógica
- Gracia fija de 30 s (constante con nombre). Cada uso dentro de la gracia emite un refresh nuevo válido; el token rotado sigue siendo inútil pasados 30 s.
- Concurrencia: dos refresh casi simultáneos con la misma cookie deben acabar ambos con sesión válida (no 401 al segundo).
- Seguridad: un token robado y usado tras la gracia sigue siendo rechazado; logout/cambio de contraseña/expulsión no tienen gracia.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | Tests | rotado usado a los 5 s → 200 con sesión nueva; a los 31 s → 401; revocado por logout → 401 inmediato; por cambio de contraseña → 401; dos refresh concurrentes con la misma cookie → ambos 200 | pasan |
| A3 | Migración | `prisma migrate deploy` en BD dev | OK |
| A4 | E2E | `npm run e2e:ci` 3 veces | ✓ |

## 6. Checklist de ejecución
- [ ] Tarea 1: schema + migración + lógica + tests + openapi.
- [ ] Tarea 2: verificar A1–A4 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
