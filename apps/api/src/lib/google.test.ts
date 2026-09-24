import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { verifyGoogleIdToken } from "./google.js";
import { checkGoogleIdentity } from "../modules/auth/oauth/identity.js";

// id_token firmado con un par RSA efímero: prueba la cadena completa
// firma → claims → puerta UNSA sin depender de Google.
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const pub = publicKey.export({ format: "jwk" }) as { n: string; e: string };
const jwks = { keys: [{ kid: "g1", kty: "RSA", n: pub.n, e: pub.e }] };
const AUD = "123.apps.googleusercontent.com";

function sign(claims: Record<string, unknown>, key = privateKey): string {
  const h = Buffer.from(JSON.stringify({ alg: "RS256", kid: "g1" })).toString("base64url");
  const p = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${h}.${p}.${crypto.sign("sha256", Buffer.from(`${h}.${p}`), key).toString("base64url")}`;
}

const base = () => ({
  iss: "https://accounts.google.com",
  aud: AUD,
  exp: Math.floor(Date.now() / 1000) + 600,
  sub: "g-sub-1",
  email: "rosa.quispe@unsa.edu.pe",
  email_verified: true,
  hd: "unsa.edu.pe",
  name: "Rosa Quispe",
});

describe("verifyGoogleIdToken", () => {
  it("acepta un id_token válido de una cuenta UNSA y pasa la puerta", () => {
    const me = verifyGoogleIdToken(jwks, sign(base()), AUD);
    expect(me).toMatchObject({ sub: "g-sub-1", email: "rosa.quispe@unsa.edu.pe", email_verified: true, hd: "unsa.edu.pe" });
    expect(checkGoogleIdentity(me)).toMatchObject({ ok: true, email: "rosa.quispe@unsa.edu.pe" });
  });

  it("rechaza tokens falsificados, de otra app, vencidos o de otro emisor", () => {
    const other = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    expect(() => verifyGoogleIdToken(jwks, sign(base(), other), AUD)).toThrow("firma");
    expect(() => verifyGoogleIdToken(jwks, sign(base()), "otra-app")).toThrow("aud");
    expect(() => verifyGoogleIdToken(jwks, sign({ ...base(), exp: 1 }), AUD)).toThrow("exp");
    expect(() => verifyGoogleIdToken(jwks, sign({ ...base(), iss: "https://evil.com" }), AUD)).toThrow("iss");
  });

  it("un Gmail personal firmado por Google no pasa la puerta UNSA", () => {
    const me = verifyGoogleIdToken(jwks, sign({ ...base(), email: "rosa@gmail.com", hd: undefined }), AUD);
    expect(checkGoogleIdentity(me)).toMatchObject({ ok: false, code: "EMAIL_NO_AUTORIZADO" });
  });
});
