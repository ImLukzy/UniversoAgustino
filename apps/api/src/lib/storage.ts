import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Abstracción de almacenamiento: disco local (dev) o bucket S3-compatible
// (Cloudflare R2 en producción). El resto del código (uploads, serve,
// migración) solo habla con estas funciones, nunca con fs/S3 directo.
//
// Clave de diseño: la URL pública NO cambia (`/uploads/<storedName>`).
// En modo S3 el GET redirige a una URL prefirmada de corta duración, así
// que Document.fileUrl, BazarItem.photos y el frontend siguen intactos.

type StorageBackend = "local" | "s3";

interface StorageConfig {
  backend: StorageBackend;
  /** Solo local: directorio absoluto donde viven los archivos. */
  localDir: string;
  /** Solo s3. */
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
}

/** Pura y testeable: resuelve el backend desde variables de entorno. */
export function resolveStorageConfig(e: NodeJS.ProcessEnv): StorageConfig {
  const driver = (e.STORAGE_DRIVER ?? "local").toLowerCase();
  const localDir = path.resolve(process.cwd(), e.STORAGE_LOCAL_DIR ?? "./uploads");
  if (driver !== "s3") {
    return { backend: "local", localDir, endpoint: "", region: "", bucket: "", accessKeyId: "", secretAccessKey: "", prefix: "" };
  }
  const endpoint = e.S3_ENDPOINT ?? "";
  const bucket = e.S3_BUCKET ?? "";
  const accessKeyId = e.S3_ACCESS_KEY_ID ?? "";
  const secretAccessKey = e.S3_SECRET_ACCESS_KEY ?? "";
  const missing = [
    ["S3_ENDPOINT", endpoint],
    ["S3_BUCKET", bucket],
    ["S3_ACCESS_KEY_ID", accessKeyId],
    ["S3_SECRET_ACCESS_KEY", secretAccessKey],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(`STORAGE_DRIVER=s3 pero faltan: ${missing.join(", ")} (revisa .env y docs/storage-r2.md)`);
  }
  return {
    backend: "s3",
    localDir,
    endpoint,
    region: e.S3_REGION ?? "auto",
    bucket,
    accessKeyId,
    secretAccessKey,
    prefix: (e.S3_KEY_PREFIX ?? "").replace(/^\/+|\/+$/g, ""),
  };
}

export const storageConfig = resolveStorageConfig(process.env);

let s3: S3Client | null = null;
function client(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: storageConfig.region,
      endpoint: storageConfig.endpoint,
      credentials: { accessKeyId: storageConfig.accessKeyId, secretAccessKey: storageConfig.secretAccessKey },
    });
  }
  return s3;
}

function key(name: string): string {
  const base = path.basename(name);
  return storageConfig.prefix ? `${storageConfig.prefix}/${base}` : base;
}

function ensureLocalDir(): void {
  fs.mkdirSync(storageConfig.localDir, { recursive: true });
}

// En modo disco el directorio debe existir antes de que multer escriba.
// (En modo s3 no se toca el disco salvo temporales del SO.)
if (storageConfig.backend === "local") ensureLocalDir();

/** Guarda el contenido bajo `name` (sobrescribe si existe). */
export async function putObject(name: string, body: Buffer, contentType: string): Promise<void> {
  if (storageConfig.backend === "local") {
    ensureLocalDir();
    await fs.promises.writeFile(path.join(storageConfig.localDir, path.basename(name)), body);
    return;
  }
  await client().send(
    new PutObjectCommand({ Bucket: storageConfig.bucket, Key: key(name), Body: body, ContentType: contentType }),
  );
}

/** ¿Existe el objeto? (para servir 404 reales sin exponer el backend). */
export async function hasObject(name: string): Promise<boolean> {
  if (storageConfig.backend === "local") {
    try {
      await fs.promises.access(path.join(storageConfig.localDir, path.basename(name)), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }
  try {
    await client().send(new HeadObjectCommand({ Bucket: storageConfig.bucket, Key: key(name) }));
    return true;
  } catch {
    return false;
  }
}

/**
 * URL para servir el archivo al navegador. En local devuelve null (se sirve
 * desde disco como siempre). En s3 devuelve una URL prefirmada de 15 min con
 * Content-Type y Content-Disposition fijados (el bucket es privado).
 */
export async function getServeUrl(name: string, contentType: string, downloadName: string, inline: boolean): Promise<string | null> {
  if (storageConfig.backend === "local") return null;
  const disposition = `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(downloadName).replace(/['()]/g, escape).replace(/\*/g, "%2A")}"`;
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: storageConfig.bucket,
      Key: key(name),
      ResponseContentType: contentType,
      ResponseContentDisposition: disposition,
    }),
    { expiresIn: 15 * 60 },
  );
}

/** Lee el objeto completo (vista previa del Visor). null si no existe. */
export async function readObject(name: string): Promise<Buffer | null> {
  if (storageConfig.backend === "local") {
    try {
      return await fs.promises.readFile(path.join(storageConfig.localDir, path.basename(name)));
    } catch {
      return null;
    }
  }
  try {
    const out = await client().send(new GetObjectCommand({ Bucket: storageConfig.bucket, Key: key(name) }));
    return out.Body ? Buffer.from(await out.Body.transformToByteArray()) : null;
  } catch {
    return null;
  }
}

/** Directorio temporal para las subidas en tránsito (ambos backends). */
export function tmpDir(): string {
  return storageConfig.backend === "local" ? storageConfig.localDir : os.tmpdir();
}
