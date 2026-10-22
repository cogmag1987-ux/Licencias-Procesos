import React, { useState, useEffect } from 'react';
import { SmtpConfig } from '../types';
import { getSavedSmtpConfig, saveSmtpConfig, OFFICIAL_SENDER_EMAIL } from '../utils/notificationService';
import { Mail, Server, ShieldCheck, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmtpConfigModal: React.FC<SmtpConfigModalProps> = ({ isOpen, onClose }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState(OFFICIAL_SENDER_EMAIL);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [serverStatus, setServerStatus] = useState<{ configured: boolean; host?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Check server status
    fetch('/api/smtp-status')
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch(() => setServerStatus(null));

    // Load local config
    const saved = getSavedSmtpConfig();
    if (saved) {
      setHost(saved.host || '');
      setPort(String(saved.port || 587));
      setUser(saved.user || '');
      setPass(saved.pass || '');
      setFrom(saved.from || OFFICIAL_SENDER_EMAIL);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config: SmtpConfig = {
      host: host.trim(),
      port: Number(port) || 587,
      user: user.trim(),
      pass: pass.trim(),
      from: from.trim() || OFFICIAL_SENDER_EMAIL,
    };
    saveSmtpConfig(config);
    setTestResult({
      success: true,
      message: 'Configuración SMTP guardada exitosamente.',
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTestSend = async () => {
    if (!host || !user || !pass) {
      setTestResult({
        success: false,
        message: 'Por favor complete host, usuario y contraseña antes de probar.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const config: SmtpConfig = {
        host: host.trim(),
        port: Number(port) || 587,
        user: user.trim(),
        pass: pass.trim(),
        from: from.trim() || OFFICIAL_SENDER_EMAIL,
      };

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.trim(),
          subject: '[DGSISAN Procesos] Correo de Prueba del Sistema',
          text: 'Esta es una prueba de envío desde el Sistema de Gestión de Licencias DGSISAN Procesos.',
          smtpConfig: config,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `¡Correo de prueba enviado con éxito a ${user}!`,
        });
        saveSmtpConfig(config);
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || 'Error al conectar con el servidor SMTP.',
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `Error de red: ${errorMsg}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Server className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-base tracking-tight">
                Configuración del Servidor de Correo (SMTP)
              </h3>
              <p className="text-xs text-slate-400">
                Para el despacho automático directo de notificaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {serverStatus?.configured && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Servidor SMTP preconfigurado en el entorno del sistema ({serverStatus.host}).
              </span>
            </div>
          )}

          <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 p-3 rounded-lg border border-blue-200/60">
            <p className="font-semibold text-blue-900 flex items-center mb-1">
              <Mail className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Despacho Institucional (procesos.dgsisan@gmail.com):
            </p>
            Para envíos desatendidos automáticos desde <strong>procesos.dgsisan@gmail.com</strong>, puede ingresar el host <strong>smtp.gmail.com</strong> (puerto 587 o 465), su usuario <strong>procesos.dgsisan@gmail.com</strong> y una Contraseña de Aplicación de Google (App Password).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Servidor SMTP (Host)
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Puerto
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="587"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Usuario / Correo Autenticación
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="procesos.dgsisan@gmail.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña / Clave de Aplicación
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Remitente Oficial (From)
            </label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder={OFFICIAL_SENDER_EMAIL}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-xs"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={testing}
              onClick={handleTestSend}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Probando...' : 'Probar Envío'}</span>
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
