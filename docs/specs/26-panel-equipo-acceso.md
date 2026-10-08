# Especificación: 26 - Panel del equipo: acceso y miembros

## 1. Objetivo
**Problema:** no hay forma de dar acceso de moderación a correos UNSA concretos. Los roles `moderator` y `admin` existen (`apps/api/prisma/schema.prisma:10-15`), pero solo se asignan a mano en la BD, y `/admin` (`apps/web/src/pages/Admin.tsx`) solo lista denuncias.
**Resultado esperado:** existe la pestaña `/equipo`, visible y accesible solo para `moderator` y `admin`. Un `admin` añade o quita miembros del equipo por correo desde la UI. Cada alta/baja queda en `AuditLog`. Es la base donde se colgarán las bandejas de las specs 27–30.

## 2. Fuera de alcance
- Revisión de publicaciones, pagos, entregas (specs 27–30).
- Migraciones: **ninguna** (roles y `AuditLog` ya existen).
- Cambiar login, OAuth, OTP o la regla de dominio.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna. (Quiénes son los miembros iniciales lo decide el humano después; se cargan con el script de §3.)

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `apps/api/src/modules/staff/routes.ts` | crear | `GET /staff/members`, `POST /staff/members`, `DELETE /staff/members/:userId` |
| `apps/api/src/modules/staff/staff.test.ts` | crear | tests de permisos y reglas |
| `apps/api/src/app.ts` | modificar | `r.use("/staff", staffRouter)` junto a las líneas 37-46 |
| `apps/api/docs/openapi.yaml` | modificar | 3 rutas nuevas |
| `apps/api/scripts/grant-role.ts` + script `staff:grant` en `apps/api/package.json` | crear / modificar | arranque: `npm run staff:grant -w apps/api -- <correo> admin|moderator|student` |
| `packages/shared/src/` (archivo de esquemas) | modificar | `StaffMemberSchema` `{ email }` con `isAllowedEmail` |
| `apps/web/src/pages/Equipo.tsx` | crear | layout con pestañas: Resumen · Denuncias · Miembros (solo admin) |
| `apps/web/src/components/equipo/*` | crear | `MiembrosTab`, `DenunciasTab` (mover aquí el contenido de `Admin.tsx`) |
| `apps/web/src/pages/Admin.tsx` | eliminar | `/admin` redirige a `/equipo` |
| `apps/web/src/lib/routes.ts:27` | modificar | `equipo: "/equipo"`; quitar `admin` o dejarlo como alias de redirección |
| `apps/web/src/app/AppRoutes.tsx:30,88` | modificar | ruta `/equipo` (lazy) + `<Navigate>` desde `/admin` |
| `apps/web/src/components/panel/PanelSpaces.tsx:14` | modificar | tarjeta "Equipo" → `/equipo` |
| `apps/web/src/components/publicaciones/SalesOverview.tsx` | modificar | solo si usa `ROUTES.admin` |
| `eslint.config.mjs` | modificar | excluir `apps/api/scripts/grant-role.ts` del projectService como `prisma/seed.ts` |
| `scripts/docs-check.mjs` | modificar | incluir archivo staff y prefijo staffRouter; ampliación autorizada por god |

## 4. Diseño y lógica
- **API (`/staff`, todas con `requireAuth` + `requireRole("moderator","admin")`):**
  - `GET /staff/members` → `{ data: [{ id, email, fullName, role, since }] }` (usuarios con rol `moderator|admin`).
  - `POST /staff/members` `{ email }` — **solo admin**. Valida `isAllowedEmail` (UNSA o excepción). Si el usuario no existe → `404 USER_NOT_FOUND` "Esa persona aún no ingresó a Universo Agustino". Si ya es `moderator|admin` → `409 ALREADY_STAFF`. Asigna `moderator`.
  - `DELETE /staff/members/:userId` — **solo admin**. No puede quitarse a sí mismo (`409 SELF_REMOVE`) ni quitar a otro `admin` (`409 IS_ADMIN`). Devuelve el rol a `creator`.
  - Alta/baja → `AuditLog { actorId, action: "staff.add"|"staff.remove", entity: "user", entityId }`. **Sin `notify`** en esta spec: `NotificationType` es enum de Prisma y añadir valores exige migración; los avisos `STAFF_ADDED/STAFF_REMOVED` se añaden en la migración de la spec 27.
  - El rol viaja en el JWT de acceso: el cambio aplica en la siguiente rotación (≤ `JWT_ACCESS_TTL`). Además, revocar los refresh tokens del usuario dado de baja para que pierda el acceso de inmediato al expirar el access.
- **Web:** `/equipo` con `LoginRequired`; si el rol no es `moderator|admin` → mensaje "No tienes acceso al panel del equipo" (sin filtrar datos). Pestaña Resumen: contadores de denuncias abiertas (lo que hoy da `PanelSpaces`). Miembros: lista + formulario "Añadir por correo" + botón "Quitar" con confirmación; solo visible para `admin`. Estilo `.card .btn-* .input .chip`, tokens `primary*`, componentes < 150 líneas, móvil sin scroll horizontal.
- **Script `grant-role.ts`:** usa `DATABASE_URL`; imprime solo correo y rol nuevo. Lo ejecuta god (en producción solo con OK humano).

## 5. Criterios de aceptación
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 / 0 |
| A3 | Tests | `npm test` | verdes; `staff.test.ts`: student→403 en las 3 rutas; moderator lista pero no añade/quita (403); admin añade UNSA (200), rechaza correo no UNSA (400), inexistente (404), duplicado (409), auto-baja (409), quitar admin (409); AuditLog escrito |
| A4 | Contrato | `npm run docs:check` | verde |
| A5 | Tamaño | archivos tocados ≤ 150 líneas (excepción: `openapi.yaml`, ya > 500) | ≤ 150 |
| A7 | Scroll | `/equipo` a 375 px | 0 px |
| A11 | E2E | god: admin añade un correo → ese usuario ve "Equipo" y entra a `/equipo`; un estudiante en `/equipo` ve el aviso sin datos; `/admin` redirige | pasa |

## 6. Checklist de ejecución
- [x] API `/staff` + tests.
- [x] Script `staff:grant`.
- [x] Web `/equipo` (pestañas) + redirección `/admin`.
- [x] openapi + gates A1–A7 anotados en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia |
|---|---|---|---|
| 2026-10-08 | A1 | Pasa | `npm run typecheck`: exit 0 (API/web/shared). Shared reconstruido antes con `npm run build -w packages/shared`: exit 0. |
| 2026-10-08 | A2 | Pasa | `npm run lint -- --ignore-pattern 'hive/**'`: exit 0 sin warnings. Tras ampliar el gate de docs: ESLint de `scripts/docs-check.mjs`, exit 0. |
| 2026-10-08 | A3 | Pasa | Staff 22/22 en sandbox, sin BD/red. God ejecutó `npm test` fuera del sandbox con JWT ficticios: API 74/74, web 73/73, shared 42/42 (189); mensaje 2026-10-08T20-05-27-481Z-9604b5. El test existente de documentos requiere abrir puerto y falla EPERM en sandbox. |
| 2026-10-08 | A4 | Pasa | `npm run docs:check`: exit 0, 26 rutas cubiertas. Prueba negativa: omitir temporalmente `/staff/members/{userId}` devuelve exit 1 con FALTA; restaurado, exit 0. YAML sin claves duplicadas y GET/POST/DELETE staff comprobados con bearerAuth. |
| 2026-10-08 | A5 | Pasa | Máximo de código tocado: staff.test.ts 112 líneas; AppRoutes 99; DenunciasTab 78; demás ≤150. OpenAPI exento por god; sin cambios de schema ni migraciones. |
| 2026-10-08 | A7 | Pendiente (god) | God asumió la medición de scroll a 375 px, mensaje 2026-10-08T20-05-27-481Z-9604b5. |
| 2026-10-08 | A11 | Pendiente (god) | Verificación en navegador a cargo de god. Script de roles creado y no ejecutado sobre ninguna BD. |
| 2026-10-08 | Build web | Pasa | `npm run build -w apps/web`: exit 0, 748 módulos; avisos existentes de importación estática/dinámica Explorar/Forgot. `git diff --check`: exit 0. A6 no definido en la spec. |
| 2026-10-08 | A7 | Pasa | God, Playwright 375 px en `/equipo` (admin, moderador, estudiante): exceso horizontal 0 px. |
| 2026-10-08 | A11 | Pasa | God contra BD dev `Unsa`: `/admin` → `/equipo`; admin añade `qa-mod@unsa.edu.pe` (aparece como Moderador); el moderador entra y ve Denuncias; el estudiante ve "No tienes acceso al panel del equipo" sin correos del equipo; `staff:grant` asignó admin a `qa-admin`. |
| 2026-10-08 | Auditoría | Pasa | Kelly APTO; bajo (prefetch `/admin`) corregido. Gate final god: typecheck, lint, docs:check, secrets OK; tests API 74, web 73, shared 42. |
