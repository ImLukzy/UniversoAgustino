# Contexto del proyecto — Universo Agustino

Resumen operativo contrastado con el código. Para rutas y payloads, la fuente única es [`apps/api/docs/openapi.yaml`](../apps/api/docs/openapi.yaml); para modelos, [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).

## Producto y stack

Marketplace académico para la comunidad UNSA: apuntes digitales con vista previa y visor protegido, bazar de artículos en venta o alquiler, custodia y balotarios estáticos. Monorepo npm con `apps/api` (Express, Prisma, Postgres), `apps/web` (React/Vite) y `packages/shared` (Zod, tipos y reglas compartidas). Node requerido: 24.x.

El catálogo incluye 20 carreras con tema visual. La web usa `bg-white`/`bg-zinc-50`, tokens `--hub-p*` y acentos `primary`/`primary-soft`; el teal base es `#00685F`. El movimiento compartido usa `SPRING` de `apps/web/src/lib/motion.ts` (stiffness 400, damping 30). `/login` y `/register` son rutas que abren el modal de acceso; no son páginas de formulario independientes. El layout comparte sidebar de 264 px en escritorio, header con un formulario de búsqueda global y drawer en móvil; distintas rutas lo montan desde el router o desde el propio componente.

## Roles y acceso

Los roles son `student`, `creator`, `moderator` y `admin`. El acceso institucional admite `@unsa.edu.pe` y la excepción configurada en `packages/shared/src/common.ts`. El access token vive en memoria; el refresh usa cookie httpOnly `hub_refresh`. Las peticiones con cookie validan el origen exacto.

- Estudiante: consulta, compra, guarda publicaciones y reporta contenido o usuarios.
- Creador/vendedor: publica y administra sus propios documentos y artículos; puede pausar y reanudar sus publicaciones.
- Moderator: revisa reportes/publicaciones, retira contenido y opera funciones de equipo autorizadas.
- Admin (técnico): puede restaurar publicaciones y ejecutar acciones de equipo restringidas, como completar reembolsos.

## Publicaciones y moderación

El dueño puede editar, pausar/reanudar y eliminar sus publicaciones conforme a las reglas del catálogo. El equipo puede retirar una publicación por moderación; el registro conserva `removedAt`, motivo y actor. La restauración es exclusiva de admin. Los usuarios autenticados pueden crear reportes desde una publicación; los reportes tienen categoría, tipo de objetivo y estado. El equipo decide acción o descarte; las faltas, sanciones y reseñas se registran en los módulos de moderación. Las notificaciones se agrupan en las categorías `orders`, `publications` y `team`.

## Dinero y entregas

La comisión predeterminada es **13 % y la asume el vendedor**. `computePrice()` calcula fee y neto; los pedidos guardan snapshots y cumplen `amount = fee + net`. La regla procede de RFC 0003 y specs 36–40; los pedidos históricos conservan su snapshot.

El equipo es intermediario. En el pago digital el comprador elige una cuenta administrada por el equipo, transfiere y sube el comprobante; un trabajador lo acepta o deniega. Al confirmarse el pago, el pedido entra en custodia y el contenido digital se habilita según su estado. Tras completar la operación se liquida al vendedor el neto con comprobante. La confirmación manual del vendedor no sustituye la verificación del equipo. Mercado Pago está deshabilitado por la mediación de equipo aunque existan credenciales.

En bazar físico, el comprador paga en sede al trabajador y presenta el comprobante correspondiente; el equipo registra y verifica el pago, coordina la entrega/custodia y libera o devuelve el dinero conforme al flujo aplicable. Los casos, citas, sedes y mensajes se gestionan en los módulos de custodia.

Los pedidos usan `PENDING`, `ACCEPTED` (cuando aplica), `PAID`, `ESCROW`, `RELEASED`, `CANCELLED` o `REFUNDED`; las transiciones se validan en el backend. La comisión se calcula desde `PLATFORM_FEE_PCT` (por defecto 13 en la aplicación; el despliegue puede sobrescribirlo, así que verifica la configuración activa antes de operar).

## Seguridad y archivos

Auth clásica, código por correo y OAuth Google/Apple están implementados; proveedores externos requieren credenciales. Los archivos se validan por firma y pueden servirse desde disco local o R2. Los uploads marcados privados requieren sesión y autorización por propietario, rol de equipo o relación con pedido/pago; el archivo digital completo también exige acceso de compra, según el flujo.

Los límites concretos se configuran por endpoint: global 300/min; login/registro 50/15 min; inicio de código 10/h por IP y 5/h por correo; verificación de código 30/15 min; uploads 30/h. Forgot y OAuth tienen sus propios limitadores. No asumir un único límite para todos los endpoints.

## Trabajo y verificación

- `npm run verify`: compilación shared, Prisma generate, typecheck, lint, docs:check, secretos, presupuestos, subset de iconos y tests.
- `npm run qa:seed`: carga idempotente de datos de QA en una base permitida; sus cuentas usan dominio UNSA para pasar la validación real de acceso y son fixtures identificadas como `qa-*`.
- `npm run e2e`: flujos E2E locales; `npm run e2e:ci`: ejecución contra una base CI efímera.
- Despliegue: web con Vercel (`vercel.json`) y API con Render (`render.yaml`), ambos sobre Node 24. Migraciones mediante el comando predeploy de Render.

La API responde `{data}` en éxito y `{error:{code,message,...}}` en error. Consulta [`API_SPECS.md`](API_SPECS.md) para convenciones y OpenAPI para el contrato exacto.
