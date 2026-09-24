# PROJECT_CONTEXT — enfermeria-hub / Universo Agustino

> Mapa mental para un LLM que va a trabajar en este monorepo. Hechos
> verificados contra el código el 2026-09-23. Donde el brief original
> discrepa de la realidad, manda esta sección (ver §0).

## 0. Divergencias conocidas con el brief (leer primero)

- El **bazar físico NO se eliminó**: existen `BazarItem`, `BazarStatus`
  (AVAILABLE/RESERVED/SOLD/RENTED), rutas `/bazar`, páginas de bazar y
  alquileres con garantía. El "pivote a solo documentos" es aspiracional.
- La máquina de estados de `Order` tiene **7 estados**, no 3
  (ver §2). `CANCELLED` exige motivo; existe `REFUNDED`.
- La UI **no usa** `bg-zinc-50` / `text-zinc-900` / `#00685F` (cero
  ocurrencias): usa tokens propios `surface-*` + slate + acentos por
  carrera (20 colores únicos AA en `apps/web/src/data/unsa.ts`).
- Existe modelo `Escrow` (1:1 con `Order`, con `releasedAt`): la custodia
  no es solo un status.
- Springs reales en uso: `stiffness: 400` (mayoría) y `350` (drawer/nav).

## 1. Stack y arquitectura

- Monorepo npm workspaces (`apps/*`, `packages/*`). Tres unidades:
  `apps/api`, `apps/web`, `packages/shared`.
- **API**: Express + Prisma 5 + Postgres (Neon, São Paulo) + Zod vía
  `@hub/shared`. Prefijo `/api/v1`, puerto 4000. `GET /health`, `/ready`,
  Swagger en `/docs` (contrato en `apps/api/docs/openapi.yaml`, gate
  `scripts/docs-check.mjs`: toda ruta montada debe estar documentada).
- **Web**: React + Vite 5 + Tailwind 3.4 + TanStack Query + Framer Motion,
  puerto 5173. Rutas con React Router y code-splitting por página
  (pdfjs-dist va en lazy siempre; el worker es chunk separado).
- **Shared** (`@hub/shared`): Zod schemas + `computePrice()` + etiquetas.
  La API lo importa de verdad; la web lo importa solo para `computePrice`
  y **duplica** las interfaces (`HubOrder`, `HubDocument`…) en
  `apps/web/src/lib/api.ts` — grieta de tipos conocida: si cambia el
  backend, el espejo manual se desincroniza.
- Storage dual: disco local (dev) o Cloudflare R2 privado vía SDK S3 con
  URLs prefirmadas de 15 min (`STORAGE_DRIVER=s3`). Uploads validados por
  firma mágica, nombres UUID, dedupe por checksum+dueño (modelo `Upload`).
  PDFs del visor viajan por `?stream=1` (misma API, con `Range`) para
  esquivar CORS/preflights del navegador.
- Migraciones Prisma numeradas por fecha; regla dura: jamás editar una
  migración aplicada (los índices raw de sprint1a ni siquiera están en el
  schema: drift conocido y documentado, no "arreglar" con diff a ciegas).

## 2. Datos y máquina de estados

- `User` (email único, `passwordHash` nullable para OAuth, `provider`/
  `providerId` únicos, `avatarUrl`) 1—1 `Profile` (nombre, universidad
  fija UNSA, carrera del enum de 20, ciclo). Roles:
  student|creator|moderator|admin.
- `Document` (apunte: course, career, cycle, type, priceCents, fileUrl,
  payMethod/QR) y `BazarItem` (kind LIBRO|INSTRUMENTO|SCRUB, tx
  VENTA|ALQUILER, priceCents, depositCents, photos[], payMethod/QR).
- `Order` congela snapshot al crear: `sellerId` materializado, `itemTitle`,
  `amountCents/feeCents/netCents`, TTL 30 min que bloquea el ítem
  (`RESERVATION_TTL_MINUTES`). Invariante financiera no negociable:
  `net + fee = amount`, calculada SOLO con `computePrice()` (comisión 13%).
- Estados: `PENDING → ACCEPTED` (solo bazar, alquiler) `→ PAID → ESCROW
  → RELEASED`. Documentos saltan `ACCEPTED` (PENDING→PAID directo).
  `CANCELLED` exige `cancelledReason`; `REFUNDED` existe.
  Vocabulario estricto: `itemType` en minúsculas (`document|bazar`).
- `Escrow` 1:1 con `Order` (marca `releasedAt`). `AuditLog` registra
  auth/pedidos/pagos. `RefreshToken` con hash sha256 + revocación.
  `Notification` (type/title/body/link/readAt) con índice de no-leídas.
  `Report` para takedowns D.L. 822 (<48h).

## 3. Backend y seguridad

- Auth: registro/login con email+password; puerta estricta
  `isAllowedEmail()` (`@unsa.edu.pe` + única excepción tecsup autorizada).
  Access JWT corto en memoria del frontend; refresh rotativo en cookie
  httpOnly `hub_refresh` (+ canal por body como respaldo); rotación con
  ventana de gracia `*_PREV` (ver `docs/runbook-rotacion.md`).
- OAuth Google/Apple implementado (`/auth/oauth/*`, `state` firmado,
  códigos de un solo uso, verificación RS256/JWKS sin deps para Apple):
  **apagado sin credenciales** (solo el propietario puede crearlas, ver
  `docs/oauth.md`). Mismo `isAllowedEmail` + revocación del token en
  Google ante dominio denegado. Cuentas OAuth no tienen clave: el login
  clásico responde `OAUTH_ONLY`.
- Contratos de error: `{ error: { code, message, details?, requestId } }`.
  Auth siempre desde `req.user.sub` (nunca `req.user.id`). Rate limits:
  global 300/min, login 50/15min, forgot doble, uploads 30/h, OAuth 50/15min.
- Uploads: `POST /uploads` (multer→temporal→verificación→R2/disco),
  `GET /uploads/:name` con 302 no-cacheable a prefirmada o `?stream=1`
  con `Range` reenviado. CORS del bucket documentado en `docs/storage-r2.md`.

## 4. Frontend y estado

- React Query global: `staleTime` 5 min, sin refetch al enfocar; claves
  `["orders", …]`, `["notifications", …]`, `["live-documents", …]`,
  intervalos de 30 s en campana/ventas. Contextos: `AuthContext` (sesión
  en memoria + `refreshMe`), `CareerTheme` (carrera global → variable
  `--hub-p` + acentos), `ToastContext`, `AuthModalHost` (modal flotante
  global; no existe página `/login`: la ruta abre el modal).
- Rutas reales: `/` (landing), `/home` (dashboard), `/bazar`, `/monetiza`,
  `/legal`, `/v/:id` (visor PDF protegido págs. 1–2), `/p/bazar/:id`,
  `/publicar`, `/subir-material` (wizard), `/checkout/:id`, `/pedidos`,
  `/ventas`, `/publicaciones`, `/cuenta`, `/perfil`, `/ajustes`,
  `/notificaciones`, `/suscripcion` (página honesta: no hay premium),
  `/panel`, `/admin`, `/auth/callback`. Mapa central en
  `apps/web/src/lib/routes.ts` (usarlo, no literales).
- Layout: todo menos `/` usa `AppLayout` (sidebar 280px + header con
  omnibox + footer único `AppFooter`; el drawer móvil reutiliza el
  mismo contenido). Un solo footer por página (verificado).
- UI: 15 acentos de carrera únicos + test que exige unicidad y contraste
  AA; subset de Material Symbols generado (`scripts/subset-icons.mjs
  --write`, test de paridad: todo icono nuevo debe entrar al subset);
  skeletons con geometría 1:1 (CLS≈0); `EmptyState` compartido.
- Motion: springs 400/25 en cards y botones, 350/32 en drawer/nav,
  `AnimatePresence` en filtros/dropdowns/modales; entradas `ease-out`,
  jank evitado (sin `layout` sobre imágenes lazy).

## 5. Contratos y reglas de trabajo

- `packages/shared`: Zod (`Register/Login/Forgot/Reset/UpdateProfile`,
  `CreateDocument/Bazar`, `CareerSchema` 1:1 con `data/unsa.ts`),
  `computePrice()` (única vía legal para la comisión),
  `isAllowedEmail()`, etiquetas y `simulateEarnings`.
- Verificación obligatoria por cambio: `npm run typecheck` (0 errores),
  `npm run lint` (0 errores), `npm test` (vitest), `npm run docs:check`
  si tocas rutas, build web si tocas UI global.
- Prohibido: inventar precios/ratings/vistas/seguidores/quizzes/premium/
  stats; `any` (gate `budget:any`); iconos fuera del subset; datos de
  negocio en fixtures sin prefijo `TEST-`/`@test.local`; commitear `.env`.
- Convenciones: componentes pequeños, props tipadas, errores con el
  contrato del §3, español en toda la UI, commits atómicos solo cuando el
  usuario los pide explícitamente.
