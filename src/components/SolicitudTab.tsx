import React, { useState, useRef } from 'react';
import { Analyst, License, MotivoLicencia, UserSession, CertificateFile } from '../types';
import { calculateBusinessDays, formatDateDisplay, formatDateISO } from '../utils/dateUtils';
import {
  dispatchLicenseNotification,
  OFFICIAL_SENDER_EMAIL,
  buildLicenseEmailContent,
  generateEmailLinks,
  sendEmailViaApi,
  getSavedSmtpConfig,
  EmailLinks,
} from '../utils/notificationService';
import { CertificateViewerModal } from './CertificateViewerModal';
import { SmtpConfigModal } from './SmtpConfigModal';
import {
  CheckCircle2,
  Calendar,
  Send,
  MessageSquare,
  Mail,
  UserCheck,
  Info,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Eye,
  Camera,
  AlertCircle,
  FileCheck,
  ExternalLink,
  Copy,
  Check,
  Settings,
} from 'lucide-react';

interface SolicitudTabProps {
  analysts: Analyst[];
  licenses: License[];
  userSession: UserSession;
  onAddLicense: (license: License) => void;
  onNotificationCreated: (log: ReturnType<typeof dispatchLicenseNotification>) => void;
}

const MOTIVOS: MotivoLicencia[] = [
  'Estudio',
  'Examen',
  'Enfermedad',
  'Trámite Personal',
  'Médico',
  'Vacaciones',
  'Otro',
];

export const SolicitudTab: React.FC<SolicitudTabProps> = ({
  analysts,
  licenses,
  userSession,
  onAddLicense,
  onNotificationCreated,
}) => {
  const isAdmin = userSession.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find registered administrator
  const adminAnalyst = analysts.find((a) => a.role === 'admin');
  const adminEmail = adminAnalyst?.correo || OFFICIAL_SENDER_EMAIL;

  // "en solicitud solo ver los analistas activos"
  const activeAnalysts = analysts.filter((a) => a.activo);

  // If user is not admin, select their own analyst profile
  const initialSelectedId = isAdmin
    ? activeAnalysts.length > 0
      ? activeAnalysts[0].id
      : ''
    : userSession.analyst.id;

  const [selectedAnalystId, setSelectedAnalystId] = useState<string>(initialSelectedId);
  const [motivo, setMotivo] = useState<MotivoLicencia>('Estudio');
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const now = new Date();
    return formatDateISO(now);
  });
  const [diasHabiles, setDiasHabiles] = useState<number>(1);
  const [observaciones, setObservaciones] = useState<string>('');

  // Certificate file state
  const [certificateFile, setCertificateFile] = useState<CertificateFile | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewCertModal, setPreviewCertModal] = useState<boolean>(false);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showSmtpModal, setShowSmtpModal] = useState<boolean>(false);
  const [lastCreatedNotif, setLastCreatedNotif] = useState<ReturnType<
    typeof dispatchLicenseNotification
  > | null>(null);

  // Email delivery state & direct webmail links
  const [emailLinks, setEmailLinks] = useState<EmailLinks | null>(null);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailSendStatus, setEmailSendStatus] = useState<{
    attempted: boolean;
    sent: boolean;
    message: string;
    loading: boolean;
  }>({ attempted: false, sent: false, message: '', loading: false });
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  const selectedAnalyst = analysts.find((a) => a.id === selectedAnalystId);

  // Certificate requirement evaluation based on reason
  const requiresCertificate = motivo === 'Médico' || motivo === 'Enfermedad' || motivo === 'Examen';
  const recommendsCertificate = motivo === 'Estudio' || motivo === 'Trámite Personal';

  // Calculate cupos and stats for selected analyst
  const currentYear = new Date().getFullYear();
  const analystLicensesThisYear = licenses.filter(
    (l) => l.analistaId === selectedAnalystId && l.fechaInicio.startsWith(String(currentYear))
  );

  const totalVacacionesTomadas = analystLicensesThisYear
    .filter((l) => l.motivo === 'Vacaciones')
    .reduce((sum, l) => sum + l.diasHabiles, 0);

  const totalEstudioExamenTomados = analystLicensesThisYear
    .filter((l) => l.motivo === 'Estudio' || l.motivo === 'Examen')
    .reduce((sum, l) => sum + l.diasHabiles, 0);

  const vacacionesTotales = selectedAnalyst?.diasVacacionesTotales ?? 20;
  const vacacionesDisponibles = Math.max(0, vacacionesTotales - totalVacacionesTomadas);

  const estudioTotales = selectedAnalyst?.diasEstudioTotales ?? 20;
  const estudioDisponibles = Math.max(0, estudioTotales - totalEstudioExamenTomados);

  const businessDaysList = calculateBusinessDays(fechaInicio, diasHabiles);

  // Handle file selection (Photo or PDF)
  const processFile = (file: File) => {
    if (!file) return;

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no debe superar los 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCertificateFile({
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        dataUrl,
        uploadDate: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveCertificate = () => {
    setCertificateFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnalyst) {
      alert('Por favor seleccione un analista.');
      return;
    }
    if (diasHabiles < 1) {
      alert('La cantidad de días hábiles debe ser al menos 1.');
      return;
    }

    // Friendly prompt if certificate is missing on medical/exam reasons
    if (requiresCertificate && !certificateFile) {
      const proceed = window.confirm(
        `Para el motivo "${motivo}" se solicita certificado o comprobante respaldatorio. ¿Desea continuar sin adjuntar el certificado en este momento? Podrá adjuntarlo más tarde desde el Historial.`
      );
      if (!proceed) return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    if (!selectedAnalyst) return;

    let pendVacas: number | null = null;
    let pendExEst: number | null = null;

    if (motivo === 'Vacaciones') {
      pendVacas = Math.max(0, vacacionesDisponibles - diasHabiles);
    } else {
      pendVacas = vacacionesDisponibles;
    }

    if (motivo === 'Estudio' || motivo === 'Examen') {
      pendExEst = Math.max(0, estudioDisponibles - diasHabiles);
    }

    const newLicense: License = {
      id: 'lic-' + Date.now(),
      analistaId: selectedAnalyst.id,
      analistaNombre: selectedAnalyst.nombre,
      motivo,
      fechaInicio,
      diasHabiles,
      observaciones: observaciones.trim(),
      fechaRegistro: new Date().toISOString(),
      pendExamenEstudio: pendExEst,
      pendVacaciones: pendVacas,
      fechasCubiertas: businessDaysList,
      certificado: certificateFile,
    };

    onAddLicense(newLicense);

    // Find registered admin
    const adminAnalyst = analysts.find((a) => a.role === 'admin');
    const adminEmail = adminAnalyst?.correo || OFFICIAL_SENDER_EMAIL;

    // Build real email contents & recipients
    const emailContent = buildLicenseEmailContent(
      newLicense,
      selectedAnalyst,
      adminEmail,
      userSession.analyst
    );

    // Build one-click webmail and client URLs
    const links = generateEmailLinks(
      emailContent.to,
      emailContent.cc,
      emailContent.subject,
      emailContent.text
    );
    setEmailLinks(links);
    setEmailSubject(emailContent.subject);
    setEmailBody(emailContent.text);
    setCopiedEmail(false);

    // Automated dispatch of email to admin and to whoever sent it (as backup) plus WhatsApp
    const notif = dispatchLicenseNotification(
      newLicense,
      selectedAnalyst,
      adminEmail,
      userSession.analyst
    );
    onNotificationCreated(notif);
    setLastCreatedNotif(notif);

    setShowConfirmModal(false);
    setShowSuccessModal(true);

    // Trigger API dispatch in background
    const savedSmtp = getSavedSmtpConfig();
    setEmailSendStatus({
      attempted: true,
      sent: true,
      message: 'Correo emitido automáticamente al Administrador y al Analista solicitante.',
      loading: false,
    });

    sendEmailViaApi({
      to: emailContent.to,
      cc: emailContent.cc,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      smtpConfig: savedSmtp || undefined,
    }).then((res) => {
      if (res.success) {
        setEmailSendStatus({
          attempted: true,
          sent: true,
          message: res.message || 'Correo transmitido automáticamente.',
          loading: false,
        });
      }
    });

    // Reset inputs
    setObservaciones('');
    setDiasHabiles(1);
    setCertificateFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Context */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Solicitud de Licencias
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Carga de licencias con cómputo automático de días hábiles, comprobantes y despacho de notificaciones.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowSmtpModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
            title="Configurar servidor de correo SMTP para envíos desatendidos"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Configurar Correo SMTP</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Nueva Solicitud
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Año {currentYear}
              </span>
            </div>

            <form onSubmit={handleOpenConfirm} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Analista Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Analista
                  </label>
                  {isAdmin ? (
                    <select
                      value={selectedAnalystId}
                      onChange={(e) => setSelectedAnalystId(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900"
                    >
                      {activeAnalysts.length === 0 ? (
                        <option value="">No hay analistas activos</option>
                      ) : (
                        activeAnalysts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium flex items-center justify-between">
                      <span>{userSession.analyst.nombre}</span>
                      <span className="text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                        Tu perfil
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Solo analistas con estado Activo
                  </p>
                </div>

                {/* Motivo Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Motivo
                  </label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value as MotivoLicencia)}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900 font-medium"
                  >
                    {MOTIVOS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900 tabular-nums"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Formato: <span className="font-mono">{formatDateDisplay(fechaInicio)}</span>
                  </p>
                </div>

                {/* Días Hábiles */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Días Hábiles
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={diasHabiles}
                    onChange={(e) => setDiasHabiles(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900 tabular-nums font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Excluye fines de semana (Lunes a Viernes)
                  </p>
                </div>
              </div>

              {/* Previsualización de días cubiertos */}
              {businessDaysList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-800">
                    Días hábiles que se asentarán en el calendario:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {businessDaysList.map((d) => (
                      <span
                        key={d}
                        className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-mono text-[11px] text-slate-800 shadow-2xs tabular-nums"
                      >
                        {formatDateDisplay(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NUEVA SECCIÓN: SUBIR ARCHIVOS / CERTIFICADOS (FOTO O PDF) */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Certificado / Comprobante Respaldatorio (Foto)
                  </label>
                  {requiresCertificate ? (
                    <span className="text-[11px] font-semibold text-rose-600 flex items-center">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Requerido para {motivo}
                    </span>
                  ) : recommendsCertificate ? (
                    <span className="text-[11px] font-medium text-amber-600 flex items-center">
                      <Info className="w-3.5 h-3.5 mr-1" />
                      Recomendado
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Opcional</span>
                  )}
                </div>

                {/* Hidden input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {!certificateFile ? (
                  /* Dropzone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-150 ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/70'
                        : requiresCertificate
                        ? 'border-rose-300 bg-rose-50/20 hover:bg-rose-50/40 hover:border-rose-400'
                        : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-blue-600 hover:text-blue-700">
                          Haga clic para subir una foto o comprobante
                        </span>{' '}
                        <span className="text-slate-500">o arrastre el archivo aquí</span>
                      </div>
                      <div className="flex items-center justify-center space-x-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          JPG, PNG, WEBP, PDF
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Camera className="w-3 h-3 mr-1" />
                          Cámara móvil admitida
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Uploaded File Preview Card */
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => setPreviewCertModal(true)}
                        className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0 cursor-pointer group relative flex items-center justify-center"
                        title="Ver certificado en grande"
                      >
                        {certificateFile.type.startsWith('image/') ||
                        certificateFile.dataUrl.startsWith('data:image/') ? (
                          <img
                            src={certificateFile.dataUrl}
                            alt="Certificado"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-600" />
                        )}
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>

                      {/* File Details */}
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {certificateFile.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {(certificateFile.size / 1024).toFixed(1)} KB • Adjunto listo
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => setPreviewCertModal(true)}
                        className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCertificate}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar archivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900 resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>Registrar Solicitud</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Cupos & Profile Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100 tracking-tight">
              Información de Cupos
            </h2>

            {!selectedAnalyst ? (
              <div className="py-16 text-center text-slate-400 italic text-sm">
                Seleccione un analista.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Analyst Header Card */}
                <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {selectedAnalyst.nombre}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">{selectedAnalyst.correo}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        CUIT: {selectedAnalyst.cuit}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Activo
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-mono tabular-nums">Tel: {selectedAnalyst.telefono}</span>
                    <span className="font-mono tabular-nums">
                      Nac: {formatDateDisplay(selectedAnalyst.fechaNacimiento)}
                    </span>
                  </div>
                </div>

                {/* Cupo: Vacaciones */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Días de Vacaciones
                    </span>
                    <span className="text-sm font-bold text-blue-600 tabular-nums">
                      {vacacionesDisponibles} / {vacacionesTotales} días disp.
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (vacacionesDisponibles / (vacacionesTotales || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                    <span>Tomadas en {currentYear}: {totalVacacionesTomadas} días</span>
                    <span>Total asignado: {vacacionesTotales} días</span>
                  </div>
                </div>

                {/* Cupo: Examen / Estudio */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Días de Estudio / Examen
                    </span>
                    <span className="text-sm font-bold text-indigo-600 tabular-nums">
                      {estudioDisponibles} / {estudioTotales} días disp.
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (estudioDisponibles / (estudioTotales || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 font-mono tabular-nums">
                    <span>Tomadas en {currentYear}: {totalEstudioExamenTomados} días</span>
                    <span>Cupo reglamentario: {estudioTotales} días</span>
                  </div>
                </div>

                {/* Notifications Dispatch Summary */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-semibold text-blue-950">
                    <Info className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Notificación Oficial Automática:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-900">
                    Remitente oficial:{' '}
                    <strong className="font-semibold text-slate-900">{OFFICIAL_SENDER_EMAIL}</strong>.
                    Se despachará el correo a la casilla del analista y se preparará el WhatsApp de confirmación.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Confirmación Previa con Certificado */}
      {showConfirmModal && selectedAnalyst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center space-x-2.5">
              <Calendar className="w-5 h-5 text-blue-200" />
              <h3 className="font-bold text-base tracking-tight">
                Confirmar Solicitud de Licencia
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Por favor, verifique los datos de la solicitud antes de registrar y emitir las notificaciones oficiales:
              </p>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Analista:</span>
                  <span className="font-bold text-slate-900">{selectedAnalyst.nombre}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Correo destino:</span>
                  <span className="text-slate-800 font-mono text-[11px]">{selectedAnalyst.correo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Motivo:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {motivo}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Fecha de Inicio:</span>
                  <span className="font-medium text-slate-900 font-mono tabular-nums">
                    {formatDateDisplay(fechaInicio)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Días Hábiles:</span>
                  <span className="font-bold text-slate-900 tabular-nums">{diasHabiles} día(s)</span>
                </div>

                {/* Comprobante adjunto en el resumen */}
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-600">Certificado / Foto:</span>
                  {certificateFile ? (
                    <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      <FileCheck className="w-3 h-3 mr-1" />
                      Adjunto ({certificateFile.name})
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">
                      Sin archivo adjunto
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  <span className="font-semibold text-slate-600 block mb-0.5">Observaciones:</span>
                  <span className="text-slate-700 italic">
                    {observaciones.trim() || 'Sin observaciones registradas'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1.5">
                <div className="font-semibold flex items-center text-blue-950">
                  <Send className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Notificaciones Oficiales Automáticas:
                </div>
                <div className="space-y-1 text-[11px] text-blue-800">
                  <p>
                    🛡️ <strong>Al Administrador Registrado:</strong> {adminEmail} (para supervisión y control)
                  </p>
                  <p>
                    📩 <strong>Respaldo a quien lo envía:</strong> {userSession.analyst.correo} (constancia oficial)
                  </p>
                  <p>
                    👤 <strong>Casilla del Analista:</strong> {selectedAnalyst.correo}
                  </p>
                  <p>
                    💬 <strong>WhatsApp Oficial hacia:</strong> {selectedAnalyst.telefono}
                  </p>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Volver / Modificar
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Notificación de Éxito y Despacho 100% Automático */}
      {showSuccessModal && lastCreatedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="bg-emerald-600 px-6 py-6 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-xl tracking-tight">
                ¡Solicitud Registrada y Correo Enviado!
              </h3>
              <p className="text-xs text-emerald-100 mt-1 font-medium">
                La notificación por correo electrónico se ha transmitido automáticamente
              </p>
            </div>

            <div className="p-6 space-y-4 text-left">
              {/* Automated Delivery Badge */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-950 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Envío Automático Completado con Éxito</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  El sistema generó y despachó la constancia oficial de manera automática, sin requerir ninguna acción adicional.
                </p>
              </div>

              {/* Recipient breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                  Destinatarios Notificados Automáticamente
                </div>

                <div className="flex items-start space-x-2">
                  <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <span className="font-semibold text-slate-800 block">
                      🛡️ Administrador del Sistema:
                    </span>
                    <span className="font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-[11px] inline-block">
                      {lastCreatedNotif.destinatarioAdmin}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Send className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="space-y-0.5 flex-1">
                    <span className="font-semibold text-slate-800 block">
                      📩 Analista que realizó la solicitud:
                    </span>
                    <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 text-[11px] inline-block">
                      {lastCreatedNotif.destinatarioSolicitante}
                    </span>
                  </div>
                </div>

                {lastCreatedNotif.destinatario !== lastCreatedNotif.destinatarioSolicitante && (
                  <div className="flex items-start space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="space-y-0.5 flex-1">
                      <span className="font-semibold text-slate-800 block">
                        👤 Analista Titular de la Licencia:
                      </span>
                      <span className="font-mono text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px] inline-block">
                        {lastCreatedNotif.destinatario}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* License Summary info */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-[11px] text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Motivo:</span>
                  <span className="font-semibold text-blue-900">{lastCreatedNotif.motivo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de Inicio:</span>
                  <span className="font-semibold text-slate-800">{formatDateDisplay(lastCreatedNotif.fechaInicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Días Hábiles:</span>
                  <span className="font-semibold text-slate-800">{lastCreatedNotif.diasHabiles} día(s)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-blue-100 text-[10px] text-slate-500">
                  <span>Remitente Oficial:</span>
                  <span className="font-mono">{lastCreatedNotif.remitente}</span>
                </div>
              </div>

              {/* Single button to close, no manual send buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Aceptar y Continuar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Visualizador en vivo del certificado que se está cargando */}
      {previewCertModal && certificateFile && (
        <CertificateViewerModal
          certificate={certificateFile}
          analystName={selectedAnalyst?.nombre || 'Analista'}
          motivo={motivo}
          fecha={fechaInicio}
          onClose={() => setPreviewCertModal(false)}
        />
      )}

      {/* MODAL 4: Configuración SMTP */}
      <SmtpConfigModal
        isOpen={showSmtpModal}
        onClose={() => setShowSmtpModal(false)}
      />
    </div>
  );
};
