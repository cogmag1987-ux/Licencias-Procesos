import React, { useState } from 'react';
import { Analyst } from '../types';
import { KeyRound, ShieldCheck, X } from 'lucide-react';

interface ChangePasswordModalProps {
  analyst: Analyst;
  isForced: boolean;
  onSave: (newPassword: string) => void;
  onCancel?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  analyst,
  isForced,
  onSave,
  onCancel,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor, revise ambas casillas.');
      return;
    }

    onSave(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
        <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500 rounded-lg">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {isForced ? 'Primer Ingreso - Cambio Obligatorio' : 'Actualizar Contraseña'}
              </h3>
              <p className="text-xs text-blue-100">{analyst.correo}</p>
            </div>
          </div>
          {!isForced && onCancel && (
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isForced && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
              Por políticas de seguridad institucional de DGSISAN, en su primer ingreso debe establecer una contraseña personal.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir nueva contraseña"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            {!isForced && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Guardar Contraseña</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
