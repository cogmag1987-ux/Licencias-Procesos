import React, { useState, useMemo } from 'react';
import { Analyst, UserSession } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { formatDateDisplay } from '../utils/dateUtils';
import { generateDirectWhatsAppUrl } from '../utils/notificationService';
import {
  Plus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  MessageSquare,
  Search,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';

interface AnalistasTabProps {
  analysts: Analyst[];
  userSession: UserSession;
  onAddAnalyst: (analyst: Analyst) => void;
  onUpdateAnalyst: (analyst: Analyst) => void;
  onDeleteAnalyst: (analystId: string) => void;
}

export const AnalistasTab: React.FC<AnalistasTabProps> = ({
  analysts,
  userSession,
  onAddAnalyst,
  onUpdateAnalyst,
  onDeleteAnalyst,
}) => {
  const isAdmin = userSession.role === 'admin';

  // Filters
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAnalyst, setEditingAnalyst] = useState<Analyst | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Analyst | null>(null);

  // Form State
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [activo, setActivo] = useState(true);
  const [diasVacacionesTotales, setDiasVacacionesTotales] = useState<number>(20);
  const [diasEstudioTotales, setDiasEstudioTotales] = useState<number>(20);
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered List
  const filteredList = useMemo(() => {
    return analysts.filter((a) => {
      // Status filter
      if (statusFilter === 'Activos' && !a.activo) return false;
      if (statusFilter === 'Inactivos' && a.activo) return false;

      // Search term
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchName = a.nombre.toLowerCase().includes(q);
        const matchEmail = a.correo.toLowerCase().includes(q);
        const matchCuit = a.cuit.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCuit) return false;
      }

      return true;
    });
  }, [analysts, statusFilter, searchTerm]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAnalyst(null);
    setNombre('');
    setCorreo('');
    setCuit('');
    setTelefono('+54 9 11 ');
    setFechaNacimiento('1990-01-01');
    setActivo(true);
    setDiasVacacionesTotales(20);
    setDiasEstudioTotales(20);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (a: Analyst) => {
    setEditingAnalyst(a);
    setNombre(a.nombre);
    setCorreo(a.correo);
    setCuit(a.cuit);
    setTelefono(a.telefono);
    setFechaNacimiento(a.fechaNacimiento);
    setActivo(a.activo);
    setDiasVacacionesTotales(a.diasVacacionesTotales);
    setDiasEstudioTotales(a.diasEstudioTotales || 20);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Add/Edit
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim()) {
      setFormError('El nombre y apellido es obligatorio.');
      return;
    }
    if (!correo.trim() || !correo.includes('@')) {
      setFormError('Debe ingresar un correo válido (preferentemente @buenosaires.gob.ar).');
      return;
    }
    if (!cuit.trim()) {
      setFormError('El CUIT es obligatorio.');
      return;
    }
    if (!telefono.trim()) {
      setFormError('El teléfono es obligatorio para enviar notificaciones de WhatsApp.');
      return;
    }

    if (editingAnalyst) {
      // Update
      const updated: Analyst = {
        ...editingAnalyst,
        nombre: nombre.trim(),
        correo: correo.trim(),
        cuit: cuit.trim(),
        telefono: telefono.trim(),
        fechaNacimiento,
        activo,
        diasVacacionesTotales,
        diasEstudioTotales,
      };
      onUpdateAnalyst(updated);
    } else {
      // Create
      const newAnalyst: Analyst = {
        id: 'ana-' + Date.now(),
        nombre: nombre.trim(),
        correo: correo.trim(),
        cuit: cuit.trim(),
        telefono: telefono.trim(),
        fechaNacimiento: fechaNacimiento || '1990-01-01',
        activo,
        diasVacacionesTotales,
        diasEstudioTotales,
        role: 'usuario',
        mustChangePassword: true,
        password: 'user123',
      };
      onAddAnalyst(newAnalyst);
    }

    setIsModalOpen(false);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = filteredList.map((a) => ({
      'Nombre y Apellido': a.nombre,
      'Correo Oficial': a.correo,
      'CUIT': a.cuit,
      'Teléfono': a.telefono,
      'Fecha de Nacimiento': a.fechaNacimiento,
      'Estado': a.activo ? 'Activo' : 'Inactivo',
      'Días de Vacaciones Asignados': a.diasVacacionesTotales,
      'Días de Estudio Cupo': a.diasEstudioTotales || 20,
      'Rol de Usuario': a.role === 'admin' ? 'Administrador' : 'Analista',
    }));

    exportToExcel(rows, `Analistas_DGSISAN_${statusFilter}`, 'Analistas');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Controls Bar (PDF page 3) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Gestión de Analistas
            </h1>
          </div>

          {/* Filter dropdown (Todos, Activos, Inactivos) */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Todos' | 'Activos' | 'Inactivos')}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 outline-hidden"
          >
            <option value="Todos">Todos</option>
            <option value="Activos">Activos</option>
            <option value="Inactivos">Inactivos</option>
          </select>

          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o CUIT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden text-gray-900"
            />
          </div>
        </div>

        {/* Action Buttons: Export Excel & Add Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agregar</span>
            </button>
          )}
        </div>
      </div>

      {/* Analysts Table (PDF page 3) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-600 uppercase font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Nombre y Apellido
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Correo Oficial
                </th>
                <th scope="col" className="px-6 py-3.5">
                  CUIT
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Teléfono / WhatsApp
                </th>
                <th scope="col" className="px-6 py-3.5">
                  F. Nacimiento
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  Días Vacas.
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">
                    No se encontraron analistas con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Nombre y Apellido */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{a.nombre}</span>
                        {a.role === 'admin' && (
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                      {a.correo}
                    </td>

                    {/* CUIT */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono tabular-nums text-[11px]">
                      {a.cuit}
                    </td>

                    {/* Teléfono con opción de enviar un whatsapp */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-700 font-mono tabular-nums">{a.telefono}</span>
                        <a
                          href={generateDirectWhatsAppUrl(a)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Enviar WhatsApp a ${a.nombre}`}
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors inline-flex items-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Fecha de Nacimiento */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono tabular-nums">
                      {formatDateDisplay(a.fechaNacimiento)}
                    </td>

                    {/* Días de vacaciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="font-bold text-gray-800 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-mono tabular-nums">
                        {a.diasVacacionesTotales} días
                      </span>
                    </td>

                    {/* Estado: Activo / Inactivo */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {a.activo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 text-gray-700">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Acciones: Editar, Borrar (PDF page 3) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-3">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleOpenEdit(a)}
                            className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(a)}
                            className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Borrar
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Agregar / Editar Analista */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 my-8">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingAnalyst ? 'Editar Analista' : 'Agregar Nuevo Analista'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre y Apellido */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Martín Pérez"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Correo Oficial (@buenosaires.gob.ar) *
                  </label>
                  <input
                    type="email"
                    required
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="usuario@buenosaires.gob.ar"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* CUIT */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    CUIT *
                  </label>
                  <input
                    type="text"
                    required
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="20-XXXXXXXX-X"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Teléfono (con WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Días de Vacaciones */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Días de Vacaciones Asignados *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={diasVacacionesTotales}
                    onChange={(e) => setDiasVacacionesTotales(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>

                {/* Estado Activo / Inactivo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Estado en el Sistema *
                  </label>
                  <select
                    value={activo ? 'activo' : 'inactivo'}
                    onChange={(e) => setActivo(e.target.value === 'activo')}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="activo">Activo (Figura en Solicitudes)</option>
                    <option value="inactivo">Inactivo (No figura en Solicitudes)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-[11px] text-blue-800">
                <strong>Nota reglamentaria:</strong> Los analistas activos figurarán en el listado desplegable de la solapa <em>Solicitud</em>. Los inactivos quedarán excluidos de la asignación directa.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingAnalyst ? 'Actualizar Analista' : 'Guardar Analista'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">
              ¿Eliminar Analista?
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              ¿Está seguro de eliminar a <strong>{deleteCandidate.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteAnalyst(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
