# Especificación: 53 - Copias de seguridad y ensayo de migraciones (Neon)

## 1. Objetivo
**Problema:** Neon (plan gratis) solo guarda 6 h de historial: un error de datos detectado al día siguiente no se puede deshacer. Las migraciones se aplican a producción sin ensayo previo sobre datos reales; la copia del 2026-10-13 se hizo a mano.
**Resultado esperado:** dos comandos repetibles: `npm run db:backup` (copia verificada de producción fuera del repo) y `npm run db:ensayo` (aplica las migraciones pendientes sobre una rama temporal de Neon clonada de producción y la borra). Más un procedimiento escrito de copia, ensayo, publicación y restauración.

## 2. Fuera de alcance
- No tocar `.github/workflows/*`, `render.yaml`, migraciones existentes ni código de `apps/`.
- No guardar copias, cadenas de conexión ni datos reales dentro del repo.
- No automatizar copias programadas (cron) en esta spec.
- **Rama `staging` persistente: descartada.** Contendría datos reales que envejecen y consumiría horas de cómputo del plan gratis. En su lugar, una rama de ensayo **efímera** por migración.

**Decisiones de producto que requieren aprobación antes de ejecutar:** ninguna (el humano aprobó el trabajo de Neon el 2026-10-13).

## 3. Archivos afectados
| Archivo | Acción | Nota |
|---|---|---|
| `scripts/lib/db-tools.mjs` | crear | funciones puras: guardas de host, ruta de copias, rotación, nombre de rama, enmascarado de URLs |
| `scripts/lib/db-tools.test.mjs` | crear | `node --test` |
| `scripts/db-backup.mjs` | crear | `npm run db:backup` |
| `scripts/db-ensayo.mjs` | crear | `npm run db:ensayo` |
| `package.json` | modificar | scripts `db:backup`, `db:ensayo`; `test` añade `node --test scripts/lib/*.test.mjs` |
| `docs/operaciones/base-de-datos.md` | crear | procedimiento |

## 4. Diseño y lógica
**`db:backup`**
- Lee `DIRECT_DATABASE_URL` del entorno; el humano la carga desde `hive/ua-prod-db.env`.
- Exige que `BACKUP_DIR` esté definido y sea **fuera del repo**: lo rechaza si la ruta resuelta está dentro de la raíz del repo.
- Ejecuta `pg_dump -Fc --no-owner --no-privileges` en `docker run --rm postgres:18`, con el mismo usuario y grupo que el host. La versión mayor de `pg_dump` debe ser ≥ la del servidor: la consulta antes con `SHOW server_version` y aborta si no se cumple.
- Pasa la URL por variable de entorno al contenedor y **nunca la imprime**: los errores salen con la URL enmascarada.
- Nombre del archivo: `prod-AAAAMMDD-HHMMSS[-<etiqueta>].dump`, con etiqueta opcional `--label`.
- Verifica la copia con `pg_restore -l`: debe haber al menos una entrada `TABLE DATA` y la de `_prisma_migrations`. Si falla, borra el archivo y sale con código 1.
- `chmod 600`. Rotación: conserva las 10 copias más recientes de `prod-*.dump` en ese directorio, con `--keep N` para cambiarlo, y nunca toca otros archivos.

**`db:ensayo`**
- Exige `NEON_PROJECT_ID` y usa `npx neonctl@latest`, autenticado en la máquina.
- Crea la rama `ensayo-AAAAMMDD-HHMMSS` desde `production` con `branches create --parent production --name … -o json` y obtiene su cadena con `connection-string <rama> --project-id …`.
- Guardas:
  - El host de la rama nueva **no** puede ser el de producción (`ep-hidden-dew`).
  - El nombre de la rama debe empezar por `ensayo-`.
- Pasos:
  1. Ejecuta `prisma migrate status`, que informa de las pendientes.
  2. Ejecuta `prisma migrate deploy` con `--schema apps/api/prisma/schema.prisma`.
  3. Vuelve a ejecutar `migrate status`: debe dar «up to date».
  4. Comprueba con un recuento que las tablas `User`, `Document`, `Order` y `_prisma_migrations` responden.
- En `finally`, borra la rama salvo que se pase `--keep`, e imprime el resultado.
- Nunca imprime cadenas de conexión.

**Restauración** (en el doc, no en script): dos opciones, de menor a mayor alcance.
1. **Error en las últimas 6 h:** rama de Neon desde un instante pasado, con `branches create --parent production@<ISO>`. Se verifica y, después, se restaura producción desde esa rama (`branches restore`) o se copian los datos necesarios.
2. **Error más antiguo:** `pg_restore` de la copia en una rama nueva vacía, se verifica y luego se promueve o se copia.

Ambas se describen con comandos exactos y con la regla de que tocar producción requiere el OK humano.

## 5. Criterios de aceptación (medibles)
| # | Criterio | Cómo se verifica | Umbral |
|---|---|---|---|
| A1 | Tipos | `npm run typecheck` | 0 errores |
| A2 | Lint | `npm run lint` | 0 errores, 0 warnings |
| A3 | Tests | `npm test` | en verde; nuevos en `scripts/lib/db-tools.test.mjs`: copias dentro del repo → rechazo; host de prod en el ensayo → rechazo; rotación conserva N y solo `prod-*.dump`; el enmascarado no deja contraseña |
| A4 | Gate | `npm run verify` | en verde |
| A5 | Copia real | `npm run db:backup` contra prod (integrador) | archivo 600 fuera del repo, `pg_restore -l` válido |
| A6 | Ensayo real | `npm run db:ensayo` (integrador) | rama creada, «up to date», recuentos OK, rama borrada |
| A7 | Simulacro de restauración | integrador: rama desde un instante pasado (PITR) y `pg_restore` de la copia en una rama nueva; recuentos iguales a prod | coinciden |
| A8 | Sin secretos | `npm run secrets` y revisión de la salida de A5–A7 | ninguna URL ni contraseña impresa |

## 6. Checklist de ejecución
- [ ] Tarea 1: `scripts/lib/db-tools.mjs` + tests (A3).
- [ ] Tarea 2: `scripts/db-backup.mjs`.
- [ ] Tarea 3: `scripts/db-ensayo.mjs`.
- [ ] Tarea 4: `package.json` (scripts y test).
- [ ] Tarea 5: `docs/operaciones/base-de-datos.md` (copia → ensayo → publicar → verificar; restauración 1 y 2).
- [ ] Tarea 6: A1–A4 en verde (implementador). A5–A8 los ejecuta el integrador con credenciales.

## 7. Registro de verificación
| Fecha | Criterio | Resultado | Evidencia (comando / captura) |
|---|---|---|---|
