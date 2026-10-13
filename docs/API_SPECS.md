# Guía de la API

La especificación completa y única de rutas, parámetros, esquemas, respuestas y códigos está en [`apps/api/docs/openapi.yaml`](../apps/api/docs/openapi.yaml) y se publica en `/docs`. No mantengas aquí una copia de sus operaciones; `npm run docs:check` valida que las rutas montadas estén documentadas.

## Convenciones

- Base: `/api/v1`; JSON salvo cargas multipart o callbacks de proveedor.
- Respuesta correcta: `{ "data": ... }`. Error: `{ "error": { "code", "message", ... } }`.
- Sesión: access token Bearer en memoria del cliente y refresh en cookie `hub_refresh` httpOnly. Las rutas de refresh/logout y otras con cookie verifican `Origin` exacto contra `WEB_ORIGIN` (`requireSameOrigin`, protección CSRF).
- Roles: `student`, `creator`, `moderator` y `admin`; los permisos específicos constan en OpenAPI. Moderación general permite moderator/admin; acciones técnicas como restaurar publicaciones o reembolsar requieren admin.
- Errores frecuentes: 400 validación, 401 sesión inválida, 403 permiso/origen, 404 inexistente, 409 conflicto de estado, 429 límite excedido.

## Grupos de rutas

- **Auth y OAuth**: registro, inicio de sesión, código por correo, onboarding, perfil, refresh/logout y proveedores Google/Apple.
- **Catálogo**: documentos y bazar, publicaciones propias, pausa/reanudación, vista previa, descarga y guardados.
- **Pedidos y pagos**: creación, aceptación/rechazo, comprobantes, verificación por el equipo, entrega, cancelación y consulta de cuentas de pago.
- **Cuentas del equipo y liquidaciones**: gestión de cuentas de pago, verificación de pagos y ciclo de payouts; consulta las restricciones de rol en OpenAPI.
- **Moderación**: reportes, acciones, revisiones, catálogo del equipo, usuarios, reseñas, faltas y sanciones.
- **Custodia física y sedes**: casos, mensajes, citas, recojo/devolución, agenda, métricas, sedes, horarios y turnos.
- **Notificaciones y archivos**: categorías y lectura de avisos; cargas con propósito y acceso protegido según tipo de archivo.
- **Pagos externos y utilidades**: configuración, endpoints de Mercado Pago, simulación, salud, readiness y resumen legal. Mercado Pago está bloqueado mientras rija `TEAM_MEDIATION`; ver [`payments.md`](payments.md).

## Datos

El esquema vigente está en [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma). Para modelos, campos y enums consulta esa fuente y los esquemas compartidos de `packages/shared`; esta guía no duplica tablas de Prisma.
