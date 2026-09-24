import { PLATFORM_FEE_PCT } from "@hub/shared";

// FAQ de la landing (spec 17). Cada respuesta describe el comportamiento real
// del backend (spec 09 custodia, spec 16 muestra y pago verificado).
export interface Faq {
  icon: string;
  topic: string;
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    icon: "school",
    topic: "General",
    q: "¿Qué es Universo Agustino y cómo funciona?",
    a: "Es la plataforma de apuntes de la comunidad UNSA. Los estudiantes suben resúmenes, PAE, balotarios y guías; tú exploras por escuela, curso y ciclo, revisas las páginas de muestra gratis y compras solo lo que necesitas.",
  },
  {
    icon: "alternate_email",
    topic: "Cuenta",
    q: "¿Necesito un correo @unsa.edu.pe?",
    a: "Sí. Solo se pueden crear cuentas con el correo institucional @unsa.edu.pe. Así la comunidad es exclusiva de estudiantes agustinos y cada vendedor es identificable.",
  },
  {
    icon: "lock_open",
    topic: "Documentos",
    q: "¿Cómo desbloqueo un documento completo?",
    a: "Cada vendedor elige qué páginas se ven gratis como muestra. Para el resto, pulsa «Desbloquear» y paga: el documento se abre en tu cuenta en cuanto el pago queda verificado y lo encuentras siempre en Mis pedidos.",
  },
  {
    icon: "payments",
    topic: "Pagos",
    q: "¿Cómo se paga?",
    a: "Con Yape o Plin al QR del vendedor: registras el número de operación o subes tu voucher y el vendedor confirma que recibió el dinero. Cuando la pasarela Mercado Pago está activa, también puedes pagar con tarjeta y la confirmación es automática.",
  },
  {
    icon: "timer",
    topic: "Pagos",
    q: "¿Por qué mi pedido tiene un tiempo límite?",
    a: "Al crear un pedido el artículo queda reservado para ti durante 30 minutos. Si no registras el pago en ese plazo, la reserva se cancela sola y el artículo vuelve a estar disponible para otros.",
  },
  {
    icon: "percent",
    topic: "Vender",
    q: `¿Cuánto cobra la plataforma? (comisión del ${PLATFORM_FEE_PCT} %)`,
    a: `La plataforma retiene una comisión del ${PLATFORM_FEE_PCT} % de cada venta y el ${100 - PLATFORM_FEE_PCT} % restante es del vendedor. La comisión se calcula al crear el pedido y aparece desglosada en el resumen del pedido; no hay suscripciones ni costos por publicar.`,
  },
  {
    icon: "sell",
    topic: "Vender",
    q: "¿Cómo vendo mis apuntes?",
    a: "Sube tu material propio (PDF o imagen), elige precio, curso y las páginas de muestra. Solo puedes vender contenido de tu autoría: respetamos el D.L. 822 y atendemos reportes de infracción en menos de 48 horas.",
  },
  {
    icon: "shield_lock",
    topic: "Custodia",
    q: "¿Qué pasa con mi dinero después de pagar?",
    a: "Cuando el pago se verifica, el pedido pasa a custodia (escrow) y la venta no se cierra hasta que confirmas que tienes el documento o el artículo; al confirmar, el pago se libera al vendedor. Si algo sale mal antes de confirmar, puedes reportarlo y pedir el reembolso.",
  },
  {
    icon: "handshake",
    topic: "Bazar",
    q: "¿Cómo funcionan las entregas del Bazar?",
    a: "En el Bazar se venden o alquilan libros, instrumentos y uniformes. Coordinas con el vendedor un punto de encuentro en el campus, revisas el artículo en persona y recién entonces confirmas la recepción. En alquileres, el anuncio indica la garantía y el plazo acordado.",
  },
  {
    icon: "currency_exchange",
    topic: "Reembolsos",
    q: "¿Cuál es la política de reembolsos?",
    a: "Si el documento no corresponde a lo publicado, el archivo falla o el artículo no se entregó, no confirmes la recepción y abre un reporte desde Mis ventas › Mis reportes. Moderación lo revisa en menos de 48 horas y gestiona el reembolso de pedidos pagados o en custodia. Una vez que confirmas la recepción, el pago se libera y ya no es reembolsable.",
  },
  {
    icon: "water_drop",
    topic: "Seguridad",
    q: "¿Por qué el visor muestra mi nombre como marca de agua?",
    a: "Para proteger el trabajo de los autores, las páginas de pago llevan una marca de agua con tu nombre y parte de tu correo. Así una filtración se puede rastrear; tu lectura normal no se ve afectada.",
  },
];
