import React from 'react';
import { UserSession, NotificationLog } from '../types';
import { Bell, LogOut, Key, Shield, User, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'solicitud' | 'dashboard' | 'analistas' | 'calendario' | 'historial';
  setActiveTab: (tab: 'solicitud' | 'dashboard' | 'analistas' | 'calendario' | 'historial') => void;
  userSession: UserSession;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenNotifications: () => void;
  onResetData: () => void;
  notifications: NotificationLog[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userSession,
  onLogout,
  onOpenChangePassword,
  onOpenNotifications,
  onResetData,
  notifications,
}) => {
  const isAdmin = userSession.role === 'admin';
  const unreadCount = notifications.filter(n => !n.leido).length;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center bg-white shadow-xs p-0.5">
              <img
                src="/assets/aistudio/Logo_Procesos_3e69bf87.jpg"
                alt="Logo Procesos - DGSISAN"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">
                  DGSISAN PROCESOS - LICENCIAS
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <User className="w-3 h-3 mr-1" />
                    Analista
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 hidden sm:block">
                Gobierno de la Ciudad de Buenos Aires
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('solicitud')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'solicitud'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Solicitud
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('analistas')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analistas'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analistas
            </button>
            <button
              onClick={() => setActiveTab('calendario')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'calendario'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'historial'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Historial
            </button>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-2">
            {/* Notification logs */}
            <button
              onClick={onOpenNotifications}
              title="Notificaciones automáticas (Emails y WhatsApp)"
              className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
              )}
            </button>

            {/* User Info & Dropdown */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">
                {userSession.analyst.nombre}
              </span>
              <span className="text-[11px] text-gray-600 truncate max-w-[150px]">
                {userSession.analyst.correo}
              </span>
            </div>

            <button
              onClick={onOpenChangePassword}
              title="Cambiar contraseña"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              title="Restablecer datos de fábrica"
              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
