import { Analyst, License, NotificationLog, SmtpConfig } from '../types';
import { formatDateDisplay } from './dateUtils';

export const OFFICIAL_SENDER_EMAIL = 'procesos.dgsisan@gmail.com';

export interface EmailPayload {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  html: string;
  smtpConfig?: SmtpConfig;
}

export interface EmailLinks {
  mailtoUrl: string;
  outlookWebUrl: string;
  gmailWebUrl: string;
}

/**
 * Builds the complete formatted text and HTML for the license email
 */
export function buildLicenseEmailContent(
  license: License,
  analyst: Analyst,
  adminEmail: string,
  solicitante: Analyst
): { subject: string; text: string; html: string; to: string; cc: string } {
  const effectiveAdmin = (adminEmail || OFFICIAL_SENDER_EMAIL).trim().toLowerCase();
  
  // Recipients: Automated email to whoever makes the request (solicitante)
  // + the beneficiary analyst + administrator and system inbox (procesos.dgsisan@gmail.com)
  const recipientsSet = new Set<string>();
  
  // 1. Whoever makes the request (solicitante)
  if (solicitante.correo && solicitante.correo.trim()) {
    recipientsSet.add(solicitante.correo.trim().toLowerCase());
  }
  // 2. Beneficiary analyst
  if (analyst.correo && analyst.correo.trim()) {
    recipientsSet.add(analyst.correo.trim().toLowerCase());
  }
  // 3. Administrator / Official System Sender
  recipientsSet.add(effectiveAdmin);
  recipientsSet.add(OFFICIAL_SENDER_EMAIL.toLowerCase());

  const to = Array.from(recipientsSet).join(', ');
  const cc = '';

  const subject = `[DGSISAN Procesos] Solicitud de Licencia - ${analyst.nombre} (${license.motivo})`;

  const certStatus = license.certificado
    ? `Adjunto presentado: ${license.certificado.name} (${(license.certificado.size / 1024).toFixed(1)} KB)`
    : 'Sin comprobante adjunto';

  const text = `=======================================================
GOBIERNO DE LA CIUDAD DE BUENOS AIRES
DIRECCIÓN GENERAL DE SISTEMAS DE ATENCIÓN Y NOTIFICACIONES (DGSISAN)
SISTEMA DE GESTIÓN DE LICENCIAS - PROCESOS
=======================================================

NOTIFICACIÓN OFICIAL DE REGISTRO DE LICENCIA

Estimado/a Administrador/a y Solicitante,

Se ha registrado formalmente una nueva solicitud de licencia en el sistema.

DATOS DE LA SOLICITUD:
-------------------------------------------------------
• Analista Beneficiario/a: ${analyst.nombre}
• Correo del Analista: ${analyst.correo}
• CUIT: ${analyst.cuit}
• Teléfono: ${analyst.telefono}

DETALLE DE LA LICENCIA:
-------------------------------------------------------
• Motivo: ${license.motivo}
• Fecha de Inicio: ${formatDateDisplay(license.fechaInicio)}
• Días Hábiles Solicitados: ${license.diasHabiles} día(s)
• Certificado / Respaldatorio: ${certStatus}
• Observaciones: ${license.observaciones?.trim() || 'Sin observaciones'}
• Fecha de Registro en Sistema: ${new Date(license.fechaRegistro).toLocaleString('es-AR')}

RESPALDO Y EMISIÓN:
-------------------------------------------------------
• Remitente Oficial: ${OFFICIAL_SENDER_EMAIL}
• Administrador Notificado: ${effectiveAdmin}
• Solicitante (Constancia): ${solicitante.nombre} (${solicitante.correo})

Este mensaje sirve como constancia fehaciente del trámite registrado.
DGSISAN Procesos - Gobierno de la Ciudad Autónoma de Buenos Aires
=======================================================`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #1e40af; padding: 24px 28px; text-align: left; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    .body { padding: 28px; }
    .section-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 8px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
    .info-table td { padding: 8px 0; vertical-align: top; }
    .info-table .label { color: #64748b; width: 160px; font-weight: 500; font-size: 13px; }
    .info-table .value { color: #0f172a; font-weight: 600; }
    .alert-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #1e3a8a; margin: 16px 0; }
    .footer { background: #f8fafc; padding: 18px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge" style="background: rgba(255,255,255,0.2); color: #ffffff;">DGSISAN Procesos</span>
      <h1>Solicitud de Licencia Registrada</h1>
      <p>Gobierno de la Ciudad Autónoma de Buenos Aires</p>
    </div>
    <div class="body">
      <p style="font-size: 14px; color: #334155; margin-top: 0;">
        Se ha registrado exitosamente una solicitud de licencia en el sistema. A continuación los datos oficiales:
      </p>

      <div class="section-title">Datos del Analista</div>
      <table class="info-table">
        <tr><td class="label">Analista:</td><td class="value">${analyst.nombre}</td></tr>
        <tr><td class="label">Correo:</td><td class="value">${analyst.correo}</td></tr>
        <tr><td class="label">CUIT:</td><td class="value">${analyst.cuit}</td></tr>
        <tr><td class="label">Teléfono:</td><td class="value">${analyst.telefono}</td></tr>
      </table>

      <div class="section-title">Detalle de la Licencia</div>
      <table class="info-table">
        <tr><td class="label">Motivo:</td><td class="value" style="color: #1d4ed8;">${license.motivo}</td></tr>
        <tr><td class="label">Fecha de Inicio:</td><td class="value">${formatDateDisplay(license.fechaInicio)}</td></tr>
        <tr><td class="label">Días Hábiles:</td><td class="value">${license.diasHabiles} día(s) hábiles</td></tr>
        <tr><td class="label">Certificado Adjunto:</td><td class="value">${certStatus}</td></tr>
        <tr><td class="label">Observaciones:</td><td class="value">${license.observaciones?.trim() || 'Sin observaciones'}</td></tr>
      </table>

      <div class="alert-box">
        <strong>Notificación enviada a:</strong><br/>
        • <strong>Administrador Oficial:</strong> ${effectiveAdmin}<br/>
        • <strong>Respaldo Solicitante:</strong> ${solicitante.nombre} (${solicitante.correo})
      </div>
    </div>
    <div class="footer">
      Remitente oficial: <strong>${OFFICIAL_SENDER_EMAIL}</strong><br/>
      Dirección General de Sistemas de Atención y Notificaciones (DGSISAN)
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html, to, cc };
}

/**
 * Generates direct Webmail and client URLs
 */
export function generateEmailLinks(to: string, cc: string, subject: string, body: string): EmailLinks {
  const encTo = encodeURIComponent(to);
  const encCc = encodeURIComponent(cc || '');
  const encSub = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);

  const mailtoUrl = `mailto:${to}?${cc ? `cc=${encCc}&` : ''}subject=${encSub}&body=${encBody}`;
  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encTo}${cc ? `&cc=${encCc}` : ''}&subject=${encSub}&body=${encBody}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}${cc ? `&cc=${encCc}` : ''}&su=${encSub}&body=${encBody}`;

  return {
    mailtoUrl,
    outlookWebUrl,
    gmailWebUrl,
  };
}

/**
 * Attempt to send email through server API (using nodemailer with server or custom SMTP)
 */
export async function sendEmailViaApi(payload: EmailPayload): Promise<{
  success: boolean;
  message: string;
  reason?: string;
}> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error invoking /api/send-email:', errorMsg);
    return {
      success: false,
      reason: 'network_error',
      message: `Error de red al conectar con el servidor: ${errorMsg}`,
    };
  }
}

/**
 * Retrieves saved custom SMTP configuration from localStorage if any
 */
export function getSavedSmtpConfig(): SmtpConfig | null {
  try {
    const stored = localStorage.getItem('dgsisan_smtp_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to parse saved SMTP settings', e);
  }
  return null;
}

/**
 * Saves custom SMTP configuration to localStorage
 */
export function saveSmtpConfig(config: SmtpConfig): void {
  localStorage.setItem('dgsisan_smtp_settings', JSON.stringify(config));
}

/**
 * Creates and stores a notification record for:
 * 1. Email to the registered Administrator
 * 2. Email to whoever sent/requested it as confirmation/backup
 * 3. Pre-filled WhatsApp notification to the analyst
 */
export function dispatchLicenseNotification(
  license: License,
  analyst: Analyst,
  adminEmail: string,
  solicitante: Analyst
): NotificationLog {
  const cleanPhone = analyst.telefono.replace(/[^0-9]/g, '');

  const textMessage = `*DGSISAN PROCESOS - NOTIFICACIÓN DE LICENCIA*\n\n` +
    `Estimado/a ${analyst.nombre},\n` +
    `Se ha registrado tu solicitud de licencia en el sistema oficial.\n\n` +
    `📌 *Motivo:* ${license.motivo}\n` +
    `📅 *Fecha de Inicio:* ${formatDateDisplay(license.fechaInicio)}\n` +
    `⏱️ *Días Hábiles:* ${license.diasHabiles}\n` +
    `📎 *Certificado:* ${license.certificado ? license.certificado.name : 'Sin adjunto'}\n` +
    `📝 *Observaciones:* ${license.observaciones?.trim() || 'Sin observaciones'}\n` +
    `👤 *Remitente Oficial:* ${OFFICIAL_SENDER_EMAIL}\n` +
    `👤 *Solicitante:* ${solicitante.nombre} (${solicitante.correo})\n\n` +
    `Gobierno de la Ciudad de Buenos Aires - DGSISAN`;

  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMessage)}`;

  const log: NotificationLog = {
    id: 'notif-' + Date.now(),
    fecha: new Date().toISOString(),
    remitente: OFFICIAL_SENDER_EMAIL,
    destinatario: analyst.correo,
    destinatarioAdmin: adminEmail || OFFICIAL_SENDER_EMAIL,
    destinatarioSolicitante: solicitante.correo,
    solicitanteNombre: solicitante.nombre,
    tieneCertificado: !!license.certificado,
    certificadoNombre: license.certificado?.name,
    analistaNombre: analyst.nombre,
    motivo: license.motivo,
    diasHabiles: license.diasHabiles,
    fechaInicio: license.fechaInicio,
    telefono: analyst.telefono,
    whatsappUrl,
    leido: false,
  };

  return log;
}

export function generateDirectWhatsAppUrl(analyst: Analyst, customMessage?: string): string {
  const cleanPhone = analyst.telefono.replace(/[^0-9]/g, '');
  const text = customMessage || `Hola ${analyst.nombre}, te contacto desde DGSISAN Procesos.`;
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
}
