import crypto from "node:crypto";

// Verificación RS256 de id_tokens OpenID (Google, Apple) contra su JWKS, sin
// dependencias extra: firma, emisor, audiencia y vencimiento. Pura y
// unit-testeable (ver apple.test.ts y google.test.ts).
export interface RsaJwk {
  kid: string;
  kty: string;
  use?: string;
  n: string;
  e: string;
}

export interface Jwks {
  keys: RsaJwk[];
}

function b64urlJson(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
}

export function verifyIdToken(
  jwks: Jwks,
  token: string,
  opts: { issuers: string[]; audience: string },
  nowSec = Math.floor(Date.now() / 1000),
): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) throw new Error("formato");
  const [h, p, s] = parts as [string, string, string];
  let header: { kid?: unknown; alg?: unknown };
  let claims: Record<string, unknown>;
  try {
    header = b64urlJson(h) as { kid?: unknown; alg?: unknown };
    claims = b64urlJson(p);
  } catch {
    throw new Error("formato");
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("alg");
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk || jwk.kty !== "RSA" || !jwk.n || !jwk.e) throw new Error("kid");
  const key = crypto.createPublicKey({ key: jwk as unknown as crypto.JsonWebKey, format: "jwk" });
  const ok = crypto.verify("sha256", Buffer.from(`${h}.${p}`), key, Buffer.from(s, "base64url"));
  if (!ok) throw new Error("firma");
  if (!opts.issuers.includes(String(claims.iss))) throw new Error("iss");
  if (claims.aud !== opts.audience) throw new Error("aud");
  if (typeof claims.exp !== "number" || claims.exp <= nowSec) throw new Error("exp");
  if (typeof claims.sub !== "string" || !claims.sub) throw new Error("claims");
  return claims;
}

// JWKS con caché en memoria (24 h): las claves rotan poco y el callback no
// debe depender de la red en cada ingreso.
export function jwksFetcher(url: string): () => Promise<Jwks> {
  let cache: { at: number; jwks: Jwks } | null = null;
  return async () => {
    if (cache && Date.now() - cache.at < 24 * 3600_000) return cache.jwks;
    const r = await fetch(url);
    if (!r.ok) throw new Error("jwks");
    const jwks = (await r.json()) as Jwks;
    cache = { at: Date.now(), jwks };
    return jwks;
  };
}
