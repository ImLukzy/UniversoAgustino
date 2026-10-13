# Pruebas E2E locales

Las pruebas recorren pausa/reactivación (spec 45), denuncia/moderación (spec 46)
y pagos digitales (spec 51) con usuarios `qa-*`: declaración con foto, rechazo y
reenvío, aceptación, acceso y descarga, liquidación al vendedor, reclamo,
congelación, reembolso y revocación del acceso. Los pagos usan una cuenta
ficticia `QA Cuenta` / `900000000`; nunca se cargan datos reales.

## Preparación

1. Carga el entorno de la base de desarrollo sin imprimirlo:

   ```sh
   set -a
   . /home/lukzy/Repositorios/UniversoAgustino/hive/ua-dev-db.env
   set +a
   npm run qa:seed
   ```

2. Inicia el API local (en `apps/api`) con `NODE_ENV=development`, puerto 4400,
   `WEB_ORIGIN=http://localhost:4473`, secretos ficticios de CI, `MAIL_DRIVER=console`,
   `STORAGE_DRIVER=local` y `ENABLE_JOBS=false`.
3. Compila la web en `apps/web` con `VITE_API_URL=http://localhost:4400/api/v1`
   hacia `/tmp/michael-e2e/web-dist` y sírvela con Vite Preview en el puerto 4473.
4. Ejecuta `npm run e2e`. Chrome usa `/usr/bin/google-chrome-stable`; cambia la ruta
   con `E2E_CHROME` si es necesario. `QA_PASSWORD`, `E2E_API_URL` y `E2E_WEB_URL`
   permiten ajustar credenciales y direcciones locales.

El seed decide por el host de la URL: acepta solo `ep-orange-mountain-*.neon.tech` (o `localhost` en CI) y rechaza siempre `ep-hidden-dew`; es idempotente y prepara una cuenta de cobro ficticia y dos
apuntes nuevos de pago. Los tests limpian órdenes, liquidaciones, accesos,
reportes, notificaciones, auditoría y archivos subidos en `finally`; si un
proceso se interrumpe antes, vuelve a revisar los registros `qa-*` antes de
repetirlo. No ejecutes estas pruebas contra una base compartida o de producción.

## CI y reproducción local

GitHub Actions crea un Postgres 16 efímero, instala Chromium y ejecuta
`npm run e2e:ci`; el gate espera ese job y adjunta `api.log` si falla. El script
migra el esquema, carga fixtures, compila API/web, espera la disponibilidad de
ambos servidores, ejecuta los casos y apaga los procesos aunque falle un paso.

Para reproducir el job localmente, inicia un Postgres 16 aislado en un puerto
libre y exporta una URL con host `localhost` o `127.0.0.1`, por ejemplo:

```sh
docker run --rm --name ua-e2e-postgres -e POSTGRES_USER=hub -e POSTGRES_PASSWORD=hub123 \
  -e POSTGRES_DB=test_hub -p 5433:5432 -d postgres:16
CI=true DATABASE_URL='postgresql://hub:hub123@localhost:5433/test_hub?schema=public' npm run e2e:ci
docker stop ua-e2e-postgres
```

El seed y `e2e:ci` rechazan siempre `ep-hidden-dew`. Para permitir una base local
fuera de CI se puede usar `QA_SEED_ALLOW_LOCAL=1`; esa excepción es solo para
`localhost` o `127.0.0.1`.
