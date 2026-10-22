export type Role = 'admin' | 'usuario';

export type MotivoLicencia = 
  | 'Estudio'
  | 'Examen'
  | 'Enfermedad'
  | 'Trámite Personal'
  | 'Médico'
  | 'Vacaciones'
  | 'Otro';

export interface Analyst {
  id: string;
  nombre: string;
  correo: string;
  cuit: string;
  telefono: string;
  fechaNacimiento: string; // YYYY-MM-DD
  activo: boolean;
  diasVacacionesTotales: number;
  diasEstudioTotales?: number;
  role: Role;
  mustChangePassword?: boolean;
  password?: string;
}

export interface CertificateFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 data URL for photo/image preview
  uploadDate: string;
}

export interface License {
  id: string;
  analistaId: string;
  analistaNombre: string;
  motivo: MotivoLicencia;
  fechaInicio: string; // YYYY-MM-DD
  diasHabiles: number;
  observaciones?: string;
  fechaRegistro: string; // ISO
  pendExamenEstudio?: number | null;
  pendVacaciones?: number | null;
  // Specific days covered by this license (computed business days)
  fechasCubiertas?: string[];
  // Certificado adjunto (foto o comprobante)
  certificado?: CertificateFile | null;
}

export interface UserSession {
  analyst: Analyst;
  role: Role;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
}

export interface NotificationLog {
  id: string;
  fecha: string;
  remitente: string; // procesos.dgsisan@gmail.com
  destinatario: string; // Correo del analista beneficiario
  destinatarioAdmin: string; // Correo oficial del Administrador
  destinatarioSolicitante: string; // Correo de quien envió la solicitud (respaldo)
  solicitanteNombre: string;
  tieneCertificado?: boolean;
  certificadoNombre?: string;
  analistaNombre: string;
  motivo: string;
  diasHabiles: number;
  fechaInicio: string;
  telefono: string;
  whatsappUrl: string;
  leido: boolean;
  emailEnviadoSmtp?: boolean;
  emailEnviadoMensaje?: string;
}

