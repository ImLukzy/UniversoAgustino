# Especificación: 48 - Comando `verify` igual al CI y CI actualizado

## 1. Objetivo
**Problema:** (a) No existe un comando local que ejecute exactamente lo mismo que el CI; el 2026-10-12 el CI falló en `34ed1ea` por `any-budget` porque esa comprobación no estaba en la lista manual. (b) `.github/workflows/ci.yml` usa `actions/checkout@v4` y `actions/setup-node@v4` (GitHub avisa que Node 20 está obsoleto para actions), `node-version: 20` y `runs-on: ubuntu-latest`, que migra a Ubuntu 26 desde el 2026-10-19.
**Resultado esperado:** `npm run verify` reproduce todos los jobs del CI en local, y el CI usa versiones vigentes y una imagen fija.

## 2. Fuera de alcance
- Cambiar qué comprueba el CI (mismos jobs, mismos scripts) o los umbrales.
- Secretos, Render, Vercel o despliegues.

**Decisiones de producto:** aprobada por el humano 2026-10-12.

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `package.json` (raíz) | modificar | script `verify` |
| `scripts/verify.mjs` | crear | ejecuta en orden y se detiene en el primer fallo, mostrando qué paso falló |
| `.github/workflows/ci.yml` | modificar | actions a la versión mayor vigente que corre en Node 24; `node-version` a la LTS que use el proyecto en local (comprobar que pasa); `runs-on` fijado a una imagen concreta (p. ej. `ubuntu-24.04`) |
| `CLAUDE.md`, `AGENTS.md` | modificar | indicar `npm run verify` como comprobación obligatoria antes de reportar |

## 4. Diseño y lógica
- `verify` ejecuta, en este orden: `npm run build -w packages/shared` · `prisma generate` (schema de apps/api) · `npm run typecheck` · `npm run lint` · `npm run docs:check` · `npm run secrets` · `npm run budget:any` · `npm run budget:size` · `node scripts/subset-icons.mjs --check` · `npm test` con secretos JWT ficticios solo si no están definidos (los mismos valores ficticios del CI).
- Sin dependencias nuevas. Salida breve: un renglón por paso con ✓/✗ y el tiempo.
- CI: mismos jobs y pasos; solo versiones e imagen. El job `budgets` puede añadir `subset-icons --check` para igualar a `verify`.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | verify | `npm run verify` en la rama | sale 0 con todos ✓ |
| A2 | verify detecta fallos | introducir temporalmente la palabra `any` en un archivo de src (sin commitear) → `verify` sale ≠ 0 en el paso any-budget; revertir | OK |
| A3 | CI | push de la rama de integración → todos los jobs en verde | verde |
| A4 | Sin avisos de deprecación de Node 20 en las anotaciones del CI | `gh run view` | 0 avisos de Node 20 |

## 6. Checklist de ejecución
- [x] Tarea 1: `scripts/verify.mjs` + script `verify` + docs en CLAUDE.md/AGENTS.md.
- [x] Tarea 2: actualizar `ci.yml`.
- [ ] Tarea 3: verificar A1–A4 y anotar en §7.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
| 2026-10-12 | A1 verify | OK: 10 pasos ✓ en ImLukzy/Claudio | `npm run verify` |
| 2026-10-12 | A2 detecta fallos | OK: `// any` temporal → sale 1 en budget:any | Dwight 506fa6e |
| 2026-10-12 | CI y Node | checkout@v7 (v7.0.1), setup-node@v7 (v7.1.0), node 24, ubuntu-24.04; producción alineada a Node 24 (`engines.node` 24.x, render.yaml) por decisión humana | Dwight 506fa6e, Claudio fb7199a; auditoría Kelly OK |
