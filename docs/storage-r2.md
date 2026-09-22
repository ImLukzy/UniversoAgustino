# Storage en Cloudflare R2 (salir del disco local)

Por defecto todo sigue en disco (`apps/api/uploads`). Para usar R2:

## 1. Crear el bucket (una vez, panel de Cloudflare)
1. Cloudflare Dashboard → R2 → **Create bucket** → nombre `ua-uploads` (privado; NO actives "Public access").
2. R2 → **Manage R2 API Tokens** → Create API Token con permiso **Object Read & Write** acotado a ese bucket.
3. Anota: `Account ID` (el endpoint es `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`), `Access Key ID`, `Secret Access Key`.

## 2. Variables de entorno (API)
```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=ua-uploads
S3_ACCESS_KEY_ID=<key>
S3_SECRET_ACCESS_KEY=<secret>
# Opcional: prefijo dentro del bucket (ej. prod). Vacío = raíz.
S3_KEY_PREFIX=
```
Sin `STORAGE_DRIVER=s3` nada cambia (modo disco). Con `s3` pero sin las 4
claves la API **no arranca** (fail-fast en `lib/storage.ts`).

## 3. Migrar lo existente
```bash
node --env-file=.env scripts/migrate-uploads-to-r2.mjs
```
Sube cada archivo con la **misma clave** (`storedName`); re-ejecutable
(omite lo que ya está). Las URLs `/uploads/<name>`, `Document.fileUrl` y
`BazarItem.photos` siguen válidas sin tocar BD ni frontend.

## 4. Verificar y limpiar
1. Con `STORAGE_DRIVER=s3`, abre un PDF/foto existente → debe llegar (302 a URL prefirmada de 15 min).
2. Sube un archivo nuevo → debe aparecer en el bucket R2.
3. Recién entonces borra (o archiva) `apps/api/uploads`. Rollback: vuelve a `STORAGE_DRIVER=local` con la carpeta restaurada.

## 5. CORS del bucket (obligatorio para el Visor PDF)
Sin esto el navegador bloquea el `fetch` cross-origen de pdf.js al 302
prefirmado y el Visor cae a la imagen por defecto (las `<img>` sí cargan sin
CORS). Cloudflare Dashboard → R2 → `ua-uploads` → **Settings → CORS Policy**
→ pega este JSON:
```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "http://localhost:4173"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Content-Range", "Accept-Ranges", "Content-Length", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
- `Range` es lo que pdf.js usa para traer solo las páginas 1–2.
- Al desplegar a producción, **agrega el dominio real** a `AllowedOrigins`.
- Verificación: abre el Visor de un PDF y debe renderizar la página real;
  o `curl -sI -H "Origin: http://localhost:5173" <url-prefirmada>` debe traer
  `access-control-allow-origin: http://localhost:5173`.

## Notas
- El bucket es **privado**: el navegador recibe un 302 a una URL prefirmada (15 min, `private, max-age=900`), nunca la clave del bucket.
- Modelo de acceso sin cambios (paridad con disco): quien tenga la URL `/uploads/...` la puede abrir. Control por comprador/vendedor es follow-up pendiente, no parte de esta migración.
- Deduplicación por checksum+dueño y validación por firma mágica funcionan igual en ambos backends.
