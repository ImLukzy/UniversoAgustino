# Universo Agustino

Marketplace académico para la comunidad UNSA: apuntes digitales, bazar entre estudiantes, custodia de pagos, moderación y balotarios.

## Stack y despliegue

Monorepo npm: API Express/Prisma/PostgreSQL (`apps/api`), web React/Vite (`apps/web`) y contratos compartidos (`packages/shared`). Requiere **Node.js 24.x** y npm.

- La API se despliega en Render según [`render.yaml`](render.yaml); incluye generación de Prisma y migraciones en predeploy.
- La web se despliega en Vercel según [`vercel.json`](vercel.json); configura `VITE_API_URL` en el build.
- La API usa `/api/v1`; Swagger está disponible en `/docs`.

## Desarrollo local

Necesitas una base PostgreSQL de desarrollo. Configura las variables requeridas en `.env` a partir de `.env.example`; no guardes credenciales en Git.

```bash
npm ci
npm run db:up                 # opcional: PostgreSQL y Redis con Docker
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed           # seed de desarrollo
npm run dev                   # API y web
```

Direcciones locales por defecto: web `http://localhost:5173`, API `http://localhost:4000/api/v1`.

## Calidad y pruebas

```bash
npm run verify               # comprobación obligatoria equivalente a CI
npm run qa:seed              # datos fijos E2E; requiere BD de desarrollo autorizada
npm run e2e                  # flujos locales con API y web levantadas
npm run e2e:ci               # E2E de CI contra PostgreSQL efímero
```

`qa:seed` y `e2e` requieren PostgreSQL; consulta [`tests/e2e/README.md`](tests/e2e/README.md) para levantar servicios y preparar el entorno. La definición de rutas está en [`apps/api/docs/openapi.yaml`](apps/api/docs/openapi.yaml), el contexto del producto en [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) y las guías de operación en `docs/`.


## Documentación

- [Contexto del producto](docs/PROJECT_CONTEXT.md) · [guía de la API](docs/API_SPECS.md) · [OpenAPI](apps/api/docs/openapi.yaml)
- [Pagos y liquidaciones](docs/payments.md) · [OAuth](docs/oauth.md) · [Almacenamiento R2](docs/storage-r2.md)
