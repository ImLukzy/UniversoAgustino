# OAuth social (Google + Apple) con puerta UNSA

El ingreso social es 100% funcional a nivel código, pero exige credenciales
que solo el propietario puede crear (Google Cloud / Apple Developer). Sin
ellas, los botones muestran el toast "aún no disponible".

El modal también ofrece **correo institucional con código de 6 dígitos**
(spec 22, `POST /auth/email/start` + `/verify`): funciona sin Google ni Apple.
En desarrollo el código se imprime en la terminal de la API
(`MAIL_DRIVER=console`); en producción configura `MAIL_DRIVER=resend`,
`RESEND_API_KEY` y `MAIL_FROM` con un dominio verificado en Resend.

## 1. Crear credenciales (propietario)

### Google (Google Cloud Console)
1. Crea un proyecto y configura la pantalla de consentimiento (externa).
2. APIs y servicios → Credenciales → **Crear credenciales → ID de cliente OAuth**:
   - Tipo: aplicación web.
   - URI de redirección autorizada: `http://localhost:4000/api/v1/auth/oauth/google/callback`
     (en producción, el dominio real con el mismo path).
3. Anota `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

### Apple (Apple Developer, requiere cuenta de pago)
1. Identifiers → **Services ID** (será el `APPLE_CLIENT_ID`, ej. `com.universoagustino.web`):
   - Activa "Sign in with Apple", configura el dominio y la Return URL:
     `http://localhost:4000/api/v1/auth/oauth/apple/callback`.
2. Keys → crea una clave Sign in with Apple (solo se necesita si en el futuro
   se intercambia `code`; hoy el backend valida el `id_token` directo y no
   usa client_secret de Apple).
3. Anota `APPLE_CLIENT_ID` y `APPLE_REDIRECT_URI`.

## 2. Variables de entorno (API, nunca commitear el `.env`)

```env
GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/oauth/google/callback
APPLE_CLIENT_ID=<service-id>
APPLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/oauth/apple/callback
```

Con las tres de Google vacías, `GET /auth/oauth/google` responde 503 y el
frontend mantiene el toast. Igual para Apple. `GET /auth/oauth/status`
dice qué proveedor está activo: `{ google, apple }`.

## 3. Flujo implementado

```
Web (modal) → GET /auth/oauth/google?next=/ ──302──▶ Google ──▶
GET /auth/oauth/google/callback?code&state ──302──▶ /auth/callback?code=
──POST /auth/oauth/consume──▶ { access } ──▶ /auth/me ──▶ inicio
```

- `state` firmado (JWT 10 min) con `next` anti-open-redirect (solo paths `/`).
- Callback: intercambia `code` (con `client_secret`) y toma la identidad
  **solo del `id_token`**, tras `verifyGoogleIdToken()` (`lib/google.ts`):
  firma RS256 contra `googleapis.com/oauth2/v3/certs` (caché de 24 h), `iss`
  de Google, `aud` = `GOOGLE_CLIENT_ID` y `exp`. Token inválido: revoca y
  `?error=TOKEN_INVALIDO`. Luego aplica `checkGoogleIdentity()`
  (`oauth/identity.ts`): `email_verified`, dominio exacto `@unsa.edu.pe` **y**
  claim `hd === "unsa.edu.pe"` (cuenta del Workspace UNSA; un Gmail con alias
  institucional se rechaza), salvo `ALLOWED_EMAIL_EXCEPTIONS`.
- **Dominio denegado**: revoca el token recién emitido en Google
  (`POST oauth2.googleapis.com/revoke`), audita `auth.oauth.denied` y
  redirige con `?error=EMAIL_NO_AUTORIZADO` (el frontend muestra el mensaje
  exacto exigido). No se crea usuario ni sesión local.
- Apple no entrega token revocable en este flujo (el `id_token` se valida
  sin intercambiar `code`): ante dominio denegado simplemente no se crea
  nada local. Sin sesión nuestra no hay nada que cerrar.
- Cuentas nuevas: rol `creator`, perfil con el nombre de Google/Apple y
  `onboardedAt` nulo. La web las lleva a `/bienvenida` (spec 21), un perfil
  obligatorio: correo bloqueado; nombre completo, facultad, carrera oficial,
  ciclo y celular. Se guarda con `POST /auth/onboarding` (una sola vez).
- Email existente con clave: se **vincula** al proveedor (email ya verificado
  por Google/Apple). Email con otro proveedor: `PROVEEDOR_DISTINTO`.
- Cuentas OAuth no tienen contraseña: `POST /auth/login` responde
  `OAUTH_ONLY` en vez de romper.
- `code` de un solo uso, 115 s, en memoria con barrido perezoso. En
  multi-instancia mover a store compartido (Redis).

## 4. Verificación sin credenciales (hoy)

- `tsc`, `eslint`, `vitest`: `verifyAppleIdToken` y `verifyGoogleIdToken`
  probados con claves RSA generadas (firma/aud/exp/iss); `checkGoogleIdentity`
  e `isAllowedEmail` con la regla exacta.
- En vivo: `/status` → `{false,false}`; `/google` y `/apple` → 503;
  `/consume` con código malo → 400; callback sin `code` → redirect error.
- Tras configurar credenciales: probar con `cuenta UNSA` y con `gmail`
  (debe denegar + revocar + mensaje exacto). Reiniciar la API al cambiar `.env`.
