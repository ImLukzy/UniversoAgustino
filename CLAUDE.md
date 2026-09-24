# CLAUDE.md — Universo Agustino (enfermeria-hub)
Marketplace académico UNSA: apuntes PDF (visor protegido), bazar con custodia, balotarios modo juego. Solo `@unsa.edu.pe` + excepción `lukas.melgar@tecsup.edu.pe` (`ALLOWED_EMAIL_EXCEPTIONS`).

## Trabajo
- Responde en español. Sin explicar código: al terminar, "Hecho" + resultado verificable.
- Tarea = spec en `docs/specs/NN-*.md` (plantilla `_TEMPLATE.md`); marca `[x]` y registra evidencia en §7.
- Antes de marcar: `npm run typecheck` · `npm run lint` · `npm test` en verde (+ `docs:check` si tocas rutas).
- No commit/push sin pedirlo. Nunca commitear `.env` ni pegar secretos en docs.
- Leer bajo demanda (no por defecto): API `docs/API_SPECS.md` · negocio `docs/PROJECT_CONTEXT.md` · UI `docs/skills/studocu-ui-architect.md` · backend `docs/skills/bazar-engine-expert.md` · clonar UI `docs/skills/site-cloner.md` · reglas de docs `docs/REGLAS_DOCS_IA.md`.

## Árbol
```
apps/api/  Express+Prisma 5+Zod · src/{app,server,env}.ts · modules/{auth,documents,bazar,orders,payments,uploads,notifications,extra}
           lib/{session,cookies,mailer,storage,loginCode,google}.ts · prisma/{schema.prisma,migrations/} · docs/openapi.yaml
apps/web/  React18+Vite5+Tailwind3+framer-motion · src/{app/AppRoutes,pages,components,lib,data,auth,live}
           components/{examen,publicar,auth,landing,…} · data/balotarios/*.ts · lib/{api,routes,motion,quiz,uploadQueue}.ts
packages/shared/  esquemas Zod + tipos + computePrice/canTransition (contrato único; rebuild: npm run build -w packages/shared)
render.yaml (API) · vercel.json (web: build shared→web, SPA rewrite)
```

## Comandos (npm workspaces, no pnpm)
`npm run dev` · `npm run dev -w apps/api|apps/web` · `npm run build` · `npm test` · `npm run typecheck` · `npm run lint` · `npm run docs:check`
Prisma (exportar `DATABASE_URL`): `npm run prisma:generate` · migración nueva `cd apps/api && npx prisma migrate dev --name x` · prod `DATABASE_URL=$DIRECT_DATABASE_URL npx prisma migrate deploy` (en `apps/api`).

## Entorno (nombres; valores en `.env`/Render/Vercel)
API: `NODE_ENV API_PORT API_PREFIX=/api/v1 API_PUBLIC_URL WEB_ORIGIN(csv, con y sin www) DATABASE_URL DIRECT_DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET(≥32, distintos) JWT_ACCESS_TTL JWT_REFRESH_TTL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI MAIL_DRIVER(console|resend) RESEND_API_KEY MAIL_FROM(email o "Nombre <email>") STORAGE_DRIVER(local|s3) S3_ENDPOINT S3_REGION S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY MAX_UPLOAD_MB PLATFORM_FEE_PCT RESERVATION_TTL_MINUTES ENABLE_JOBS` · opc `TRUST_PROXY MP_ACCESS_TOKEN MP_WEBHOOK_SECRET APPLE_* CSP_ENFORCE`
Web (build-time): `VITE_API_URL`. BD: Neon `Universo_Agustino`(prod, ep-hidden-dew) · `Unsa`(dev, ep-orange-mountain).

## Reglas críticas
- Sesión: access en memoria (Bearer) + cookie `hub_refresh` httpOnly; prod `SameSite=None;Secure` (`lib/cookies.ts`). CSRF = `requireSameOrigin` con Origin **exacto** ∈ `WEB_ORIGIN`. `trust proxy` = `TRUST_PROXY` (1 en prod).
- Acceso: Google (`hd=unsa.edu.pe`, token revocado si falla) · OTP 6 dígitos (HMAC, 10 min, 5 intentos) · cuenta nueva → `onboardedAt` null → `/bienvenida`.
- Dinero: comisión solo `computePrice()`+`PLATFORM_FEE_PCT` (13 %); pedido solo vía `canTransition` (PENDING→ACCEPTED→PAID→ESCROW→RELEASED|CANCELLED|REFUNDED).
- Modelos: User, Profile, EmailLoginCode, RefreshToken, Document, BazarItem, Order, Escrow, Upload, Report, Notification. Exámenes = datos estáticos web (no BD).
- Migraciones: nueva y fechada; nunca editar una aplicada.
- Contrato API: `{data}` / `{error:{code,message}}`; toda ruta nueva en `openapi.yaml`.

## UI (estricto)
- Estilo Studocu/Linear: `bg-white|bg-zinc-50`, bordes sutiles, clases `.btn-* .card .chip .input .tag`.
- Acentos solo tokens `primary|primary-soft|primary-ink` (Teal `#00685F` por defecto, tema por carrera). Error: `#b91c1c`. Nunca colores fijos de acento.
- Motion solo `SPRING` de `lib/motion` (spring 400/30). CLS = 0: reservar altura; grillas móviles `grid-cols-1`; 0 px scroll horizontal a 375 px.
- Componentes < 150 líneas. Iconos: `node scripts/subset-icons.mjs --write` y `--check` al usar uno nuevo.
- OneDrive: Vite no detecta escrituras por sed/heredoc → `cp f f.tmp && mv f.tmp f`.
