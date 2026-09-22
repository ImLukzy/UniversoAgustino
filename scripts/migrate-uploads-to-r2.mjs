// Migra los archivos de apps/api/uploads al bucket R2 con la MISMA clave
// (storedName). Las URLs `/uploads/<name>` y los registros Upload siguen
// válidos sin cambios.
//
// Uso (requiere STORAGE_DRIVER=s3 + S3_* en .env):
//   node --env-file=.env scripts/migrate-uploads-to-r2.mjs
// Re-ejecutable: omite lo que ya existe en el bucket (HeadObject).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const required = ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Faltan en el entorno: " + missing.join(", ") + " (ver docs/storage-r2.md)");
  process.exit(1);
}
const prefix = (process.env.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
const s3 = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
});
const Bucket = process.env.S3_BUCKET;
const key = (n) => (prefix ? `${prefix}/${n}` : n);
const mimeOf = (n) => {
  const e = path.extname(n).toLowerCase();
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".pdf") return "application/pdf";
  if (e === ".epub") return "application/epub+zip";
  return "application/octet-stream";
};

const dir = path.resolve("apps/api/uploads");
const files = (await readdir(dir)).filter((f) => !f.startsWith("tmp-"));
let ok = 0, skipped = 0;
const failed = [];
for (const f of files) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key: key(f) }));
    skipped++;
  } catch {
    try {
      await s3.send(new PutObjectCommand({ Bucket, Key: key(f), Body: await readFile(path.join(dir, f)), ContentType: mimeOf(f) }));
      ok++;
      console.log("subido:", f);
    } catch (e) {
      failed.push(`${f}: ${e instanceof Error ? e.message : e}`);
    }
  }
}
console.log(`\nR2 <- local: ${ok} subidos, ${skipped} ya existían, ${failed.length} fallidos (${files.length} total)`);
for (const m of failed) console.error("FALLO:", m);
process.exit(failed.length ? 1 : 0);
