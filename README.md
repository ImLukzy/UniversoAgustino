# Universo Agustino

Marketplace académico de la comunidad UNSA (`@unsa.edu.pe`): apuntes, PAE y
exámenes en PDF con visor protegido, bazar entre estudiantes, monetización
para creadores y marco legal (D.L. 822).

## Stack

```
apps/api/         Express + TypeScript + Prisma (Postgres/Neon) + Zod + JWT — /api/v1
apps/web/         Vite + React + TypeScript + Tailwind + framer-motion
packages/shared/  Esquemas Zod y tipos compartidos (contrato único API ↔ web)
docs/             Contexto, specs, runbooks y guías (OAuth, pagos, R2)
```

## Arranque local

Requisitos: Node 20+ y una base Postgres (Neon o `docker compose`).

```bash
cp .env.example .env              # completa DATABASE_URL y los secretos JWT
npm install
npm run db:up                     # opcional: Postgres + Redis en Docker
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run build -w packages/shared
npm run dev                       # API + web
```

| Servicio | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:4000/api/v1 (`/health`, `/ready`) |
| Swagger | http://localhost:4000/docs |

Usuarios seed: `admin@unsa.edu.pe / Admin1234!` · `rosa.quispe@unsa.edu.pe / Creadora123!`

## Acceso (solo comunidad UNSA)

- **Google** con cuenta del Workspace UNSA (`hd = unsa.edu.pe`). Apple opcional.
- **Código de 6 dígitos al correo institucional** (`MAIL_DRIVER=console`
  imprime el código en la terminal de la API en desarrollo; `resend` en producción).
- Cuentas nuevas pasan por `/bienvenida` para completar su perfil.
- Única excepción de dominio autorizada: `ALLOWED_EMAIL_EXCEPTIONS` en `packages/shared`.

Configuración de credenciales en [`docs/oauth.md`](docs/oauth.md). Pagos en
[`docs/payments.md`](docs/payments.md) y almacenamiento en
[`docs/storage-r2.md`](docs/storage-r2.md).

## Calidad

```bash
npm run typecheck
npm run lint
npm test
npm run secrets                   # busca secretos antes de commitear
```

El `.env` nunca se commitea. Mapa del backend y reglas de negocio en
[`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md); arquitectura en
[`ARCHITECTURE.md`](ARCHITECTURE.md); especificaciones en [`docs/specs/`](docs/specs/).
