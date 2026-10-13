# Copia, ensayo y restauración de la base de datos

## Antes de una migración

Carga `DIRECT_DATABASE_URL` desde el archivo seguro de producción sin mostrarlo y define un directorio cifrado fuera del repositorio:

```sh
set -a
. /ruta/segura/ua-prod-db.env
set +a
export BACKUP_DIR=/ruta/segura/backups   # en la máquina del integrador: hive/backups
npm run db:backup -- --label pre-migration
```

El comando crea un `prod-*.dump` con permisos 600, lo valida con `pg_restore -l` y conserva las diez copias más recientes. Ajusta la retención con `--keep N`. No almacenes los dumps en el repositorio.

Con `NEON_PROJECT_ID` definido (proyecto de producción en Neon) y Neon CLI autenticado en la máquina, ejecuta el ensayo. La base de la app es `neondb`; el proyecto tiene otra (`portafolio`), así que `NEON_DATABASE` la fija si algún día cambia:

```sh
npm run db:ensayo
```

El comando crea una rama temporal desde `production`, aplica migraciones pendientes, verifica el estado y las tablas principales y elimina la rama al terminar. `--keep` conserva la rama para inspección; elimínala manualmente cuando acabes. Revisa el resultado y la copia antes de solicitar la publicación.

La publicación en producción requiere el OK humano. Después de recibirlo, ejecuta desde `apps/api`:

```sh
DATABASE_URL="$DIRECT_DATABASE_URL" npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
```

## Restauración

Primero conserva el estado actual con `db:backup`, identifica el alcance del daño y valida la recuperación en una rama separada. Cambiar o reemplazar datos de producción requiere OK humano explícito.

### Error dentro de las últimas seis horas

Usa un instante UTC anterior al error. `--parent` recibe solo el instante (la rama por defecto es `production`; `production@<instante>` no funciona). Crea una rama desde el historial de producción y verifica sus datos antes de recuperar nada:

```sh
export NEON_PROJECT_ID='proyecto-aprobado'
export RESTORE_BRANCH="pitr-$(date -u +%Y%m%d-%H%M%S)"
export PITR_AT='AAAA-MM-DDTHH:mm:ssZ'
npx --yes neonctl@latest branches create --project-id "$NEON_PROJECT_ID" --name "$RESTORE_BRANCH" --parent "$PITR_AT" --no-secrets -o json
npx --yes neonctl@latest connection-string "$RESTORE_BRANCH" --project-id "$NEON_PROJECT_ID" --database-name neondb -o json
```

Usa la cadena obtenida solo mediante una variable de entorno segura. Compara recuentos y registros afectados con la copia; decide si copiar únicamente los datos necesarios o restaurar la rama de producción. La restauración completa es destructiva y exige OK humano:

```sh
npx --yes neonctl@latest branches restore production "$RESTORE_BRANCH" --project-id "$NEON_PROJECT_ID"
```

Verifica de nuevo la aplicación y las tablas. Elimina la rama PITR cuando ya no sea necesaria:

```sh
npx --yes neonctl@latest branches delete "$RESTORE_BRANCH" --project-id "$NEON_PROJECT_ID" -f
```

### Error de más de seis horas

Crea una rama aislada para restaurar el dump. Obtén su cadena por un canal seguro y pásala al contenedor mediante `DATABASE_URL`; no la pegues en el terminal compartido ni en logs.

```sh
export RESTORE_BRANCH="restore-$(date -u +%Y%m%d-%H%M%S)"
export BACKUP_FILE=/ruta/segura/backups/prod-AAAAMMDD-HHMMSS.dump
npx --yes neonctl@latest branches create --project-id "$NEON_PROJECT_ID" --name "$RESTORE_BRANCH" --parent production --no-secrets -o json
docker run --rm -e DATABASE_URL -v "$BACKUP_FILE:/backup.dump:ro" postgres:18 sh -c 'pg_restore --no-owner --no-privileges --clean --if-exists -d "$DATABASE_URL" /backup.dump'
docker run --rm -e DATABASE_URL postgres:18 sh -c 'psql "$DATABASE_URL" -Atc "SELECT count(*) FROM \"_prisma_migrations\""'
```

Valida migraciones, recuentos y comportamiento de la aplicación en esa rama. Solo después de la revisión y el OK humano se restaura producción desde ella o se copian los registros necesarios. Conserva una copia previa y un plan de vuelta atrás durante toda la operación.

## Seguridad y costos

Las ramas de ensayo y recuperación contienen datos reales; limita el acceso, no las uses para pruebas manuales y elimínalas al terminar. En el plan gratis Neon no cobra, pero cada rama activa consume horas de cómputo del mes. Los scripts no imprimen cadenas de conexión; evita activar trazas que las expongan.

## Simulacros

- 2026-10-13: PITR (rama desde hace 1 h) y `pg_restore` de la copia en una base aislada de una rama de Neon; recuentos iguales a producción y a la copia. Ensayo con migración pendiente de prueba: aplicada en la rama efímera, producción intacta.
