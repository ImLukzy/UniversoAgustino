# Pruebas E2E locales

Las pruebas recorren los flujos de pausa/reactivación de la spec 45 y denuncia,
moderación, sanción y restauración de la spec 46 con usuarios `qa-*`.

## Preparación

1. Carga el entorno de la base de desarrollo sin imprimirlo:

   ```sh
   set -a
   . /home/lukzy/Repositorios/UniversoAgustino/hive/ua-dev-db.env
   set +a
   npm run qa:seed
   ```

2. Inicia el API local (en `apps/api`) con `NODE_ENV=development`, puerto 4300,
   `WEB_ORIGIN=http://localhost:4373`, secretos ficticios de CI, `MAIL_DRIVER=console`,
   `STORAGE_DRIVER=local` y `ENABLE_JOBS=false`.
3. Compila la web en `apps/web` con `VITE_API_URL=http://localhost:4300/api/v1`
   hacia `/tmp/dwight-e2e/web-dist` y sírvela con Vite Preview en el puerto 4373.
4. Ejecuta `npm run e2e`. Chrome usa `/usr/bin/google-chrome-stable`; cambia la ruta
   con `E2E_CHROME` si es necesario. `QA_PASSWORD`, `E2E_API_URL` y `E2E_WEB_URL`
   permiten ajustar credenciales y direcciones locales.

El seed aborta si la URL no identifica `ep-orange-mountain` o identifica
`ep-hidden-dew`. Los tests solo modifican registros de los usuarios QA y restauran
la publicación, los reportes y las sanciones en `finally`. No ejecutes estas
pruebas contra una base compartida o de producción.
