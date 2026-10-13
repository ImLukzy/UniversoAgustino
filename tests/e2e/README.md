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

El seed aborta si la URL no identifica `ep-orange-mountain` o identifica
`ep-hidden-dew`; es idempotente y prepara una cuenta de cobro ficticia y dos
apuntes nuevos de pago. Los tests limpian órdenes, liquidaciones, accesos,
reportes, notificaciones, auditoría y archivos subidos en `finally`; si un
proceso se interrumpe antes, vuelve a revisar los registros `qa-*` antes de
repetirlo. No ejecutes estas pruebas contra una base compartida o de producción.
