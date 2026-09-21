// Sprint F1-01: envío de correos con driver intercambiable.
// ConsoleDriver (desarrollo): imprime el enlace en stdout con console.log
// directo — NUNCA vía logger estructurado (ver F0-01: el logger redacta
// tokens y la salida estructurada viaja al agregador). Su uso en producción
// lo bloquea la validación de entorno (F4-03).
export interface MailDriver {
  send(to: string, subject: string, html: string): Promise<void>;
}

function resetTemplate(url: string): string {
  return `<p>Restablece tu contraseña de Universo Agustino (caduca en 30 minutos):</p><p><a href="${url}">${url}</a></p>`;
}

class ConsoleDriver implements MailDriver {
  async send(to: string, subject: string, html: string): Promise<void> {
    console.log(`[mail:console] to=${to} subject=${subject} body=${html}`);
  }
}

class SmtpDriver implements MailDriver {
  async send(): Promise<void> {
    throw new Error("MAIL_DRIVER=smtp sin proveedor configurado (ver F4-03).");
  }
}

function driver(): MailDriver {
  const d = process.env.MAIL_DRIVER ?? "console";
  if (d === "smtp") return new SmtpDriver();
  return new ConsoleDriver();
}

export const mailer = {
  sendPasswordReset(to: string, url: string): Promise<void> {
    return driver().send(to, "Restablece tu contraseña — Universo Agustino", resetTemplate(url));
  },
};
