import { Analyst, License, NotificationLog } from '../types';
import { formatDateDisplay } from './dateUtils';

export const OFFICIAL_SENDER_EMAIL = 'cristianoscargonzalez@buenosaires.gob.ar';

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
