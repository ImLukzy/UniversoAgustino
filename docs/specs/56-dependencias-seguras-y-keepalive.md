# Especificación: 56 - Arreglos de dependencias sin cambios mayores, scripts de instalación y keep-alive

## 1. Objetivo
**Problema:** (a) `npm audit` reporta 22 vulnerabilidades (3 críticas). Parte tiene arreglo sin versión mayor: `express`, `multer`, `morgan`, `qs`, `proxy-addr` (crítica, en producción), `source-map-js`, `@vitejs/plugin-react`. (b) npm 12 bloquea los scripts de instalación de `esbuild`, `prisma`, `@prisma/client`, `@prisma/engines` (y `@scarf/scarf`, telemetría) por no estar permitidos. (c) La API en Render (plan gratis) se duerme tras inactividad y el primer acceso tarda 30–60 s.
**Resultado esperado:** vulnerabilidades corregibles sin versión mayor resueltas; scripts de instalación necesarios permitidos de forma explícita y la telemetría bloqueada; la API no se duerme gracias a un ping gratuito.

## 2. Fuera de alcance
- Actualizaciones MAYORES (Vite 8, Vitest 5, Tailwind 4, React Router 7): specs posteriores, una por migración.
- `npm audit fix --force` o cualquier cambio de versión mayor.
- Cambiar de plan o región en Render.

**Decisiones de producto:** aprobadas por el humano 2026-10-13 (ping gratis cada 10 min; mayores en specs separadas).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `package-lock.json` (y `package.json` de los workspaces si hace falta subir un rango) | modificar | `npm audit fix` SIN `--force` |
| `package.json` raíz (o `.npmrc`) | modificar | permitir explícitamente los scripts de instalación de esbuild, prisma, @prisma/client y @prisma/engines; dejar bloqueado @scarf/scarf. Usar el mecanismo documentado de npm 12 (comprobar con `npm help install-scripts` / `npm install-scripts --help`) |
| `.github/workflows/keepalive.yml` | crear | `schedule` cada 10 min + `workflow_dispatch`; `curl` con reintentos a `https://universo-agustino-api.onrender.com/api/v1/health`; ubuntu-24.04; sin secretos; falla visible si responde ≠ 200 tras reintentos |

## 4. Diseño y lógica
- Tras `npm audit fix`, `npm audit` no debe mostrar ninguna de las vulnerabilidades con arreglo no mayor; las que requieren mayor quedan listadas en el reporte.
- `npm ci` sin avisos de scripts bloqueados salvo @scarf/scarf (o ninguno si @scarf queda denegado explícitamente).
- GitHub puede retrasar los `schedule`; aceptable.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | `npm run verify` | en la rama | verde |
| A2 | Audit | `npm audit` | 0 vulnerabilidades con arreglo no mayor; 0 críticas en dependencias de producción de apps/api |
| A3 | Instalación | `rm -rf node_modules && npm ci` | sin avisos de scripts bloqueados de esbuild/prisma |
| A4 | E2E | `npm run e2e` (o `e2e:ci`) | ✓ |
| A5 | Keep-alive | tras integrar, ejecución manual del workflow (`workflow_dispatch`) | verde |

## 6. Checklist de ejecución
- [ ] Tarea 1: audit fix + allowScripts.
- [ ] Tarea 2: workflow keep-alive.
- [ ] Tarea 3: verificar A1–A5 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
