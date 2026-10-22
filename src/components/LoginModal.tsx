import React, { useState } from 'react';
import { Analyst, UserSession } from '../types';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  analysts: Analyst[];
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ analysts, onLoginSuccess }) => {
  const [correo, setCorreo] = useState('cristianoscargonzalez@buenosaires.gob.ar');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = correo.trim().toLowerCase();
    const analyst = analysts.find(a => a.correo.toLowerCase() === cleanEmail);

    if (!analyst) {
      setError('Correo no registrado en el sistema oficial de DGSISAN.');
      return;
    }

    // Default password checks (admin: 'admin', users: 'user123' unless changed)
    const expectedPassword = analyst.password || (analyst.role === 'admin' ? 'admin' : 'user123');

    if (password !== expectedPassword) {
      setError('Contraseña incorrecta. Por favor, verifique sus credenciales.');
      return;
    }

    onLoginSuccess({
      analyst,
      role: analyst.role,
    });
  };

  const handleQuickSelect = (a: Analyst, pass: string) => {
    setCorreo(a.correo);
    setPassword(a.password || pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 my-8">
        {/* Header / Brand with Logo */}
        <div className="bg-gradient-to-b from-blue-50 to-white px-8 pt-8 pb-6 text-center border-b border-gray-100">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl p-2 bg-white shadow-md border border-gray-100 flex items-center justify-center">
            <img
              src="/assets/aistudio/Logo_Procesos_3e69bf87.jpg"
              alt="Logo DGSISAN Procesos"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            DGSISAN PROCESOS
          </h2>
          <p className="text-sm font-medium text-blue-600 mt-0.5">
            Sistema de Gestión de Licencias
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Gobierno de la Ciudad Autónoma de Buenos Aires
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Correo Oficial Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@buenosaires.gob.ar"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-gray-900"
              />
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              Ingrese con su casilla oficial @buenosaires.gob.ar
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer mt-2"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="bg-gray-50 border-t border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
            Accesos rápidos de prueba (Demo):
          </p>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                const admin = analysts.find(a => a.role === 'admin') || analysts[0];
                handleQuickSelect(admin, 'admin');
              }}
              className="w-full text-left px-2.5 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-md text-xs flex justify-between items-center transition-colors group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Cristian González (Admin)
                </span>
                <span className="text-gray-500 block text-[11px]">
                  cristianoscargonzalez@buenosaires.gob.ar
                </span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
                Control Total
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const user = analysts.find(a => a.correo === 'rebecahelenagonzalez@buenosaires.gob.ar') || analysts[1];
                handleQuickSelect(user, 'user123');
              }}
              className="w-full text-left px-2.5 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-md text-xs flex justify-between items-center transition-colors group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Rebeca González (Analista)
                </span>
                <span className="text-gray-500 block text-[11px]">
                  rebecahelenagonzalez@buenosaires.gob.ar
                </span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-700 font-medium px-1.5 py-0.5 rounded">
                Solo su info
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const user = analysts.find(a => a.correo === 'l.vieyra@buenosaires.gob.ar') || analysts[1];
                handleQuickSelect(user, 'user123');
              }}
              className="w-full text-left px-2.5 py-1.5 bg-white border border-gray-200 hover:border-blue-400 rounded-md text-xs flex justify-between items-center transition-colors group cursor-pointer"
            >
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Luis Vieyra (Analista)
                </span>
                <span className="text-gray-500 block text-[11px]">
                  l.vieyra@buenosaires.gob.ar
                </span>
              </div>
              <span className="text-[10px] bg-gray-100 text-gray-700 font-medium px-1.5 py-0.5 rounded">
                Solo su info
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
