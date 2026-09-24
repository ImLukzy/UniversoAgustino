import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { verifyAppleIdToken, type AppleJwks } from "./apple.js";

// Verifica RS256 contra JWKS sin depender de Apple: se genera un par RSA
// efímero, se firma un id_token con la privada y se valida con la pública.
function makeKey() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" }) as { n?: string; e?: string };
  if (!jwk.n || !jwk.e) throw new Error("sin-jwk");
  return { privateKey, jwks: { keys: [{ kid: "k1", kty: "RSA", n: jwk.n, e: jwk.e }] } satisfies AppleJwks };
}

function signIdToken(
  privateKey: crypto.KeyObject,
  claims: Record<string, unknown>,
  kid = "k1",
): string {
  const h = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString("base64url");
  const p = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = crypto.sign("sha256", Buffer.from(`${h}.${p}`), privateKey);
  return `${h}.${p}.${sig.toString("base64url")}`;
}

const AUD = "com.ua.web";
const baseClaims = () => ({
  iss: "https://appleid.apple.com",
  aud: AUD,
  exp: Math.floor(Date.now() / 1000) + 600,
  sub: "apple-sub-1",
  email: "rosa.quispe@unsa.edu.pe",
  email_verified: "true",
});

describe("verifyAppleIdToken", () => {
  it("acepta un token válido y extrae identidad", () => {
    const { privateKey, jwks } = makeKey();
    const id = verifyAppleIdToken(jwks, signIdToken(privateKey, baseClaims()), AUD);
    expect(id).toEqual({ sub: "apple-sub-1", email: "rosa.quispe@unsa.edu.pe", emailVerified: true });
  });

  it("rechaza firma manipulada, aud distinto, expirado e iss falso", () => {
    const { privateKey, jwks } = makeKey();
    const good = signIdToken(privateKey, baseClaims());
    const tampered = good.slice(0, -4) + "AAAA";
    expect(() => verifyAppleIdToken(jwks, tampered, AUD)).toThrow("firma");
    expect(() => verifyAppleIdToken(jwks, signIdToken(privateKey, baseClaims()), "otra-app")).toThrow("aud");
    expect(() =>
      verifyAppleIdToken(jwks, signIdToken(privateKey, { ...baseClaims(), exp: 1 }), AUD),
    ).toThrow("exp");
    expect(() =>
      verifyAppleIdToken(jwks, signIdToken(privateKey, { ...baseClaims(), iss: "https://evil.com" }), AUD),
    ).toThrow("iss");
  });

  it("marca emailVerified=false cuando Apple no lo confirma", () => {
    const { privateKey, jwks } = makeKey();
    const id = verifyAppleIdToken(
      jwks,
      signIdToken(privateKey, { ...baseClaims(), email_verified: "false" }),
      AUD,
    );
    expect(id.emailVerified).toBe(false);
  });
});
