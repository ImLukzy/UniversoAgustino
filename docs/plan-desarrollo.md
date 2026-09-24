# Plan de Desarrollo e Implementación Técnica — Universo Agustino

> Documento único y ordenado del proyecto. Consolida: ficha técnica, reglas de
> ingeniería, cronología completa con avance real, guías operativas íntegras,
> el módulo nuevo de subida de archivos (R2), lo que sigue en el roadmap y el
> prompt oficial para continuar el trabajo en cualquier dispositivo.
>
> Fuente de verdad al cierre de este doc: HEAD `b24147d`, árbol limpio,
> verificado con `git log --oneline -1` y `git status --short` el 2026-09-22.
> Si el HEAD cambió, la §4 indica cómo re-verificar antes de seguir.

## Índice

1. [Ficha del proyecto](#1-ficha-del-proyecto)
2. [Reglas duras de ingeniería](#2-reglas-duras-de-ingeniería)
3. [Cronología completa del desarrollo](#3-cronología-completa-del-desarrollo)
4. [Estado real hasta hoy](#4-estado-real-hasta-hoy)
5. [Guías operativas consolidadas](#5-guías-operativas-consolidadas)
6. [Nuevo: subida de archivos con driver S3-compatible (R2)](#6-nuevo-subida-de-archivos-con-driver-s3-compatible-r2)
7. [Lo que sigue: Fase 0 auditoría + despliegue](#7-lo-que-sigue-fase-0-auditoría--despliegue)
8. [El prompt oficial para continuar](#8-el-prompt-oficial-para-continuar)
9. [Comandos de referencia rápida](#9-comandos-de-referencia-rápida)

---

## 1. Ficha del proyecto

| Campo | Valor |
|---|---|
| Nombre | Universo Agustino (antes `enfermeria-hub`) |
| Repo | https://github.com/ImLukzy/UniversoAgustino.git, branch `main` |
| Root local | `C:\Users\anton\OneDrive\Documentos\Unsa\enfermeria-hub` |
| API | Express + Prisma, puerto 4000, prefijo `/api/v1` |
| Web | React + Vite, puerto 5173 |
| DB | Neon Postgres (São Paulo). El API local escribe en Neon remoto salvo que `DATABASE_URL` diga otra cosa |
| Paquete compartido | `@hub/shared` |
| Tagline | "Conectamos estudiantes, multiplicamos oportunidades" |
| Logo | `apps/web/public/logo-ua.svg` |
| `VITE_APP_NAME` | `Universo Agustino` |

### Modelo de negocio (no negociable)

- Marketplace universitario UNSA, career-aware (catálogo por carrera, 15 carreras).
- Compra en custodia. Comisión fija **13%**, calculada solo vía `computePrice()` en `@hub/shared`.
- Invariante: **net + fee = amount** para el 100% de los pedidos.
- Máquina de estados: `PENDING → ACCEPTED (solo bazar con alquiler) → PAID → ESCROW → RELEASED`.
- `document` en PENDING paga directo (no pasa por ACCEPTED). Bazar sin `rentalStart`
  (venta directa) también paga desde PENDING. Solo el alquiler (`rentalStart`) exige ACCEPTED.
- `CANCELLED` siempre lleva motivo explícito (`cancelledReason`: `TTL_EXPIRED`, `BUYER_CANCELLED`, etc.).
- TTL de reservas: 30 min (`RESERVATION_TTL_MINUTES`). Crear un pedido RESERVA el item (lo bloquea).
- Sin membresías, sin planes VIP, sin ratings, sin saldos: no existen en el producto.

### Cuentas seed

| Email | Password | Rol |
|---|---|---|
| `lukas.melgar@tecsup.edu.pe` | `Lukas123!` | admin (excepción de dominio) |
| `admin@unsa.edu.pe` | `Admin1234!` | admin |
| `rosa.quispe@unsa.edu.pe` | `Creadora123!` | creator |

### Variables de entorno (raíz, archivo `.env` — nunca se commitea)

```
NODE_ENV=development
API_PORT=4000
API_PREFIX=/api/v1
WEB_ORIGIN=http://localhost:5173
JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (plantilla en dev; rotar en prod, ver §5.3)
JWT_ACCESS_TTL=15m / JWT_REFRESH_TTL=7d
DATABASE_URL=<Neon pooler> (ver §5.2 para prod)
DIRECT_DATABASE_URL=<Neon sin "-pooler"> (job TTL)
REDIS_URL=redis://localhost:6379
PLATFORM_FEE_PCT=13
RESERVATION_TTL_MINUTES=30
ENABLE_JOBS=false (true en exactamente una instancia prod)
STORAGE_DRIVER=s3 (R2 activo desde 2026-09-22; ver §6)
STORAGE_LOCAL_DIR=./uploads
MAX_UPLOAD_MB=25
VITE_API_URL=http://localhost:4000/api/v1
VITE_APP_NAME=Universo Agustino
```

---

## 2. Reglas duras de ingeniería

Violar cualquiera invalida el trabajo:

1. **Vocabulario:** `itemType` siempre minúsculas `"document" | "bazar"`. Roles:
   `"student" | "creator" | "moderator" | "admin"`. No existen otros valores.
2. **Auth:** el usuario autenticado se lee de `req.user.sub` — NUNCA `req.user.id`.
3. **Contrato de error:** todo error HTTP responde exactamente
   `{ error: { code, message, details?, requestId } }`. Sin códigos nuevos sin proponerlos antes.
4. **Cero fabricación:** no inventar datos de negocio. Excepción: fixtures sintéticos de
   testing con emails `@test.local` y títulos `LOADTEST-`/`AXE-`, nunca como cifras reales.
5. **Precios:** solo vía `computePrice()` de `@hub/shared`. Cambiar precio con pedidos vivos
   muestra aviso (el cambio solo aplica a nuevas reservas).
6. **Calidad bloqueante:** `tsc` ×3 en verde, `eslint` 0 errores, `.any-budget` = 0,
   `docs-check` 38/38, E2E base verde. Sin esto no hay commit.
7. **Carga con escritura:** ningún script que golpee `POST /orders` o `/pay` se ejecuta
   automáticamente; solo manual, contra base confirmada, con fixture desechable y limpieza
   (`POST /:id/cancel`) incluida en el propio script.

---

## 3. Cronología completa del desarrollo

Historial verificado con `git log` (9 commits, HEAD `b24147d`):

1. **`6f3f0c5` — Release inicial.** Marketplace UNSA-only (Stitch + API + Neon).
2. **`ab8460e` — Marca UA.** Universo Agustino: custodia 13%, Gestión de Ventas, Mi Bazar,
   ciclo por carrera, sin membresía. Catálogo `careerContent` (15 carreras), header/footer,
   login, pagos backend, páginas Detalle/Visor/Checkout/Pedidos/Cuenta/Panel/Publicaciones/
   Publicar/Ventas. Custodia E2E en verde.
3. **`0989626` — Sprint 1A.** TTL reservas + snapshot de precio + `sellerId` + refresh
   silencioso (single-flight) + errores Prisma/Multer tipados + guard `DELETE 409`
   (`CONFLICT_ACTIVE_ORDERS`). Migraciones `sprint1a_reservation_ttl` y `reservation_bazar_scope`.
   Job `expireReservations` con `SELECT...FOR UPDATE SKIP LOCKED`. Expiración perezosa.
4. **`99fc344` — Sprint 1B.** Sort precio, forgot real (flujo honesto), `ConfirmModal`
   (adiós `window.confirm`), validación de fechas de alquiler.
5. **`cb313d4` — Sprints 2A/2B/3/4.** Fix N+1 en `/orders/sales` (13→4 queries) + `OrderTitle`
   por snapshot; `orderLabels`/`SaleActions`/`PanelOrderRow`/`RentalCard`; catálogo separado
   por carrera; `Skeleton`/`Toast`/`Accordion` + `focus-visible`; env fail-fast + firma mágica
   de uploads + registro `Upload` + CSP report-only + CSRF + lazy loading con chunks +
   `openapi.yaml` + runbook de rotación + checklist pre-despliegue.
6. **`2e5786a` — F1-01 + F1-08.** Password reset end-to-end (`PasswordResetToken`, mailer
   `ConsoleDriver`, `POST /auth/forgot` 202 neutro + `/reset` 410, doble rate-limit,
   `ResetPassword.tsx`) + notificaciones in-app (`Notification`, `lib/notify.ts`, campana
   en `StitchAuth.tsx`). E2E `e2e-f1.mjs` verde.
7. **`8c67ee8` — F0 + F2-08 + F3-06.** Tooling vitest/eslint/CI + baseline + budgets
   (`.any-budget`, `check-file-size`); drop de `Review`/`Payout` + RFC; microcopy sin jerga
   (`ITEM_TYPE_LABEL`, `REPORT_STATUS_LABEL`, "Mi Bazar" unificado).
8. **`ef1ee7a` — F2-07 + F2-09 + follow-ups.** Strict extra + `any`→error + typed lint
   (21 promesas flotantes reales corregidas); `computePrice()` + 11 tests + aviso al editar
   precio con pedidos vivos; `fileUrl` en `GET /orders/mine` (digitales RELEASED propios,
   botón Descargar restaurado); `lib/prefetch.ts` con `import.meta.glob` + hover en PanelTabs.
9. **`b24147d` — Driver R2 (actual).** Storage S3-compatible con fallback local, serve con
   redirect 302 a URL prefirmada de 15 min, script `migrate-uploads-to-r2.mjs`,
   `docs/storage-r2.md`. **ACTIVO desde 2026-09-22**: `STORAGE_DRIVER=s3`, 11 archivos
migrados a R2 (0 fallidos). Ver §6.

Migraciones Prisma aplicadas (10/10): `init`, `unsa_only`, `pay_flow`, `bazar_photos`,
`rental_accept`, `sprint1a_reservation_ttl`, `reservation_bazar_scope`,
`sprint4_upload_registry`, `f1_auth_notifications`, `f2_drop_orphan_models`.

---

## 4. Estado real hasta hoy

### Completado y verificado

- Todo lo de §3, con `tsc` ×3 + `eslint` 0 errores + **51 tests** (api 18, web 9, shared 24) +
  `vite build` + `docs-check` 38/38 + E2E base/TTL/F1 verdes al cierre de cada commit.
- OpenAPI: 38 rutas documentadas (se eliminó `/monetization/payouts` con F2-08).
- Archivos clave: `apps/api/src/modules/orders/routes.ts` + `reservation.ts`,
  `apps/api/src/lib/storage.ts`, `apps/api/src/middleware/serveUploads.ts`,
  `packages/shared/src/index.ts` (`computePrice`, `ORDER_STATUS`, labels),
  `apps/web/src/lib/api.ts` (refresh single-flight, QueryClient 5 min),
  `apps/web/src/App.tsx` (lazy + boundaries), `apps/web/src/data/careerContent.ts`.

### Pendiente (orden del roadmap)

1. **Fase 0 auditoría:** axe-core (0 serias/críticas en Detalle/Checkout/Panel/Publicar),
   Lighthouse prod móvil (Performance ≥ 85, Accessibility ≥ 95), p95 de `POST /orders`,
   `/pay`, `/orders/sales`, `/orders/mine` (hoy "Pendiente" en baseline).
2. **Re-medir `baseline-2026-09.md`** (quedó en la era `2e5786a`: decía tests 38, `any` 3,
   rutas 39/39, migraciones 9/9).
3. **Checklist pre-despliegue** (26 ítems, §5.2): rotación JWT, `ENABLE_JOBS=true` en una
   instancia, staging, backups, concurrencia F1-05 (50 simultáneas → 1 éxito).
4. **Despliegue** (destino por definir) + **reactivar R2** en ese momento (§6).
5. **Follow-up diferido:** control de acceso fino a archivos (hoy quien tiene la URL la abre).

### Cómo re-verificar el estado en cualquier momento

```powershell
git log --oneline -1; git status --short
npx tsc --noEmit -p apps/api/tsconfig.json; npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p packages/shared/tsconfig.json
npx eslint .; npm run test --workspaces --if-present
npm run build -w apps/web; node scripts/docs-check.mjs
node scripts/e2e-sprint1a.mjs base
```

---

## 5. Guías operativas consolidadas

Se transcriben íntegras para que este archivo sea autosuficiente. Si un doc cambia en
disco, la copia vigente es la del archivo individual.

### 5.1 Baseline medible — 2026-09-21 (era `2e5786a` + F1-01/F1-08)

Objetivos comparativos del roadmap se verifican contra esta tabla.
Método de medición indicado por fila. Lo no medible queda como pendiente.

**Rendimiento**

| Métrica | Valor | Método |
|---|---|---|
| Queries por request `GET /orders/sales` (10 ventas) | **4** (antes: 13) | `verify2a.mjs` con Prisma query-events |
| Queries `GET /orders/mine` + Panel | 1 + 0 por fila | Código (sin `OrderTitle`) + E2E `itemTitle` presente |
| Chunk inicial gzip aprox | index 222 kB + vendor-react 160 kB + vendor-query 41 kB | `apps/web/dist/assets` (build F4-04) |
| pdf.js fuera del inicial | Sí (`vendor-pdf` 471 kB aparte) | visual del dist |
| Chunks por ruta | 2.7–41.5 kB c/u | dist (lazy F4-04) |
| p50/p95 endpoints | **Pendiente** | autocannon pendiente de instalar |
| Lighthouse Performance/Accessibility | **Pendiente** | Sin navegador headless en esta máquina |
| Violaciones axe-core | **Pendiente** | `npx playwright` pendiente |

**Código**

| Métrica | Valor | Método |
|---|---|---|
| Página más grande | `Publicaciones.tsx` 664 líneas | `scripts/check-file-size.mjs` |
| Top 3 | Publicar 596, Panel 464 | mismo script |
| Ocurrencias `any` | **3** (tope `.any-budget`) | `scripts/any-budget.mjs` |
| `tsc --noEmit` api/web/shared | Verde | CI `typecheck` |
| `eslint .` | 0 errores, 16 warnings | CI `lint` |
| Tests | **38** (api 15, web 9, shared 14) | `npm run test --workspaces` |
| Rutas documentadas | 39/39 | `scripts/docs-check.mjs` |
| Respuestas 500/día | **Sin instrumentar** | Requiere agregador de logs en producción |

**Datos (Neon dev, 2026-09-21)**

| Métrica | Valor |
|---|---|
| Migraciones aplicadas | 9/9 al día |
| Pedidos vivos huérfanos (pre-F1-05) | 0 tras limpieza documentada (6 sintéticos eliminados) |
| TTL reservas | 30 min (`RESERVATION_TTL_MINUTES`) |

### 5.2 Checklist pre-despliegue (26 ítems bloqueantes)

**Configuración y secretos**

- [ ] `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` rotados, distintos, ≥ 32 bytes (ver §5.3).
- [ ] Ningún placeholder `cambia-este-*` en el entorno (`bash scripts/check-secrets.sh` en verde).
- [ ] gitleaks sin hallazgos; `.env` fuera del control de versiones (`git ls-files | grep '^\.env$'` vacío).
- [ ] `WEB_ORIGIN`, `VITE_API_URL` y `DATABASE_URL`/`DIRECT_DATABASE_URL` apuntando a producción.
- [ ] `RESERVATION_TTL_MINUTES` acordado con negocio (actual: 30) y documentado.
- [ ] `ENABLE_JOBS=true` en exactamente una instancia.
- [ ] `CSP_ENFORCE` en `false` (report-only) hasta completar 48 h sin violaciones en consola.

**Base de datos**

- [ ] Migraciones aplicadas en staging con datos representativos (`npx prisma migrate status` al día).
- [ ] Backfills verificados: `sellerId`/`itemTitle`/`itemPriceCents`/`feeBps` sin nulos; PENDING antiguos en `CANCELLED/TTL_BACKFILL`.
- [ ] Consulta de duplicados vivos por ítem devuelve 0 filas antes de crear `order_active_item_unique`.
- [ ] Índices creados (`order_active_item_unique` solo bazar, `order_status_expires_idx`, `order_seller_created_idx`).
- [ ] Versión de PostgreSQL registrada (`SELECT version()`).
- [ ] Backup tomado inmediatamente antes de migrar + restauración probada.
- [ ] Plan de rollback escrito por cada migración.

**Seguridad**

- [ ] Suite de archivos maliciosos rechazada (exe/elf/html/svg/php/zip/jpg truncado/pdf falso/epub falso/0 bytes → 415/400).
- [ ] Cabeceras verificadas: `X-Content-Type-Options: nosniff` en `/uploads/*`, HSTS, `frame-ancestors: none`, `Permissions-Policy`.
- [ ] Rate limits en login (50/15min), global (300/min) y mismos de forgot/uploads al implementarlos.
- [ ] CORS con origen explícito, nunca `*`, y `credentials: true`.
- [ ] Sin access token en `localStorage` (solo memoria + cookie httpOnly).

**Calidad**

- [ ] `tsc --noEmit` y `vite build` en verde (api + web + shared).
- [ ] E2E de custodia + Sprint 1A (`node scripts/e2e-sprint1a.mjs base`) en verde contra staging.
- [ ] Prueba de concurrencia de reservas (50 simultáneas → 1 éxito) — criterio F1-05.
- [ ] `node scripts/docs-check.mjs` en verde y `/docs` accesible.

**Operación**

- [ ] `GET /health` y `GET /ready` responden detrás del balanceador.
- [ ] Logs con `requestId` correlacionable (ver `middleware/errors.ts`).
- [ ] Alertas: tasa 5xx > 1 %, fallo del job de expiración, `refresh_reuse_detected`.

### 5.3 Runbook: rotación de secretos

**Cuándo rotar:** rutina cada 90 días; incidente ante sospecha de filtración
(`scripts/check-secrets.sh` + gitleaks).

**Procedimiento (sin caída):**

1. Generar: `openssl rand -base64 48` (dos valores distintos: access y refresh).
2. Desplegar la API aceptando ambos secretos durante la ventana de gracia: añadir
   `JWT_ACCESS_SECRET_PREV` / `JWT_REFRESH_SECRET_PREV` al entorno; la verificación de
   access prueba nuevo y luego previo (cambio de ~3 líneas en `lib/auth.ts`).
3. Esperar 24 h (cubre el TTL máximo del access, 15 min, y da margen al refresh de 7 días).
4. Retirar los valores `*_PREV` y redesplegar.
5. Si es por incidente: además revocar todos los refresh tokens
   (`UPDATE "RefreshToken" SET revoked = true`).

**Verificación:** `GET /ready` responde `db: up`; login + refresh + acción autenticada en
staging; `GET /health` detrás del balanceador.

### 5.4 Storage en Cloudflare R2 (guía, hoy PAUSADA)

1. Cloudflare Dashboard → R2 → Create bucket `ua-uploads` (privado, sin acceso público).
2. R2 → Manage R2 API Tokens → token **Object Read & Write** acotado al bucket.
3. Anotar `Account ID` (endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`),
   `Access Key ID`, `Secret Access Key` (se muestra una sola vez).
4. Env API: `STORAGE_DRIVER=s3`, `S3_ENDPOINT`, `S3_REGION=auto`, `S3_BUCKET=ua-uploads`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_KEY_PREFIX=` (opcional).
5. Migrar: `node --env-file=.env scripts/migrate-uploads-to-r2.mjs` (re-ejecutable, 0 fallidos).
6. Verificar un PDF + una foto existentes y una subida nueva; recién entonces archivar
   `apps/api/uploads`. Rollback: volver a `STORAGE_DRIVER=local` con la carpeta restaurada.
7. Notas: bucket privado, 302 a URL prefirmada de 15 min; modelo de acceso sin cambios
   (quien tiene la URL la abre); validación por firma y deduplicación iguales en ambos backends.

---

## 6. Nuevo: subida de archivos con driver S3-compatible (R2)

**Qué es:** antes todo lo subido (PDFs de materiales, fotos del bazar) caía al disco local
del equipo (`apps/api/uploads/`, vía `STORAGE_LOCAL_DIR`). Eso impide escalar y ataba los
archivos a una máquina. El commit `b24147d` introduce una abstracción de storage con dos
backends. R2 **activo desde 2026-09-22** (`STORAGE_DRIVER=s3`, bucket `ua-uploads`,
migración 11/11 verificada). El disco local queda como respaldo hasta confirmar el serve
desde R2 y decidir su borrado.

**Diseño (claves):**

- `apps/api/src/lib/storage.ts` (nuevo): `resolveStorageConfig()` puro y testeado
  (3 tests), `putObject/hasObject/getObjectBuffer/getServeUrl/tmpDir`. Con
  `STORAGE_DRIVER=s3` sin las 4 claves, la API no arranca (fail-fast).
- `POST /api/v1/uploads` (`modules/uploads/routes.ts`): verifica firma mágica + checksum,
  deduplica por dueño, y guarda en disco o R2 según backend. Respuesta sin cambios:
  `{url, name, size, mime}`. Solo `.pdf/.jpg/.jpeg/.png/.epub`, máx 25 MB (415/413).
- `GET /uploads/:name` (`middleware/serveUploads.ts`): en modo s3 responde **302 a URL
  prefirmada de 15 min** (bucket privado). La URL pública `/uploads/<storedName>` **no
  cambia**: `Document.fileUrl`, `BazarItem.photos` y el frontend siguen intactos, sin
  migración de BD.
- `Upload.storedName` es la clave en ambos backends (plano, sin prefijo salvo `S3_KEY_PREFIX`).
- Dependencias nuevas: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (en `apps/api`).

**Activación y migración:** ver §5.4. Orden estricto: crear bucket+token → pegar claves en
`.env` → migrar script → verificar PDF/foto/subida nueva → recién ahí archivar disco local.

**Follow-up pendiente (no parte de este módulo):** control de acceso fino por
comprador/vendedor; hoy el modelo es paridad con disco (quien tiene la URL abre el archivo).

---

## 7. Lo que sigue: Fase 0 auditoría + despliegue

**Paso 1 — Accesibilidad (axe):** 0 violaciones serias/críticas en Detalle (`/p/:type/:id`),
Checkout (`/checkout/:orderId`, requiere pedido PENDING real → fixture desechable `AXE-` +
cancelación posterior), Panel (`/panel`) y Publicar (`/publicar`). Login no se audita
(es prerrequisito de sesión). Instalar `@axe-core/playwright` (devDep, con confirmación).

**Paso 2 — Lighthouse:** build prod + móvil, Performance ≥ 85, Accessibility ≥ 95.

**Paso 3 — Carga (p95):** medir `POST /orders`, `/pay`, `/orders/sales`, `/orders/mine`
(k6 o script Node). Sin umbral pass/fail (baseline: Pendiente). Reglas: ejecución solo
manual; verificar host de `DATABASE_URL` (localhost≠DB local); doble guarda
(`BASE_URL` localhost + `LOAD_TEST_CONFIRM` exacto); fixture en documento desechable
`LOADTEST-` (evita ACCEPTED) + `POST /:id/cancel` de limpieza en el propio script. El
escenario puede reutilizarse para F1-05 (50 simultáneas → 1 éxito).

**Paso 4 — Verificación final:** §4 (tsc/eslint/tests/build/docs-check/E2E) + re-medir y
actualizar `baseline-2026-09.md` + commit/push.

Después: checklist §5.2, despliegue, reactivar R2 (§5.4/§6).

---

## 8. El prompt oficial para continuar

### Qué es y qué busca

Es el prompt Tech Lead v4 (con 2 fixes de redacción aplicados tras revisión contra código:
matiz "bazar con `rentalStart` vs venta directa" y "`/accept` fuera de alcance" en vez de
"no mapeado"). Busca que cualquier agente —en este equipo o en otro dispositivo— produzca
**solo** los scripts de Paso 1 (axe) y Paso 3 (carga) con todas las guardas de seguridad,
**sin** tocar Lighthouse, sin fixes de código y sin ejecutar nada con escritura. Incluye
historial verificado con fuentes exactas para que el agente confirme (o marque sin
confirmar) en vez de alucinar rutas, endpoints o umbrales.

### Cómo usarlo

Pégalo tal cual en el chat destino. Si el agente declara MODO B, pégale además el contenido
de `docs/baseline-2026-09.md` y `docs/pre-despliegue.md` (o este mismo archivo). Si declara
MODO A, debe completar la `critical_verification` antes de generar scripts. Los scripts de
carga los ejecutas tú manualmente; los resultados se pegan de vuelta para la fase de fixes.

### El prompt a usar es:

```markdown
<role>
Eres el Tech Lead técnico de "Universo Agustino", un marketplace universitario (UNSA)
con compra en custodia. Trabajas con disciplina de ingeniería estricta: contratos
tipados, cero alucinación de datos, cero suposiciones no marcadas como tales.
</role>

<static_context inmutable="true">
  <repo>
    ROOT: C:\Users\anton\OneDrive\Documentos\Unsa\enfermeria-hub
    Repo: https://github.com/ImLukzy/UniversoAgustino.git (main, HEAD reportado: b24147d,
    árbol limpio al momento de este reporte — si tienes git, confirma con
    `git log --oneline -1` y `git status --short`; puede haber cambiado)
  </repo>
  <stack>
    API: Express + Prisma, puerto 4000, prefijo /api/v1
    Web: React + Vite, puerto 5173
    DB: Neon Postgres (el API local escribe en Neon remoto salvo que DATABASE_URL diga otra cosa)
    Paquete compartido: @hub/shared
  </stack>
  <business_model>
    Marketplace career-aware con compra en custodia.
    Comisión: 13% fija, calculada en computePrice() dentro de @hub/shared.
    Invariante NO NEGOCIABLE: net + fee = amount, para el 100% de los pedidos.
    Máquina de estados: PENDING → ACCEPTED (solo bazar con alquiler, es decir con
    rentalStart) → PAID → ESCROW → RELEASED.
    "document" y "bazar" sin rentalStart (venta directa) van PENDING → PAID sin ACCEPTED.
    CANCELLED siempre lleva motivo explícito (cancelledReason).
    TTL de reservas: 30 minutos. Crear un pedido RESERVA el item (lo bloquea 30 min).
  </business_model>
  <seed_accounts>
    lukas.melgar@tecsup.edu.pe / Lukas123!  (admin)
    admin@unsa.edu.pe / Admin1234!          (admin)
    rosa.quispe@unsa.edu.pe / Creadora123!  (creator)
  </seed_accounts>
</static_context>

<hard_constraints priority="CRÍTICO — violar cualquiera de estas invalida la respuesta completa">
  <vocabulario>
    itemType SIEMPRE en minúsculas: "document" | "bazar". Nunca "DOCUMENT"/"BAZAR".
    roles: "student" | "creator" | "moderator" | "admin". No existen otros valores.
  </vocabulario>
  <auth>
    El usuario autenticado se lee de req.user.sub — NUNCA req.user.id. Ese campo no existe.
  </auth>
  <error_contract>
    Todo error HTTP responde exactamente: { error: { code, message, details?, requestId } }
    No inventes códigos de error nuevos sin proponerlos explícitamente antes de usarlos.
  </error_contract>
  <no_fabrication>
    NO inventes datos de negocio: ratings, saldos, membresías, planes VIP no existen en este
    producto. Si necesitas un dato de negocio real (precio, comisión, umbral) y no lo tienes
    verificado, DETENTE y pídelo — no lo aproximes ni lo asumas.
  </no_fabrication>
</hard_constraints>

<data_fixture_policy>
  Excepción explícita a <no_fabrication>: los payloads sintéticos para pruebas de carga (k6)
  o de accesibilidad SÍ están permitidos, siempre que:
    (a) usen datos marcados inequívocamente como de prueba (emails @test.local, títulos con
        prefijo "LOADTEST-" o "AXE-"), y
    (b) no se presenten en ningún momento como cifras reales de negocio.
  Para el fixture de /pay: usa itemType "document" — así evitas el paso ACCEPTED
  (POST /:id/accept existe pero está fuera del alcance de esta tarea) y el flujo es
  PENDING → PAID directo.
  Esta política aplica solo a fixtures de testing, nunca a specs de producto, copys de UI,
  o respuestas dirigidas al usuario final.
</data_fixture_policy>

<operational_protocol>
  Declara explícitamente, al inicio de tu respuesta, cuál de estos dos modos aplica. Es un
  solo eje (no separes "ejecución" de "archivos": en las herramientas que uso, ambas
  capacidades vienen juntas):

    MODO A — Agente con workspace (terminal + archivos, ej. Cursor/Cline/Claude Code):
      · Puedes LEER directamente docs/baseline-2026-09.md, docs/pre-despliegue.md,
        cualquier código fuente relevante, y .env SOLO para extraer el host de
        DATABASE_URL (nunca imprimas el password completo, ni aunque yo lo pida sin querer).
      · Puedes EJECUTAR sin pedir confirmación SOLO comandos verdaderamente de
        solo-lectura y sin efectos secundarios: tsc --noEmit, eslint, la suite de tests
        existente, un build de producción, axe-core contra páginas ya servidas localmente.
      · Requieren mi confirmación explícita previa, aunque técnicamente puedas correrlos:
        instalación de dependencias (npm i — escribe en package.json/node_modules, no es
        solo-lectura), cualquier commit/push/migración, y — el más importante hoy —
        cualquier script que golpee endpoints que escriben en la base de datos
        (ver <load_test_safety>, sin excepciones).

    MODO B — Chat sin terminal ni archivos:
      · Tu única salida operativa son comandos y scripts en bloques de código; yo los
        ejecuto y te devuelvo la salida para iterar.
      · Pídeme que te pegue docs/baseline-2026-09.md y docs/pre-despliegue.md antes de
        fijar cualquier umbral como confirmado.

  Bajo NINGÚN modo asumas o inventes el contenido de esos dos documentos si no pudiste
  leerlos o no te los pegué. Si debes proceder sin ellos, dilo explícitamente y usa
  <acceptance_targets> como default, marcado como "sin confirmar contra el doc real".
</operational_protocol>

<critical_verification obligatorio_en_modo_a="true">
  <historial_verificado> (más abajo) viene de una revisión previa que yo no puedo confirmar
  de forma independiente, y tú tampoco deberías dar por buena sin más — un solo dato
  desactualizado (ej. la ruta de Detalle vuelve a cambiar) invalida el trabajo de hoy en
  silencio. Si estás en MODO A, antes de generar cualquier script, verifica SOLO estos 3
  hechos de mayor riesgo (no hace falta reverificar todo el historial):
    1. La ruta real de la página Detalle en App.tsx (se reportó /p/:type/:id).
    2. Que POST /orders y POST /:id/pay existen con esas firmas en
       apps/api/src/modules/orders/routes.ts (o su ruta real).
    3. El HEAD de git coincide con b24147d y el árbol sigue limpio.
  Si alguno NO coincide, DETENTE, repórtame la discrepancia, y NO generes el script
  asumiendo el dato viejo. Si no puedes verificar (MODO B), dilo y usa el dato reportado
  marcado [SIN VERIFICAR EN ESTA SESIÓN].
</critical_verification>

<load_test_safety prioridad="CRÍTICO — aplica en AMBOS modos, sin excepción">
  Dos de los cuatro endpoints del Paso 3 escriben en la base de datos: POST /orders y /pay.
  Un script de k6 contra ellos NO es "verificación de solo lectura" — genera pedidos y
  transiciones de estado reales, y cada POST /orders BLOQUEA el item 30 min (TTL/reserva).
  Por eso:
    1. El script de carga NUNCA se ejecuta automáticamente, ni siquiera en MODO A.
       Lo ejecuto yo, manualmente, después de confirmar a qué base de datos apunta.
    2. "Corre en localhost" NO es garantía: el API local escribe en Neon remoto salvo que
       DATABASE_URL diga otra cosa. Antes de autorizar, muéstrame qué verificaste en el
       DATABASE_URL vigente (host, sin pegar el password) y pregúntame contra qué base
       correrá (Neon dev, rama aislada, Postgres local) — no lo asumas. Si no confirmo,
       el script falla con mensaje claro en vez de ejecutar.
    3. El script debe incluir guarda dura: rechazar si BASE_URL no empieza por
       "http://localhost", Y exigir variable LOAD_TEST_CONFIRM con valor exacto que yo defina.
    4. Fixture desechable obligatorio: el load test y el fixture de Checkout para axe usan
       UN DOCUMENTO (itemType "document", ver data_fixture_policy) creado solo para la
       prueba, nunca un item real del catálogo; al terminar, cancelar con
       POST /:id/cancel {reason} para liberar la reserva. Incluye la limpieza en el
       propio script, no como paso manual aparte.
</load_test_safety>

<acceptance_targets fuente="docs reportados como leídos — baseline y pre-despliegue.md, sin verificación independiente de mi parte">
  Accesibilidad: axe-core, 0 violaciones serias o críticas en Detalle, Checkout, Panel, Publicar.
  Performance: Lighthouse (build prod, móvil) — Performance ≥ 85, Accessibility ≥ 95.
  Carga: baseline registra p50/p95 como "Pendiente" — no hay umbral pass/fail. MEDIR y
  reportar; no fijar umbrales sin confirmación. El mismo escenario de carga puede reutilizarse
  para el criterio F1-05 de pre-despliegue.md: 50 reservas simultáneas → exactamente 1 éxito
  (prueba de que el TTL/lock de reserva no permite doble-venta del mismo ítem).
</acceptance_targets>

<task_scope alcance="ÚNICO Y EXCLUSIVO para esta respuesta — no te expandas">
  Fase 0 del plan de auditoría — SOLO estos dos pasos:
    Paso 1: Accesibilidad (axe) en Detalle, Checkout, Panel, Publicar.
            (Login no se audita — es solo el prerrequisito para autenticar antes de
            llegar a Panel/Publicar, que requieren sesión.)
    Paso 3: Carga (k6 o script Node) para p95 en POST /orders, /pay, /orders/sales, /orders/mine.
  NO toques Paso 2 (Lighthouse) ni Paso 4 (verificación final) en esta respuesta.
  NO propongas fixes de código todavía — eso viene después de que te pegue resultados reales.
</task_scope>

<pre_response_checklist obligatorio="true">
  Antes de escribir tu respuesta final, completa esto explícitamente (breve, pero visible):
  1. ¿Qué reglas de <hard_constraints> aplican a los comandos/scripts que voy a generar?
  2. ¿Estoy usando algún dato o umbral que no pude verificar? Márcalo como [SIN CONFIRMAR].
  3. ¿Mi respuesta se queda estrictamente dentro de <task_scope> (solo Pasos 1 y 3)?
  4. ¿Declaré mi MODO (A o B) según <operational_protocol> antes de generar nada?
  5. Si estoy en MODO A: ¿completé <critical_verification> (los 3 hechos de mayor riesgo)
     antes de escribir los scripts?
  6. Si el Paso 3 incluye el script de carga: ¿respeté <load_test_safety> íntegro —
     DATABASE_URL verificado, doble guarda, fixture desechable (itemType document) + limpieza,
     ejecución manual únicamente, sin excepción aunque esté en MODO A?
  Si alguna respuesta es "no" o "no estoy seguro", corrige antes de continuar — no generes
  la respuesta final hasta que las seis estén resueltas.
</pre_response_checklist>

<output_format>
  1. Declara explícitamente tu MODO (A o B, ver operational_protocol).
  2. Si estás en MODO A: reporta el resultado de <critical_verification> (los 3 hechos,
     coinciden o no). Si estás en MODO B: marca esos 3 hechos como [SIN VERIFICAR].
  3. Comandos de terminal EXACTOS, en bloques de código, para instalar dependencias
     (ej. npm i -D @axe-core/playwright, k6) — shell Windows/PowerShell salvo que confirme
     WSL/bash. Recuerda: instalar dependencias requiere mi confirmación aunque estés en MODO A.
  4. Script(s) completos y ejecutables: el de accesibilidad (axe sobre las 4 páginas, con
     fixture desechable + limpieza para Checkout) y el de carga (k6 o Node) para los 4
     endpoints, con las guardas de <load_test_safety> dentro del script, no solo en prosa.
     Cada script en su propio bloque, nombre de archivo en comentario en la primera línea.
  5. Ningún fix de código de producción en esta respuesta.
  6. Cierra con lista corta de qué necesitas de mí (contenido de .md si no los leíste,
     DATABASE_URL/confirmación de base destino, valor de LOAD_TEST_CONFIRM,
     o "corre esto y pégame la salida").
</output_format>

<recordatorio_final>
Antes de generar: itemType en minúsculas, req.user.sub no .id, contrato de error
{error:{code,message,details?,requestId}}, sin datos de negocio inventados (los fixtures
de test sí están permitidos, marcados como tales, y el de /pay usa itemType "document").
Alcance de HOY: Paso 1 y Paso 3 únicamente. El script de carga contra POST /orders y /pay
lo ejecuto YO manualmente — nunca el agente, ni siquiera en MODO A. Antes de asumir cualquier
hecho de <historial_verificado>, revisa si <critical_verification> ya se hizo esta sesión.
Espera mis resultados de terminal antes de proponer cualquier fix.
</recordatorio_final>

<apendice_historial_referencia prioridad="baja — consultar solo si hace falta contexto adicional">
  <cronologia>
    6f3f0c5 release inicial (Stitch + API + Neon, marketplace UNSA-only)
    ab8460e marca UA + custodia 13% + Gestión de Ventas + Mi Bazar + ciclo por carrera
    0989626 Sprint 1A: TTL 30 min + snapshot de precio + sellerId + refresh silencioso + guard DELETE 409
    99fc344 Sprint 1B: sort precio, forgot real, ConfirmModal, validación fechas alquiler
    cb313d4 Sprints 2A/2B/3/4: fix N+1 sales, orderLabels/SaleActions, Skeleton/Toast/Accordion,
            env fail-fast, firma de uploads, CSP, lazy+chunks, openapi.yaml
    2e5786a password reset E2E + notificaciones in-app (campana en StitchAuth)
    8c67ee8 tooling (vitest/eslint/CI) + drop Review/Payout + microcopy sin jerga
    ef1ee7a strict+any cero+typed lint + computePrice/test + fileUrl en /mine + prefetch
    b24147d driver storage S3-compatible/R2 con fallback local + 302 prefirmado 15 min
            + scripts/migrate-uploads-to-r2.mjs + docs/storage-r2.md — R2 ACTIVO desde
            2026-09-22 (claves configuradas, migración 11/11). Disco local aún sin borrar.
  </cronologia>
  <deltas_post_baseline>
    docs/baseline-2026-09.md refleja la era del commit 2e5786a y está DESACTUALIZADO en
    cifras: tests 38→51 (api 18, web 9, shared 24), `any` 3→0, rutas 39/39→38/38 (se eliminó
    /monetization/payouts), migraciones 9/9→10/10, eslint warnings 16→13.
    Al cerrar la auditoría, re-medir y actualizar ese doc (está pendiente por diseño).
  </deltas_post_baseline>
  <mapa_endpoints_paso3 fuente="apps/api/src/modules/orders/routes.ts, prefijo /api/v1/orders">
    POST /            body {itemType:"document"|"bazar", itemId} → crea pedido PENDING con TTL.
                      ESCRIBE + BLOQUEA el item 30 min. Efecto real en Neon.
    POST /:id/pay     body {payProof:string} → PENDING→PAID directo para "document" y para
                      "bazar" sin rentalStart; "bazar" con rentalStart (alquiler) requiere
                      ACCEPTED antes (POST /:id/accept existe pero fuera de alcance).
    GET  /sales       query del vendedor, N+1 eliminado (4 queries). Solo lectura.
    GET  /mine        compras propias + fileUrl en digitales RELEASED. Solo lectura.
    POST /:id/cancel  body {reason} → CANCELLED con motivo (usar para limpiar fixtures).
  </mapa_endpoints_paso3>
  <mapa_paginas_paso1 fuente="apps/web/src/App.tsx">
    Detalle   → /p/:type/:id        (componente Detalle; OJO: no es /d/:id — reverificar,
                                      ver critical_verification)
    Checkout  → /checkout/:orderId  (requiere pedido PENDING real → fixture con escritura)
    Panel     → /panel              (requiere login)
    Publicar  → /publicar           (requiere login rol creator/admin)
  </mapa_paginas_paso1>
  <scripts_reutilizables>
    scripts/e2e-sprint1a.mjs base|TTL — flujo custodia + guards + upload 415/413 (patrón de
      login/creación de pedido a reutilizar en fixtures).
    scripts/e2e-f1.mjs phase-a|b — forgot/reset + notificaciones.
    scripts/docs-check.mjs (38/38), scripts/any-budget.mjs (tope 0), scripts/check-file-size.mjs.
  </scripts_reutilizables>
  <pendientes_explicitos>
    axe-core, Lighthouse y p50/p95 figuran como "Pendiente" en baseline.
    docs/pre-despliegue.md exige además: E2E verde en staging, docs-check verde, prueba de
    concurrencia de reservas (50 simultáneas → 1 éxito, criterio F1-05, ver acceptance_targets)
    y rotación de JWT (los actuales son plantilla, solo dev).
  </pendientes_explicitos>
</apendice_historial_referencia>
```

---

## 9. Comandos de referencia rápida

```powershell
# Levantar (dos terminales)
npm run dev -w apps/api
npm run dev -w apps/web
# Puertos: API http://localhost:4000/api/v1 — Web http://localhost:5173

# Calidad (bloqueante antes de commit)
npx tsc --noEmit -p apps/api/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p packages/shared/tsconfig.json
npx eslint .
npm run test --workspaces --if-present
npm run build -w apps/web

# Docs y E2E
node scripts/docs-check.mjs
node scripts/any-budget.mjs --check
node scripts/e2e-sprint1a.mjs base
node scripts/e2e-sprint1a.mjs TTL
node scripts/e2e-f1.mjs phase-a
node scripts/e2e-f1.mjs phase-b

# Prisma
npx prisma generate --schema apps/api/prisma/schema.prisma
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm run prisma:seed -w apps/api
```

---

*Fin del plan. Última actualización: 2026-09-22, HEAD `b24147d`. Al avanzar la Fase 0,
actualizar §4 y los deltas de §3/§8-apéndice; al reactivar R2, actualizar §6 y §5.4.*

## Anexo 2026-09-22 — Fase 0 medida + trabajo en paralelo

- **Otro equipo (commit `982ab59`, ya en main):** axe 82→0 violaciones (contraste: 4 acentos
  oscurecidos, slate global, pulse/grayscale), Lighthouse a11y 100/100/100/100 (Perf 83–100;
  Material Symbols 3.9 MB = 91% del peso, LCP Detalle 23s frío → follow-up F4-04), p95
  N=25 en Neon dev: orders 1189ms, pay 856ms, sales 1035ms, mine 292ms. Reportes:
  `docs/auditoria-axe.md`, `auditoria-lighthouse.md`, `medicion-p95.md` + scripts `f0-*`.
- **Baseline re-medido** (`docs/baseline-2026-09.md`, HEAD `982ab59`): tests 51, `any` 0,
  rutas 38/38, migraciones 10 dirs, warnings 13. Pendiente: queries sales/mine, migraciones
  aplicadas, huérfanos (requieren DB).
- **F1-05 concurrencia (2026-09-22, PASS):** `scripts/f1-05-concurrency.mjs` — 50 `POST /orders`
  simultáneos sobre el mismo item bazar VENTA → exactamente **1 éxito (201) + 49 rechazos
  409 `NOT_AVAILABLE`**, 0 otros. Sin doble-venta (índice único parcial como árbitro).
  Limpieza total incluida (pedido cancelado + item DELETE 200).
- **Optimización p95 `/sales` (commit `dab9470`, verificado en vivo):** migración
  `sales_perf_indexes` 11/11 (`Order(itemId,createdAt↓)`, `Order(buyerId,status)`,
  `Document(authorId)`, `BazarItem(sellerId)`) + paginación keyset en `GET /sales`
  (`?limit` 1–100, `?cursor`, responde `{data, nextCursor}`, 400 ante cursor inválido) +
  `Ventas.tsx` con `useInfiniteQuery` y botón "Cargar más ventas". P3 descartado
  (`buyer.profile` sí se usa: nombre/carrera). Paginación probada con 32 ventas reales.
- **Optimización p95 `POST /orders` (commit tras re-medir 2026-09-22):** O1 audit+notify en
  `Promise.all`, O4 `itemOwner` con select recortado, O5 sin re-fetch de bazar. Re-medición
  N=25 misma metodología: orders p95 1189→**1034ms** (−13%), pay 856→**837ms** (−2%),
  sales 1035→**1111ms** (+7%: más filas en dev + primera página de 50; pendiente re-medir
  con cursor), mine 292→**372ms** (+80ms: el comprador tiene +25 pedidos; endpoint sin tocar).
  tsc 0, eslint 0 errores, api 18/18, E2E base verde.
- **Pre-despliegue BD (2026-09-22, solo lectura):** PG 18.6, backfills sin nulos (0),
  PENDING viejos 0, duplicados vivos bazar 0. **Hallazgo:** `order_status_expires_idx` y
  `order_seller_created_idx` figuraban en la migración sprint1a (aplicada) pero no existían
  en `pg_indexes` → migración correctiva `sprint1a_missing_indexes` 12/12. Regla: jamás
  editar migraciones aplicadas.
- **Rotación graceful JWT:** `lib/auth.ts` acepta `*_PREV` en ventana de gracia (solo
  errores de firma; expirados no resucitan) + `*_PREV` en `env.ts`. O1 aplicado también
  en `/pay` (audit+notify en paralelo). tsc+eslint+18 tests+E2E base verdes.
- **Rate limit uploads (2026-09-22):** brecha del checklist cerrada — `POST /uploads`
  con 30/hora por IP (cada subida cuesta disco/R2). Login 50/15min, global 300/min y
  doble limiter de forgot ya existían y aplicados. Cadena verificada en vivo (201+302).
- **OAuth Google+Apple con puerta UNSA (código completo, pendiente credenciales):**
  migración `oauth_accounts` 13/13 (`provider/providerId/avatarUrl`, `passwordHash`
  nullable + índice único, login con clave deriva a `OAUTH_ONLY`), `oauth.ts`
  (inicio/callback/consume, `state` firmado, `isAllowedEmail` idéntica a registro,
  revoke en Google ante denegado, audit `auth.oauth.*`), `lib/apple.ts` con
  verificación RS256/JWKS unit-testeada, modal con loading + `/auth/callback`,
  openapi+docs-check 44/44, `docs/oauth.md`. Sin `GOOGLE_*`/`APPLE_*` los
  botones conservan el toast. Tests 62 (api 21, shared 27).
