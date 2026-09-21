import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Sprint 4 (F4-01): verificación de contenido real por firma mágica.
// La extensión del nombre NO es prueba: un .exe renombrado a .jpg debe
// caer con 415 aunque pase el filtro de extensiones de multer.
interface Signature {
  mime: string;
  ext: string[];
  test: (head: Buffer, tail: Buffer) => boolean;
}

const PDF_MAGIC = "%PDF-";
const JPEG_SOI = Buffer.from([0xff, 0xd8]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const SIGNATURES: Signature[] = [
  {
    mime: "application/pdf",
    ext: [".pdf"],
    test: (head) => head.subarray(0, 5).toString("latin1") === PDF_MAGIC,
  },
  {
    mime: "image/jpeg",
    ext: [".jpg", ".jpeg"],
    test: (head, tail) =>
      head.length >= 2 &&
      head.subarray(0, 2).equals(JPEG_SOI) &&
      tail.length === 2 &&
      tail.equals(JPEG_EOI),
  },
  {
    mime: "image/png",
    ext: [".png"],
    test: (head) => head.length >= 8 && head.subarray(0, 8).equals(PNG_MAGIC),
  },
  {
    mime: "application/epub+zip",
    ext: [".epub"],
    test: (head) => {
      // EPUB = ZIP cuyo primer entry es el archivo "mimetype" con el valor
      // exacto. Offsets fijos NO sirven (el header local tiene campos de
      // longitud variable): se busca el marcador en los primeros 256 bytes.
      if (head.length < 4 || !head.subarray(0, 4).equals(ZIP_MAGIC)) return false;
      const window = head.subarray(0, Math.min(head.length, 256)).toString("latin1");
      const at = window.indexOf("mimetype");
      if (at < 0) return false;
      return window.slice(at, at + 30).includes("application/epub+zip");
    },
  },
];

/** Lee cabeza (≤4100B) y cola (2B) sin cargar el archivo en memoria. */
async function headTail(filePath: string): Promise<{ head: Buffer; tail: Buffer; size: number }> {
  const fh = await fs.promises.open(filePath, "r");
  try {
    const { size } = await fh.stat();
    const headLen = Math.min(4100, size);
    const head = Buffer.alloc(headLen);
    if (headLen > 0) await fh.read(head, 0, headLen, 0);
    const tailLen = Math.min(2, size);
    const tail = Buffer.alloc(tailLen);
    if (tailLen > 0) await fh.read(tail, 0, tailLen, Math.max(0, size - 2));
    return { head, tail, size };
  } finally {
    await fh.close();
  }
}

/**
 * Verifica que el contenido coincida con la extensión declarada.
 * Devuelve el MIME detectado o lanza { status: 415 } / { status: 400 }.
 */
export async function verifyUpload(filePath: string, originalName: string): Promise<string> {
  const { head, tail, size } = await headTail(filePath);
  if (size === 0) {
    const e = new Error("El archivo está vacío") as Error & { status?: number; code?: string };
    e.status = 400;
    e.code = "VALIDATION";
    throw e;
  }
  const ext = path.extname(originalName).toLowerCase();
  const match = SIGNATURES.find((s) => s.ext.includes(ext) && s.test(head, tail));
  if (!match) {
    const e = new Error("El contenido del archivo no coincide con su extensión.") as Error & {
      status?: number;
      code?: string;
    };
    e.status = 415;
    e.code = "UNSUPPORTED_FILE_TYPE";
    throw e;
  }
  return match.mime;
}

export function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash("sha256");
    const s = fs.createReadStream(filePath);
    s.on("error", reject);
    s.on("data", (c) => h.update(c));
    s.on("end", () => resolve(h.digest("hex")));
  });
}

/** Nombre mostrado saneado: sin rutas, sin controles, máx 200 chars. */
export function sanitizeFilename(name: string): string {
  const base = path.basename(name);
  let out = "";
  for (const ch of base) {
    const code = ch.codePointAt(0) ?? 32;
    if (code < 32 || code === 127) continue;
    out += ch;
  }
  out = out.replace(/^\.+/, "").slice(0, 200);
  return out || "archivo";
}
