import { verifyIdToken, type Jwks } from "./idToken.js";
import type { GoogleProfile } from "../modules/auth/oauth/identity.js";

// id_token de Google (OpenID Connect): firma RS256 contra
// https://www.googleapis.com/oauth2/v3/certs, emisor de Google, audiencia =
// nuestro GOOGLE_CLIENT_ID y vigencia. Solo tras esto se leen sus claims
// (email, email_verified, hd), que luego pasan por checkGoogleIdentity().
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export function verifyGoogleIdToken(jwks: Jwks, token: string, audience: string, nowSec = Math.floor(Date.now() / 1000)): GoogleProfile {
  const c = verifyIdToken(jwks, token, { issuers: ISSUERS, audience }, nowSec);
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    sub: str(c.sub),
    email: str(c.email),
    email_verified: c.email_verified === true || c.email_verified === "true",
    hd: str(c.hd),
    name: str(c.name),
    picture: str(c.picture),
  };
}
