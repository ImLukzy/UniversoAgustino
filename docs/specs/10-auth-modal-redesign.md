# Especificación: 10 - Rediseño del Modal de Autenticación

## 1. Objetivo y Contexto
**Descripción:** No existe la página `/login`; el modal global `components/AuthModalHost.tsx` (244 líneas al redactar; hoy 92) gestiona login y registro. `Forgot.tsx` sigue como página (`pages/Register.tsx` fue eliminada). OAuth Google/Apple está implementado pero **apagado sin credenciales**.
**Objetivo técnico:** Construir un modal login/registro ultra premium estilo Studocu. Incluye la validación estricta del correo institucional `@unsa.edu.pe` en el cliente (espejo del servidor) y la selección de carrera en el registro, que inyecta su color al instante.

## 2. Referencia UI/UX (Studocu + Dynamic Colors)
- **Modal:**
  - `max-w-sm`, `rounded-2xl` y `bg-white` sobre un backdrop `bg-zinc-900/40` con `backdrop-blur-sm`.
  - Entrada con escala 0.96→1 y spring 400/30, salida con `AnimatePresence`.
- **Estructura:**
  - Tabs `Iniciar sesión | Crear cuenta` con el indicador animado (`layoutId`).
  - Botones OAuth ("Continuar con Google/Apple") visibles **solo** si la API reporta que están habilitados.
  - Separador "o" y el formulario.
- **Registro:**
  - Correo, contraseña, nombre y la carrera en una grilla de 15 chips con el color de cada carrera.
  - Al elegir una carrera, el modal completo (botón, foco, indicador) adopta su color vía `setCareer()` de `useCareerTheme()`.
  - Ciclo como select.
- **Validación:**
  - En vivo, con check/cross junto al correo: "Usa tu correo @unsa.edu.pe".
  - Contraseña con medidor sin inventar reglas: las mismas del schema Zod.
- **Accesibilidad:** focus trap, `Esc` cierra, `aria-modal` y un foco inicial en el correo. Altura estable entre tabs (sin salto).

## 3. Arquitectura y Lógica de Negocio
- **API:**
  - `POST /auth/register`, `POST /auth/login` y `POST /auth/refresh` (cookie httpOnly `hub_refresh`).
  - `GET /auth/me`, `PATCH /auth/profile`, `POST /auth/forgot` y `POST /auth/reset`.
  - `/auth/oauth/*` con `state` firmado.
- **Dominio:**
  - La puerta es `isAllowedEmail()` de `@hub/shared` (`@unsa.edu.pe` + la única excepción tecsup autorizada). El cliente la **importa**, no la duplica.
  - El servidor sigue siendo la autoridad.
- **Schemas:** `RegisterSchema` y `LoginSchema` de `@hub/shared` (Zod) para los mensajes de error. La carrera se valida con `CareerSchema` (1:1 con `data/unsa.ts`).
- **Errores:** contrato `{ error: { code, message } }`.
  - `OAUTH_ONLY` → "Esta cuenta usa Google/Apple".
  - Dominio denegado → mensaje claro.
  - Rate limit de login (50/15 min) → aviso.
- **Sesión:** el access JWT se guarda en memoria (`AuthContext`). Tras registrarse se llama a `refreshMe`, y la carrera del perfil pasa a ser el tema por defecto.
- **Componentes** (`components/auth/` + `components/ui/Modal.tsx`): `Modal`, `AuthTabs`, `LoginForm`, `RegisterForm`, `CareerPicker` y `OAuthButtons`.

## 4. Checklist de Ejecución
- [x] Tarea 1: Crear `components/ui/Modal.tsx` (antes `components/auth/AuthModal.tsx`) (backdrop blur, spring 400/30, focus trap, Esc) y montarlo desde `AuthModalHost`.
- [x] Tarea 2: Crear `LoginForm` y `RegisterForm` con `LoginSchema`/`RegisterSchema` y `isAllowedEmail()` de `@hub/shared` (sin regex duplicada).
- [x] Tarea 3: Crear `CareerPicker` (15 chips con su acento) que llama a `setCareer()` y recolorea el modal en vivo.
- [x] Tarea 4: Crear `OAuthButtons`, renderizados solo si el backend los reporta habilitados.
- [x] Tarea 5: Mapear los errores `OAUTH_ONLY`, dominio denegado y rate limit a mensajes en español.
- [x] Tarea 6: Altura estable entre tabs (sin CLS); `AuthModalHost` por debajo de 150 líneas; typecheck, lint y test en verde.

## 6. Auditoría 2026-09-23 (spec vs. código)
- **Implementado.** `components/auth/` contiene `AuthTabs` (`layoutId`), `EmailStep`, `LoginForm`, `RegisterForm`, `CareerPicker` (`setCareer`), `OAuthButtons` (solo proveedores habilitados), `authErrors.ts` (`OAUTH_ONLY`, `EMAIL_NO_AUTORIZADO`, 429) y `LoginRequired`.
- **Cambio de estructura.** `auth/AuthModal.tsx` se eliminó: ahora `AuthModalHost` usa `components/ui/Modal.tsx`, el modal único de la app (focus trap, Esc, `aria-modal`, `SPRING`), que también usan `ConfirmModal` y `QrModal`.
- **Diferencia.** `isAllowedEmail()` se importa en `EmailStep.tsx`, paso previo de correo antes de login/registro, no dentro de los formularios.
- **Ampliación.**
  - `/login?next=` y `/register` abren el modal sobre la página de destino.
  - `lib/authRedirect.ts` conserva el destino durante OAuth.
  - `pages/AuthCallback.tsx` llama a `refreshMe()`.
  - El callback OAuth exige `state` (`STATE_INVALIDO`).
