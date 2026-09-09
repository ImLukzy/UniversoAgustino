# Wawki Arequipa — localhost profesional

Marketplace académico UNSA: apuntes/PAE + bazar con escrow + monetización + marco legal D.L. 822.

## Arranque en 5 minutos (Windows PowerShell)

```powershell
cd enfermeria-hub
Copy-Item .env.example .env
docker compose up -d postgres redis   # postgres :5432, redis :6379, mailhog :8025
npm install
npm run prisma:generate -w apps/api
npm run prisma:migrate -w apps/api
npm run prisma:seed -w apps/api
npm run dev
```

URLs:

- Web: http://localhost:5173 (rutas `/`, `/bazar`, `/monetiza`, `/legal`)
- API: http://localhost:4000/api/v1 (`/health`, `/ready`)
- Swagger: http://localhost:4000/docs
- Mail dev: http://localhost:8025

Usuarios seed: `admin@hub.local / Admin1234!` · `creadora@unsa.local / Creadora123!`

## Estructura

```
apps/api/       Express+TS+Prisma+Zod+JWT — /api/v1
apps/web/       Vite+React+TS+Tailwind — migra los 4 code.html de Stitch
packages/shared/ Zod + tipos + simulateEarnings (contrato único)
docker-compose.yml postgres+redis+mailhog
ARCHITECTURE.md plan completo
```

## Comandos útiles

```powershell
npm run dev:api; npm run dev:web
npm run prisma:seed -w apps/api
docker compose logs postgres
```

Ver `ARCHITECTURE.md` para modelo de datos, APIs, seguridad y roadmap.
