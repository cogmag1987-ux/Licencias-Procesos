import React from 'react';
import { NotificationLog } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import {
  Mail,
  MessageSquare,
  X,
  CheckCheck,
  Clock,
  ExternalLink,
  Shield,
  FileCheck,
  Send,
} from 'lucide-react';

interface NotificationModalProps {
  notifications: NotificationLog[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  onClose,
  onMarkAllAsRead,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Bandeja de Notificaciones Oficiales
              </h3>
              <p className="text-xs text-slate-400">
                Registro de correos automáticos (Admin y Respaldo) y WhatsApp
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md text-slate-200 transition-colors cursor-pointer"
            >
              Marcar todo leído
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-sm">
              No hay notificaciones emitidas aún.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {notif.analistaNombre}
                      </span>
                      <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.2 rounded text-[10px]">
                        {notif.motivo}
                      </span>
                      {notif.tieneCertificado && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-1.5 py-0.2 rounded text-[10px] inline-flex items-center">
                          <FileCheck className="w-2.5 h-2.5 mr-0.5" />
                          Certificado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Fecha inicio:{' '}
                      <span className="font-mono tabular-nums">{formatDateDisplay(notif.fechaInicio)}</span> •{' '}
                      <span className="tabular-nums font-semibold">{notif.diasHabiles} día(s) hábiles</span>
                    </p>
                  </div>
                  <div className="flex items-center text-[10px] text-slate-400 space-x-1 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(notif.fecha).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Email details with Admin & Requester breakdown */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] space-y-1.5 font-sans">
                  <div className="flex items-center text-slate-700">
                    <span className="font-semibold text-slate-500 w-32 shrink-0">Remitente oficial:</span>
                    <span className="font-mono text-blue-600 truncate">{notif.remitente}</span>
                  </div>

                  {/* Mail to Administrator */}
                  <div className="flex items-center text-slate-700">
                    <span className="font-semibold text-slate-500 w-32 shrink-0 flex items-center">
                      <Shield className="w-3 h-3 mr-1 text-indigo-600" />
                      Administrador:
                    </span>
                    <span className="font-mono text-slate-800 truncate">
                      {notif.destinatarioAdmin || notif.remitente}
                    </span>
                    <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-700 font-medium px-1.5 py-0.2 rounded">
                      Control
                    </span>
                  </div>

                  {/* Mail to Requester as backup */}
                  <div className="flex items-center text-slate-700">
                    <span className="font-semibold text-slate-500 w-32 shrink-0 flex items-center">
                      <Send className="w-3 h-3 mr-1 text-emerald-600" />
                      Respaldo remitente:
                    </span>
                    <span className="font-mono text-slate-800 truncate">
                      {notif.destinatarioSolicitante || notif.destinatario}
                    </span>
                    <span className="ml-2 text-[10px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.2 rounded">
                      Respaldo
                    </span>
                  </div>

                  <div className="flex items-center text-emerald-700 pt-1 border-t border-slate-100 font-medium">
                    <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                    <span>Correos emitidos automáticamente con constancia y respaldo oficial</span>
                  </div>
                </div>

                {/* Actions: Webmail & WhatsApp */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    WhatsApp Analista: <span className="font-mono tabular-nums">{notif.telefono}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(
                        `${notif.destinatarioAdmin}, ${notif.destinatarioSolicitante}`
                      )}&subject=${encodeURIComponent(
                        `[DGSISAN Procesos] Notificación de Licencia - ${notif.analistaNombre} (${notif.motivo})`
                      )}&body=${encodeURIComponent(
                        `Notificación Oficial de Licencia DGSISAN\n\nAnalista: ${notif.analistaNombre}\nMotivo: ${notif.motivo}\nFecha Inicio: ${formatDateDisplay(notif.fechaInicio)}\nDías Hábiles: ${notif.diasHabiles}\nRemitente Oficial: ${notif.remitente}\nAdministrador: ${notif.destinatarioAdmin}\nRespaldo Solicitante: ${notif.destinatarioSolicitante}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-medium text-xs transition-colors space-x-1 cursor-pointer"
                      title="Abrir y enviar correo en Webmail GCBA / Outlook"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Webmail GCBA</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                    </a>

                    <a
                      href={notif.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs space-x-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>
            Remitente: <strong className="font-mono text-slate-700">procesos.dgsisan@gmail.com</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
