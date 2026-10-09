
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
    a: "El equipo recibe y verifica el pago. Para apuntes digitales eliges una cuenta activa del equipo y adjuntas la foto del comprobante. En bazar y apuntes físicos pagas al equipo al recoger en sede; el trabajador registra el comprobante o el efectivo.",
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
    q: "¿Cuánto cobra la plataforma?",
    a: "Comisión del 13 % a cargo del vendedor: recibes el 87 % del precio. El equipo cobra, coordina la entrega en sede y liquida al vendedor en 24–48 h. No hay suscripciones ni costos por publicar.",
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
    a: "El equipo verifica el pago y crea una liquidación del neto al vendedor en 24–48 h. El apunte digital queda disponible para siempre; en físico recibes el artículo en sede. Un reclamo antes de liquidar congela el pago para revisión del Técnico.",
  },
  {
    icon: "handshake",
    topic: "Bazar",
    q: "¿Cómo funcionan las entregas del Bazar?",
    a: "En el Bazar se venden o alquilan apuntes físicos, libros, instrumentos y uniformes. El equipo recibe el artículo, programa el recojo en sede y registra tu pago antes de entregar. En alquileres también coordina la devolución; el anuncio conserva el plazo acordado.",
  },
  {
    icon: "currency_exchange",
    topic: "Reembolsos",
    q: "¿Cuál es la política de reembolsos?",
    a: "Si el producto no corresponde a lo publicado, abre un reclamo desde tu pedido. Si la liquidación está pendiente queda congelada; el Técnico revisa el caso. Una devolución de dinero requiere su decisión y queda pendiente de gestión.",
  },
  {
    icon: "water_drop",
    topic: "Seguridad",
    q: "¿Por qué el visor muestra mi nombre como marca de agua?",
    a: "Para proteger el trabajo de los autores, las páginas de pago llevan una marca de agua con tu nombre y parte de tu correo. Así una filtración se puede rastrear; tu lectura normal no se ve afectada.",
  },
];
