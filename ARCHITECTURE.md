# Wawki Arequipa — Plan de Arquitectura Profesional (localhost-first)

> Fecha: 2026-09-08 · Estado: v0.1 scaffold localhost · Objetivo: arquitectura 100% profesional, modular y desplegable.

## 1. Lo existente (inventario real)

Ruta base: `stitch_enfermer_ahub_arequipa_marketplace/`

| # | Carpeta | Contenido | Rol en producto final |
|---|---------|-----------|----------------------|
| 1 | `marketplace_de_apuntes_y_gu_as_pae/` | `code.html` (54 KB) + `screen.png` — marketplace de apuntes, guías PAE, balotarios UNSA/UCSM | → Ruta frontend `/` (catálogo) + módulo backend `documents` |
| 2 | `bazar_y_alquiler_de_libros_y_scrubs/` | `code.html` (55 KB) — economía circular, escrow académico, alquiler | → Ruta `/bazar` + módulos `bazar` + `escrow/orders` |
| 3 | `portal_de_monetizaci_n_y_calculadora/` | `code.html` (59 KB) — calculadora de ingresos, onboarding creator | → Ruta `/monetiza` + módulo `monetization/payouts` |
| 4 | `marco_legal_y_tica_acad_mica_d.l._822/` | `code.html` (50 KB) — D.L. 822, takedown, FAQ | → Ruta `/legal` + módulo `moderation/reports` + `audit` |
| 5 | `modern_clinical_warmth/` | `DESIGN.md` — design system (teal #00685F, periwinkle #4648D4, Plus Jakarta Sans + Inter) | → `apps/web/src/styles/tokens.css` + `tailwind.config.js` |

**Diagnóstico:** son 4 prototipos estáticos TailwindCDN (sin build, sin estado, sin backend, sin auth, sin DB, sin validación, sin tests). No hay `package.json`, ni API, ni persistencia. El plan los convierte en app real manteniendo el diseño.

## 2. Arquitectura objetivo

```
                    ┌──────────────────────────────┐
                    │        apps/web (Vite+React) │
                    │  /  /bazar  /monetiza /legal │
                    │  TanStack Query + Router     │
                    └──────────────┬───────────────┘
                                   │ HTTPS/JSON  VITE_API_URL
                                   ▼
                    ┌──────────────────────────────┐
                    │   apps/api (Express+TS)      │
                    │  /api/v1/*  OpenAPI+Swagger  │
                    │  helmet/cors/rate-limit/zod  │
                    │  JWT access+refresh (httpOnly)│
                    └───┬──────────────┬───────────┘
                        │              │
              ┌─────────▼──────┐ ┌─────▼──────┐   ┌──────────────┐
              │ Postgres 16    │ │ Redis 7    │   │ Storage local│
              │ (Prisma ORM)   │ │ (cache +   │   │ ./uploads →  │
              │ dominio + audit│ │  rate-limit)│   │  S3 en prod  │
              └────────────────┘ └────────────┘   └──────────────┘
```

**Estilo:** monolito modular (no microservicios prematuros). Cada dominio es un módulo con `routes → controller → service → repo(prisma) → schema(zod)`. Se extrae a servicio solo cuando escale (pagos, búsqueda).

**Monorepo npm workspaces:**
```
enfermeria-hub/
  apps/api/          # backend
  apps/web/          # frontend
  packages/shared/   # tipos + esquemas + constantes (contrato único FE/BE)
  docs/              # openapi, decisiones (ADR)
  docker-compose.yml # postgres + redis + mailhog
```

## 3. Stack y por qué

| Capa | Elección | Motivo profesional |
|------|----------|-------------------|
| FE | Vite 5 + React 18 + TS + Tailwind + React Router + TanStack Query + Axios | build rápido localhost, tipado total, caché server-state, migración directa de los `code.html` |
| BE | Node 20+ + Express 4 + TS (`tsx`) + Zod + Prisma | simple de levantar, validación runtime, ORM con migraciones auditables |
| Auth | JWT access 15m + refresh 7d httpOnly + bcryptjs, roles `student/creator/moderator/admin` | stateless, seguro XSS/CSRF, RBAC por ruta |
| DB | Postgres 16 (Docker) | relacional real para escrow/transacciones; SQLite solo fallback |
| Cache/Jobs | Redis 7 (ioredis, opcional en dev) | rate-limit, sesiones refresh, cola payouts |
| Docs API | OpenAPI 3 + swagger-ui `/docs` | contrato testeable |
| Calidad | ESLint + Prettier + Vitest + Husky (pre-commit) | estándar profesional |
| Observ. | pino/morgan + `/health` + `/ready` + AuditLog tabla | diagnóstico localhost y auditoría legal D.L. 822 |

## 4. Modelo de datos (Prisma, simplificado)

```
User(id, email!, passwordHash, role, createdAt)
Profile(userId!, fullName, university[UNSA|UCSM|OTRA], cycle, hospital, cepCode?, cepVerified)
Document(id, authorId, title, course, university, cycle, type[APUNTE|PAE|BALOTARIO|GUIA], priceCents, fileUrl, status[DRAFT|REVIEW|PUBLISHED|TAKEDOWN], createdAt)
BazarItem(id, sellerId, kind[LIBRO|SCRUB|INSTRUMENTO], tx[VENTA|ALQUILER], priceCents, depositCents?, status[AVAILABLE|RESERVED|SOLD|RENTED])
Order(id, buyerId, itemType, itemId, amountCents, feeCents, netCents, status[PENDING|ESCROW|RELEASED|REFUNDED|CANCELLED])
Escrow(orderId!, holder, releasedAt?)  // custodia académica: libera a 48h o entrega confirmada
Payout(id, creatorId, period, grossCents, feeCents, netCents, status)
Report(id, reporterId?, targetType, targetId, reason, status[OPEN|ACTIONED|DISMISSED]) // D.L.822 takedown
Review(id, authorId, targetType, targetId, stars, comment)
AuditLog(id, actorId?, action, entity, entityId, meta, createdAt)
RefreshToken(id, userId, hash, expiresAt, revoked)
```

Cálculos dinero en **céntimos** (`priceCents`), comisión `PLATFORM_FEE_PCT=13%`. Calculadora del portal = endpoint puro, sin DB.

## 5. Diseño de APIs (`/api/v1`)

| Módulo | Endpoints |
|--------|-----------|
| `GET /health`, `GET /ready` | liveness / readiness (db+redis ping) |
| auth | `POST /auth/register` `POST /auth/login` `POST /auth/refresh` (cookie) `POST /auth/logout` `GET /auth/me` |
| users | `GET /users/me` `PATCH /users/me` `GET /users/:id/public` |
| documents | `GET /documents?university=&course=&q=&page=` `POST /documents` (creator) `GET /documents/:id` `PATCH /documents/:id` `POST /documents/:id/publish` `POST /documents/:id/takedown` (mod) |
| bazar | `GET /bazar?kind=&tx=&q=` `POST /bazar` `PATCH /bazar/:id` `POST /bazar/:id/reserve` |
| orders/escrow | `POST /orders` `GET /orders/mine` `POST /orders/:id/confirm-receipt` `POST /orders/:id/release` (mod/sys) `POST /orders/:id/refund` |
| monetization | `POST /monetization/simulate` `{avgPrice, salesPerMonth, bazarExtra}` → `{gross, fee, net}` · `GET /payouts/mine` |
| moderation | `POST /reports` `GET /reports` (mod) `POST /reports/:id/action` + `GET /legal/summary` |
| uploads | `POST /uploads/presign` → local path (dev) / S3 URL (prod) |

Contrato de errores uniforme: `{ error: { code, message, details? } }`. Paginación: `{ data[], page, pageSize, total }`.

Docs vivas: `http://localhost:4000/docs` (Swagger UI).

## 6. Frontend (rutas ↔ prototipos)

| Ruta | Origen Stitch | Componentes nuevos |
|------|---------------|-------------------|
| `/` marketplace | `marketplace_de_apuntes.../code.html` | `DocumentCard`, `FiltersBar` (uni/curso/ciclo), `PriceTag`, fetching `GET /documents` |
| `/bazar` | `bazar_y_alquiler.../code.html` | `BazarCard`, `EscrowStepper` (reserva→custodia→liberación), `DepositBadge` |
| `/monetiza` | `portal_de_monet.../code.html` | `CalculatorForm` → `POST /monetization/simulate`, `PublishWizard` (3 pasos) |
| `/legal` | `marco_legal.../code.html` | `TakedownForm` → `POST /reports`, `DecalogueList`, FAQ |
| `/auth/*`, `/cuenta`, `/admin` | nuevo | login/registro, perfil CEP, panel moderación |

Tokens de `DESIGN.md` → `tailwind.config.js` (`primary #00685F`, `secondary #4648D4`, fuentes Jakarta/Inter) + CSS vars. Los `code.html` originales se guardan en `apps/web/legacy/` como referencia y se migran por secciones (no iframe en prod).

## 7. Seguridad / legal (D.L. 822 Perú)

- Helmet + CORS allowlist (`WEB_ORIGIN`) + rate-limit login/uploads.
- Zod en borde (body/query/params), Prisma parametrizado (anti-SQLi), bcrypt 12 rounds.
- JWT secret ≥32 chars, refresh rotado + revocable (tabla), cookies `HttpOnly; SameSite=Lax; Secure` en prod.
- Uploads: allowlist pdf/epub/jpg/png, máx 25 MB, scan MIME + antivirus en prod (ClamAV), nunca ejecutar.
- Takedown <48h: `Report` → mod oculta (`TAKEDOWN`) → `AuditLog` inmutable → contra-notificación.
- Datos sensibles (CEP, hospital): minimización + RBAC; logs sin passwords/tokens.

## 8. Levantar en localhost (2 modos)

**A. Full profesional (recomendado, Docker):**
```bash
cp .env.example .env
docker compose up -d postgres redis      # o npm run db:up
npm install
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
npm run dev                              # api :4000 + web :5173
```
URLs: web http://localhost:5173 · api http://localhost:4000/api/v1 · docs http://localhost:4000/docs · health http://localhost:4000/health · mail http://localhost:8025

**B. Sin Docker (emergencia):** `DATABASE_URL="file:./dev.db"` + `npm run dev:api/dev:web`. Redis opcional (degrada a memoria).

## 9. Calidad profesional incluida en scaffold

- ESLint + Prettier por workspace, `tsc --noEmit` en build.
- Vitest: test ejemplo `simulate.test.ts` (calculadora) + `health.test.ts`.
- Seed con demo: admin, creator UNSA, 6 apuntes, 4 bazar items, 1 payout ejemplo.
- `docs/openapi.yaml` como espejo del Swagger + ADRs futuros.
- Husky + lint-staged (pre-commit) — activar con `npx husky init` cuando sea git repo.
- CI lista: `.github/workflows/ci.yml` (instalable cuando crees el repo remoto).

## 10. Roadmap (tras localhost)

1. M1 (esta entrega): scaffold + auth + documents/bazar CRUD + simulate + legal reports + Swagger.
2. M2: uploads reales (S3/MinIO presigned), checkout Yape/Plin manual con evidencia + escrow 48h job.
3. M3: búsqueda full-text (pg_trgm/meili), reviews, notificaciones mail, panel mod.
4. M4: gateway pago (MercadoPago/Niubiz), app móvil (mismo API), observabilidad (Sentry/OpenTelemetry).
