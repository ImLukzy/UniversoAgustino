// Sprint F1-01: envío de correos con driver intercambiable.
// ConsoleDriver (desarrollo): imprime el enlace en stdout con console.log
// directo — NUNCA vía logger estructurado (ver F0-01: el logger redacta
// tokens y la salida estructurada viaja al agregador). Su uso en producción
// lo bloquea la validación de entorno (F4-03).
interface MailDriver {
  send(to: string, subject: string, html: string): Promise<void>;
}

function resetTemplate(url: string): string {
  return `<p>Restablece tu contraseña de Universo Agustino (caduca en 30 minutos):</p><p><a href="${url}">${url}</a></p>`;
}

function loginCodeTemplate(code: string): string {
  return `<p>Tu código de ingreso a Universo Agustino es:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Caduca en 10 minutos. Si no lo pediste, ignora este correo.</p>`;
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

// Spec 22: proveedor HTTP real (Resend) sin dependencias extra.
class ResendDriver implements MailDriver {
  async send(to: string, subject: string, html: string): Promise<void> {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM ?? "Universo Agustino <no-reply@universoagustino.pe>", to: [to], subject, html }),
    });
    if (!r.ok) throw new Error(`resend_${r.status}`);
  }
}

const driverName = () => process.env.MAIL_DRIVER ?? "console";

function driver(): MailDriver {
  const d = driverName();
  if (d === "resend") return new ResendDriver();
  if (d === "smtp") return new SmtpDriver();
  return new ConsoleDriver();
}

export const mailer = {
  // En producción el driver de consola no entrega nada: el ingreso por código
  // se apaga (503) en lugar de aceptar correos que nadie recibirá.
  canDeliver(): boolean {
    return driverName() !== "console" || (process.env.NODE_ENV ?? "development") !== "production";
  },
  sendPasswordReset(to: string, url: string): Promise<void> {
    return driver().send(to, "Restablece tu contraseña — Universo Agustino", resetTemplate(url));
  },
  sendLoginCode(to: string, code: string): Promise<void> {
    return driver().send(to, `${code} es tu código de Universo Agustino`, loginCodeTemplate(code));
  },
};
