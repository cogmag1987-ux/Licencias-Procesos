/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Analyst, License, NotificationLog, UserSession } from './types';
import {
  getStoredAnalysts,
  saveStoredAnalysts,
  getStoredLicenses,
  saveStoredLicenses,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredUserSession,
  saveStoredUserSession,
  resetAllToDefault,
} from './utils/storage';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SolicitudTab } from './components/SolicitudTab';
import { DashboardTab } from './components/DashboardTab';
import { AnalistasTab } from './components/AnalistasTab';
import { CalendarioTab } from './components/CalendarioTab';
import { HistorialTab } from './components/HistorialTab';
import { NotificationModal } from './components/NotificationModal';

export default function App() {
  const [analysts, setAnalysts] = useState<Analyst[]>(getStoredAnalysts);
  const [licenses, setLicenses] = useState<License[]>(getStoredLicenses);
  const [notifications, setNotifications] = useState<NotificationLog[]>(getStoredNotifications);
  const [userSession, setUserSession] = useState<UserSession | null>(getStoredUserSession);

  const [activeTab, setActiveTab] = useState<
    'solicitud' | 'dashboard' | 'analistas' | 'calendario' | 'historial'
  >('solicitud');

  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    saveStoredAnalysts(analysts);
  }, [analysts]);

  useEffect(() => {
    saveStoredLicenses(licenses);
  }, [licenses]);

  useEffect(() => {
    saveStoredNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveStoredUserSession(userSession);
  }, [userSession]);

  // Check if current user must change password
  const mustChangePassword = !!userSession?.analyst.mustChangePassword;

  // Handle Login
  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    if (session.analyst.mustChangePassword) {
      setShowChangePasswordModal(true);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setUserSession(null);
    setShowChangePasswordModal(false);
  };

  // Handle Password Update
  const handleSaveNewPassword = (newPassword: string) => {
    if (!userSession) return;

    const updatedAnalysts = analysts.map((a) => {
      if (a.id === userSession.analyst.id) {
        return {
          ...a,
          password: newPassword,
          mustChangePassword: false,
        };
      }
      return a;
    });

    setAnalysts(updatedAnalysts);

    // Update current session
    setUserSession({
      ...userSession,
      analyst: {
        ...userSession.analyst,
        password: newPassword,
        mustChangePassword: false,
      },
    });

    setShowChangePasswordModal(false);
    alert('¡Contraseña actualizada exitosamente!');
  };

  // Add new license (from SolicitudTab)
  const handleAddLicense = (newLic: License) => {
    setLicenses((prev) => [newLic, ...prev]);
  };

  // Update existing license (from HistorialTab)
  const handleUpdateLicense = (updatedLic: License) => {
    setLicenses((prev) =>
      prev.map((l) => (l.id === updatedLic.id ? updatedLic : l))
    );
  };

  // Delete license (from HistorialTab)
  const handleDeleteLicense = (licenseId: string) => {
    setLicenses((prev) => prev.filter((l) => l.id !== licenseId));
  };

  // Add new analyst (from AnalistasTab)
  const handleAddAnalyst = (newAnalyst: Analyst) => {
    setAnalysts((prev) => [...prev, newAnalyst]);
  };

  // Update existing analyst (from AnalistasTab)
  const handleUpdateAnalyst = (updatedAnalyst: Analyst) => {
    setAnalysts((prev) =>
      prev.map((a) => (a.id === updatedAnalyst.id ? updatedAnalyst : a))
    );

    // Also update names in licenses if changed
    setLicenses((prev) =>
      prev.map((l) =>
        l.analistaId === updatedAnalyst.id
          ? { ...l, analistaNombre: updatedAnalyst.nombre }
          : l
      )
    );

    // If current session is this analyst, update session too
    if (userSession && userSession.analyst.id === updatedAnalyst.id) {
      setUserSession({
        ...userSession,
        analyst: updatedAnalyst,
      });
    }
  };

  // Delete analyst (from AnalistasTab)
  const handleDeleteAnalyst = (analystId: string) => {
    setAnalysts((prev) => prev.filter((a) => a.id !== analystId));
  };

  // Handle new notification
  const handleNotificationCreated = (log: NotificationLog) => {
    setNotifications((prev) => [log, ...prev]);
  };

  // Mark notifications as read
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leido: true })));
  };

  // Reset demo data
  const handleResetData = () => {
    if (
      window.confirm(
        '¿Desea restablecer todos los analistas, solicitudes y datos a los valores predeterminados iniciales?'
      )
    ) {
      resetAllToDefault();
    }
  };

  // If user is not authenticated, show Login screen
  if (!userSession) {
    return <LoginModal analysts={analysts} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userSession={userSession}
        onLogout={handleLogout}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onResetData={handleResetData}
        notifications={notifications}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'solicitud' && (
          <SolicitudTab
            analysts={analysts}
            licenses={licenses}
            userSession={userSession}
            onAddLicense={handleAddLicense}
            onNotificationCreated={handleNotificationCreated}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            analysts={analysts}
            licenses={licenses}
            userSession={userSession}
          />
        )}

        {activeTab === 'analistas' && (
          <AnalistasTab
            analysts={analysts}
            userSession={userSession}
            onAddAnalyst={handleAddAnalyst}
            onUpdateAnalyst={handleUpdateAnalyst}
            onDeleteAnalyst={handleDeleteAnalyst}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarioTab
            analysts={analysts}
            licenses={licenses}
            userSession={userSession}
          />
        )}

        {activeTab === 'historial' && (
          <HistorialTab
            analysts={analysts}
            licenses={licenses}
            userSession={userSession}
            onUpdateLicense={handleUpdateLicense}
            onDeleteLicense={handleDeleteLicense}
          />
        )}
      </main>

      {/* Forced or Manual Change Password Modal */}
      {(showChangePasswordModal || mustChangePassword) && (
        <ChangePasswordModal
          analyst={userSession.analyst}
          isForced={mustChangePassword}
          onSave={handleSaveNewPassword}
          onCancel={
            mustChangePassword ? undefined : () => setShowChangePasswordModal(false)
          }
        />
      )}

      {/* Notifications Drawer / Log Modal */}
      {showNotificationsModal && (
        <NotificationModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
        />
      )}
    </div>
  );
}
