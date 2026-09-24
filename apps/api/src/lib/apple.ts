import { verifyIdToken, type Jwks, type RsaJwk } from "./idToken.js";

// Identity token de Sign in with Apple: RS256 contra
// https://appleid.apple.com/auth/keys (ver apple.test.ts).
export type AppleJwk = RsaJwk;
export type AppleJwks = Jwks;

interface AppleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
}

export function verifyAppleIdToken(jwks: AppleJwks, token: string, audience: string, nowSec = Math.floor(Date.now() / 1000)): AppleIdentity {
  const claims = verifyIdToken(jwks, token, { issuers: ["https://appleid.apple.com"], audience }, nowSec);
  if (typeof claims.email !== "string" || !claims.email) throw new Error("claims");
  const verified = claims.email_verified === true || claims.email_verified === "true";
  return { sub: String(claims.sub), email: claims.email, emailVerified: verified };
}
