import type { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../middleware/errors.js";
import { jwksFetcher } from "../../../lib/idToken.js";
import { verifyGoogleIdToken } from "../../../lib/google.js";
import { checkGoogleIdentity, type GoogleProfile } from "./identity.js";
import { auditAuth, fail, findOrCreateOAuthUser, googleCfg, issueSession, signState, validState } from "./session.js";

interface GoogleToken {
  access_token?: string;
  id_token?: string;
}

const googleJwks = jwksFetcher("https://www.googleapis.com/oauth2/v3/certs");

async function exchange(code: string, cfg: NonNullable<ReturnType<typeof googleCfg>>): Promise<GoogleToken | null> {
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: cfg.id, client_secret: cfg.secret, redirect_uri: cfg.redirect, grant_type: "authorization_code" }).toString(),
    });
    return r.ok ? ((await r.json()) as GoogleToken) : null;
  } catch {
    return null;
  }
}

const revoke = async (token?: string) => {
  if (token) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST" }).catch(() => undefined);
};

// Google: inicio (redirect) y callback (código → id_token firmado → puerta UNSA).
export function registerGoogle(router: Router, limiter: RequestHandler) {
  router.get(
    "/google",
    limiter,
    asyncHandler(async (_req, res) => {
      const cfg = googleCfg();
      if (!cfg) return res.status(503).json({ error: { code: "OAUTH_NO_CONFIGURADO", message: "Ingreso con Google aún no disponible" } });
      const q = new URLSearchParams({ client_id: cfg.id, redirect_uri: cfg.redirect, response_type: "code", scope: "openid email profile", access_type: "online", prompt: "select_account", state: signState() });
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`);
    }),
  );

  router.get(
    "/google/callback",
    limiter,
    asyncHandler(async (req, res) => {
      const cfg = googleCfg();
      if (!cfg) return fail(res, "OAUTH_NO_CONFIGURADO");
      if (!validState(req.query.state)) return fail(res, "STATE_INVALIDO");
      const code = typeof req.query.code === "string" ? req.query.code : "";
      if (!code) return fail(res, "CODE_FALTANTE");
      const tokens = await exchange(code, cfg);
      if (!tokens?.id_token) return fail(res, "INTERCAMBIO_FALLIDO");
      // La identidad sale del id_token firmado por Google (firma, emisor,
      // audiencia = nuestro client id, vigencia), no de datos del navegador.
      let me: GoogleProfile;
      try {
        me = verifyGoogleIdToken(await googleJwks(), tokens.id_token, cfg.id);
      } catch {
        await revoke(tokens.access_token);
        return fail(res, "TOKEN_INVALIDO");
      }
      // REGLA DE DOMINIO: sin @unsa.edu.pe verificado del Workspace UNSA (ni
      // excepción) no hay sesión, y se revoca el token recién emitido en
      // Google: no queda nada vivo.
      const id = checkGoogleIdentity(me);
      if (!id.ok) {
        await revoke(tokens.access_token);
        if (id.code === "EMAIL_NO_AUTORIZADO") await auditAuth("system", "auth.oauth.denied", id.email);
        return fail(res, id.code);
      }
      const found = await findOrCreateOAuthUser({ provider: "google", providerId: id.sub, email: id.email, fullName: id.fullName, avatarUrl: id.avatarUrl });
      if (found.conflict || !found.user) return fail(res, "PROVEEDOR_DISTINTO");
      await auditAuth(found.user.id, "auth.oauth.login", found.user.id);
      await issueSession(res, found.user.id, found.user.role);
    }),
  );
}
