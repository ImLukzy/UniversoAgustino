import type { RequestHandler, Router } from "express";
import { isAllowedEmail } from "@hub/shared";
import { verifyAppleIdToken } from "../../../lib/apple.js";
import { jwksFetcher } from "../../../lib/idToken.js";
import { asyncHandler } from "../../../middleware/errors.js";
import { appleCfg, auditAuth, fail, findOrCreateOAuthUser, issueSession, signState, validState } from "./session.js";

const appleJwks = jwksFetcher("https://appleid.apple.com/auth/keys");

// Apple envía `user` (JSON con nombre) solo la primera vez.
function nameFrom(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  try {
    const u = JSON.parse(raw) as { name?: { firstName?: string; lastName?: string } };
    return `${u.name?.firstName ?? ""} ${u.name?.lastName ?? ""}`.trim() || fallback;
  } catch {
    return fallback;
  }
}

// Apple: inicio (redirect) y callback form_post con id_token.
export function registerApple(router: Router, limiter: RequestHandler) {
  router.get(
    "/apple",
    limiter,
    asyncHandler(async (_req, res) => {
      const cfg = appleCfg();
      if (!cfg) return res.status(503).json({ error: { code: "OAUTH_NO_CONFIGURADO", message: "Ingreso con Apple aún no disponible" } });
      const q = new URLSearchParams({ client_id: cfg.id, redirect_uri: cfg.redirect, response_type: "code id_token", scope: "name email", response_mode: "form_post", state: signState() });
      res.redirect(`https://appleid.apple.com/auth/authorize?${q.toString()}`);
    }),
  );

  router.post(
    "/apple/callback",
    limiter,
    asyncHandler(async (req, res) => {
      const cfg = appleCfg();
      if (!cfg) return fail(res, "OAUTH_NO_CONFIGURADO");
      if (!validState(req.body?.state)) return fail(res, "STATE_INVALIDO");
      const idToken = typeof req.body?.id_token === "string" ? req.body.id_token : "";
      if (!idToken) return fail(res, "CODE_FALTANTE");
      // El id_token ya trae la identidad: se valida sin intercambiar el code
      // (sin client_secret). Si el dominio falla no se crea nada local.
      let ident: { sub: string; email: string; emailVerified: boolean };
      try {
        ident = verifyAppleIdToken(await appleJwks(), idToken, cfg.id);
      } catch {
        return fail(res, "TOKEN_INVALIDO");
      }
      const email = ident.email.toLowerCase();
      if (!ident.emailVerified) return fail(res, "EMAIL_NO_VERIFICADO");
      if (!isAllowedEmail(email)) {
        await auditAuth("system", "auth.oauth.denied", email);
        return fail(res, "EMAIL_NO_AUTORIZADO");
      }
      const found = await findOrCreateOAuthUser({ provider: "apple", providerId: ident.sub, email, fullName: nameFrom(req.body?.user, email.split("@")[0]), avatarUrl: null });
      if (found.conflict || !found.user) return fail(res, "PROVEEDOR_DISTINTO");
      await auditAuth(found.user.id, "auth.oauth.login", found.user.id);
      await issueSession(res, found.user.id, found.user.role);
    }),
  );
}
