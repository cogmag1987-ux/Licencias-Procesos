import React, { useState } from 'react';
import { Analyst, UserSession } from '../types';
import { Lock, Mail, ShieldAlert, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface LoginModalProps {
  analysts: Analyst[];
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ analysts, onLoginSuccess }) => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputEmail = correo.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputEmail) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    if (!inputPass) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    // 1. ADMINISTRATOR LOGIN
    // Matches: procesos.dgsisan@gmail.com, or admin aliases
    const isAdminAttempt =
      inputEmail === 'procesos.dgsisan@gmail.com' ||
      inputEmail.startsWith('procesos.dgsisan') ||
      inputEmail === 'admin' ||
      inputEmail === 'cristianoscargonzalez@buenosaires.gob.ar';

    if (isAdminAttempt) {
      // Find admin analyst or instantiate official admin if missing
      let adminAnalyst = analysts.find(
        (a) =>
          a.role === 'admin' ||
          a.id === 'ana-admin' ||
          a.correo.toLowerCase() === 'procesos.dgsisan@gmail.com'
      );

      if (!adminAnalyst) {
        adminAnalyst = {
          id: 'ana-admin',
          nombre: 'Cristian González',
          correo: 'procesos.dgsisan@gmail.com',
          cuit: '20-33221100-9',
          telefono: '+54 9 11 6688-9911',
          fechaNacimiento: '1987-03-20',
          activo: true,
          diasVacacionesTotales: 25,
          diasEstudioTotales: 20,
          role: 'admin',
          mustChangePassword: true,
          password: '1234',
        };
      } else {
        adminAnalyst = {
          ...adminAnalyst,
          correo: 'procesos.dgsisan@gmail.com',
        };
      }

      // First-time generic key '1234' is ALWAYS accepted for admin
      const isInitialGeneric = inputPass === '1234';
      const isSavedMatch = adminAnalyst.password && inputPass === adminAnalyst.password;
      const isLegacyAdminPass = inputPass === 'admin';

      if (!isInitialGeneric && !isSavedMatch && !isLegacyAdminPass) {
        setError(
          'Contraseña incorrecta. Para el primer ingreso como Administrador, utilice la clave genérica 1234.'
        );
        return;
      }

      // If logging in with the generic initial key, enforce immediate password change
      const forceChange = isInitialGeneric || isLegacyAdminPass || Boolean(adminAnalyst.mustChangePassword);

      onLoginSuccess({
        analyst: {
          ...adminAnalyst,
          mustChangePassword: forceChange,
        },
        role: 'admin',
      });
      return;
    }

    // 2. ANALYST LOGIN FLOW
    // Requirement: "los analistas deben ingresar con el correo @buenosaires"
    let effectiveAnalystEmail = inputEmail;
    if (!effectiveAnalystEmail.includes('@')) {
      effectiveAnalystEmail = `${effectiveAnalystEmail}@buenosaires.gob.ar`;
    } else if (effectiveAnalystEmail.endsWith('@buenosaires')) {
      effectiveAnalystEmail = `${effectiveAnalystEmail}.gob.ar`;
    }

    // Non-admin users must belong to @buenosaires domain
    if (!effectiveAnalystEmail.includes('buenosaires')) {
      setError(
        'Los analistas deben ingresar exclusivamente con su correo oficial institucional @buenosaires.gob.ar (el correo procesos.dgsisan@gmail.com está asignado a la Administración).'
      );
      return;
    }

    const analyst = analysts.find(
      (a) => a.correo.toLowerCase() === effectiveAnalystEmail.toLowerCase()
    );

    if (!analyst) {
      setError(
        `El correo "${effectiveAnalystEmail}" no se encuentra registrado en el padrón de analistas de DGSISAN.`
      );
      return;
    }

    if (!analyst.activo) {
      setError('El usuario se encuentra temporalmente inactivo. Por favor contacte al administrador.');
      return;
    }

    // Password verification for analysts (supports 1234, user123, or custom saved password)
    const isAnalystGeneric = inputPass === '1234' || inputPass === 'user123';
    const isAnalystMatch = analyst.password && inputPass === analyst.password;

    if (!isAnalystGeneric && !isAnalystMatch) {
      setError(
        'Contraseña incorrecta. Si es su primer ingreso, utilice la clave genérica 1234.'
      );
      return;
    }

    const forceChange = isAnalystGeneric || Boolean(analyst.mustChangePassword);

    onLoginSuccess({
      analyst: {
        ...analyst,
        mustChangePassword: forceChange,
      },
      role: analyst.role || 'usuario',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 my-8">
        {/* Header / Brand with Official Logo */}
        <div className="bg-gradient-to-b from-blue-50/70 to-white px-8 pt-8 pb-6 text-center border-b border-slate-100">
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl p-2 bg-white shadow-md border border-slate-100 flex items-center justify-center">
            <img
              src="/assets/aistudio/Logo_Procesos_3e69bf87.jpg"
              alt="Logo DGSISAN Procesos"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            DGSISAN PROCESOS
          </h2>
          <p className="text-sm font-semibold text-blue-600 mt-0.5">
            Sistema de Gestión de Licencias
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Gobierno de la Ciudad Autónoma de Buenos Aires
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-xs text-rose-700 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="procesos.dgsisan@gmail.com o usuario@buenosaires.gob.ar"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Institutional Access Guidelines Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
              <span>
                <strong>Administrador:</strong> <code className="text-blue-700 font-semibold">procesos.dgsisan@gmail.com</code>
              </span>
            </div>
            <div className="flex items-center text-slate-700 font-medium">
              <User className="w-3.5 h-3.5 text-emerald-600 mr-1.5 shrink-0" />
              <span>
                <strong>Analistas:</strong> Correo institucional <code className="text-emerald-700 font-semibold">@buenosaires.gob.ar</code>
              </span>
            </div>
            <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-500 leading-tight">
              Primer ingreso: Clave genérica <span className="font-mono font-bold text-slate-800 bg-white px-1 py-0.2 rounded border border-slate-300">1234</span> (el sistema le solicitará definir su clave personal al ingresar).
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
            >
              <span>Ingresar al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
