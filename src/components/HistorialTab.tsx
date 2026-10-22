import React, { useState, useMemo, useRef } from 'react';
import { Analyst, License, MotivoLicencia, UserSession, CertificateFile } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { calculateBusinessDays, formatDateDisplay } from '../utils/dateUtils';
import { CertificateViewerModal } from './CertificateViewerModal';
import {
  FileSpreadsheet,
  Edit,
  Trash2,
  X,
  Save,
  AlertTriangle,
  FileText,
  Eye,
  Upload,
  FileCheck,
  Search,
} from 'lucide-react';

interface HistorialTabProps {
  analysts: Analyst[];
  licenses: License[];
  userSession: UserSession;
  onUpdateLicense: (license: License) => void;
  onDeleteLicense: (licenseId: string) => void;
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

// Refined, high-legibility badge styles with subtle borders
const MOTIVO_BADGES: Record<MotivoLicencia, string> = {
  Médico: 'bg-rose-50 text-rose-700 border border-rose-200/80',
  Examen: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
  Enfermedad: 'bg-red-50 text-red-700 border border-red-200/80',
  'Trámite Personal': 'bg-slate-100 text-slate-700 border border-slate-200',
  Estudio: 'bg-sky-50 text-sky-700 border border-sky-200/80',
  Vacaciones: 'bg-teal-50 text-teal-800 border border-teal-200/80',
  Otro: 'bg-slate-50 text-slate-600 border border-slate-200',
};

export const HistorialTab: React.FC<HistorialTabProps> = ({
  analysts,
  licenses,
  userSession,
  onUpdateLicense,
  onDeleteLicense,
}) => {
  const isAdmin = userSession.role === 'admin';
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Filters State (PDF page 5)
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>(
    isAdmin ? 'TODOS' : userSession.analyst.id
  );
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMotivo, setSelectedMotivo] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<License | null>(null);
  const [activeCertificateToView, setActiveCertificateToView] = useState<{
    certificate: CertificateFile;
    analystName: string;
    motivo: string;
    fecha: string;
  } | null>(null);

  // Edit form state
  const [editMotivo, setEditMotivo] = useState<MotivoLicencia>('Estudio');
  const [editFechaInicio, setEditFechaInicio] = useState<string>('');
  const [editDiasHabiles, setEditDiasHabiles] = useState<number>(1);
  const [editObservaciones, setEditObservaciones] = useState<string>('');
  const [editCertificado, setEditCertificado] = useState<CertificateFile | null>(null);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    licenses.forEach((l) => {
      const y = l.fechaInicio.split('-')[0];
      if (y) years.add(y);
    });
    years.add('2026');
    return Array.from(years).sort().reverse();
  }, [licenses]);

  // Filtered List
  const filteredLicenses = useMemo(() => {
    return licenses
      .filter((lic) => {
        // Normal user only sees their own
        if (!isAdmin && lic.analistaId !== userSession.analyst.id) {
          return false;
        }

        // Analyst filter
        if (selectedAnalystId !== 'TODOS' && lic.analistaId !== selectedAnalystId) {
          return false;
        }

        // Year filter
        if (selectedYear !== 'TODOS' && !lic.fechaInicio.startsWith(selectedYear)) {
          return false;
        }

        // Motivo filter
        if (selectedMotivo !== 'TODOS' && lic.motivo !== selectedMotivo) {
          return false;
        }

        // Search in analyst name or observations
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = lic.analistaNombre.toLowerCase().includes(q);
          const matchObs = (lic.observaciones || '').toLowerCase().includes(q);
          if (!matchName && !matchObs) return false;
        }

        return true;
      })
      .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));
  }, [licenses, isAdmin, userSession.analyst.id, selectedAnalystId, selectedYear, selectedMotivo, searchTerm]);

  // Open Edit Modal
  const handleOpenEdit = (lic: License) => {
    setEditingLicense(lic);
    setEditMotivo(lic.motivo);
    setEditFechaInicio(lic.fechaInicio);
    setEditDiasHabiles(lic.diasHabiles);
    setEditObservaciones(lic.observaciones || '');
    setEditCertificado(lic.certificado || null);
  };

  // Handle Edit File Upload
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditCertificado({
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          dataUrl: ev.target?.result as string,
          uploadDate: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicense) return;

    const newCovered = calculateBusinessDays(editFechaInicio, editDiasHabiles);

    const updated: License = {
      ...editingLicense,
      motivo: editMotivo,
      fechaInicio: editFechaInicio,
      diasHabiles: editDiasHabiles,
      observaciones: editObservaciones.trim(),
      fechasCubiertas: newCovered,
      certificado: editCertificado,
    };

    onUpdateLicense(updated);
    setEditingLicense(null);
  };

  // Export to Excel (PDF page 5 green button)
  const handleExportExcel = () => {
    const rows = filteredLicenses.map((lic) => ({
      Fecha: lic.fechaInicio,
      Analista: lic.analistaNombre,
      Motivo: lic.motivo,
      Certificado: lic.certificado ? `Adjunto (${lic.certificado.name})` : 'Sin certificado',
      Días: lic.diasHabiles,
      Observaciones: lic.observaciones || '',
      'Pend. Ex/Est': lic.pendExamenEstudio != null ? lic.pendExamenEstudio : '-',
      'Pend. Vacas': lic.pendVacaciones != null ? lic.pendVacaciones : '-',
      'Fecha Registro': lic.fechaRegistro,
    }));

    exportToExcel(
      rows,
      `Historial_Licencias_${selectedYear}_${selectedMotivo}`,
      'Historial'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Filter and Actions Row (PDF page 5) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Analista Dropdown */}
          <div className="min-w-[160px]">
            {isAdmin ? (
              <select
                value={selectedAnalystId}
                onChange={(e) => setSelectedAnalystId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 outline-hidden"
              >
                <option value="TODOS">Todos los analistas</option>
                {analysts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                {userSession.analyst.nombre}
              </div>
            )}
          </div>

          {/* Año Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 outline-hidden tabular-nums"
          >
            <option value="TODOS">Todos los Años</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Motivo Dropdown */}
          <select
            value={selectedMotivo}
            onChange={(e) => setSelectedMotivo(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 outline-hidden"
          >
            <option value="TODOS">Motivo (Todos)</option>
            {MOTIVOS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Quick Search */}
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-900"
            />
          </div>
        </div>

        {/* Green "Exportar Excel" Button (matching PDF page 5) */}
        <div>
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Historial Table with CERTIFICADO column between MOTIVO and DÍAS */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  FECHA
                </th>
                <th scope="col" className="px-5 py-3.5">
                  ANALISTA
                </th>
                <th scope="col" className="px-5 py-3.5">
                  MOTIVO
                </th>
                {/* COLUMNA REQUERIDA: CERTIFICADO (ENTRE MOTIVO Y DÍAS) */}
                <th scope="col" className="px-5 py-3.5 text-center">
                  CERTIFICADO
                </th>
                <th scope="col" className="px-5 py-3.5 text-center">
                  DÍAS
                </th>
                <th scope="col" className="px-5 py-3.5">
                  OBS.
                </th>
                <th scope="col" className="px-5 py-3.5 text-center text-blue-600 font-bold">
                  PEND. EX/EST
                </th>
                <th scope="col" className="px-5 py-3.5 text-center text-emerald-600 font-bold">
                  PEND. VACAS
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic">
                    No se registran solicitudes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const badgeClass = MOTIVO_BADGES[lic.motivo] || MOTIVO_BADGES.Otro;
                  const canManage = isAdmin || lic.analistaId === userSession.analyst.id;

                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* FECHA */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-900 font-mono tabular-nums font-medium">
                        {lic.fechaInicio}
                      </td>

                      {/* ANALISTA */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-900">
                        {lic.analistaNombre}
                      </td>

                      {/* MOTIVO */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                          {lic.motivo}
                        </span>
                      </td>

                      {/* CERTIFICADO (FOTO / COMPROBANTE) */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center">
                        {lic.certificado ? (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveCertificateToView({
                                certificate: lic.certificado!,
                                analystName: lic.analistaNombre,
                                motivo: lic.motivo,
                                fecha: lic.fechaInicio,
                              })
                            }
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs group cursor-pointer"
                            title={`Ver certificado adjunto: ${lic.certificado.name}`}
                          >
                            {lic.certificado.type.startsWith('image/') ||
                            lic.certificado.dataUrl.startsWith('data:image/') ? (
                              <div className="w-5 h-5 rounded overflow-hidden shrink-0 border border-blue-200/80 bg-white">
                                <img
                                  src={lic.certificado.dataUrl}
                                  alt="Miniatura"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span>Ver Foto</span>
                            <Eye className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs select-none">
                            —
                          </span>
                        )}
                      </td>

                      {/* DÍAS */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center font-bold text-slate-900 tabular-nums">
                        {lic.diasHabiles}
                      </td>

                      {/* OBS. */}
                      <td
                        className="px-5 py-3.5 max-w-xs truncate text-slate-600"
                        title={lic.observaciones}
                      >
                        {lic.observaciones || '—'}
                      </td>

                      {/* PEND. EX/EST */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center font-semibold text-blue-600 font-mono tabular-nums">
                        {lic.pendExamenEstudio != null ? lic.pendExamenEstudio : '—'}
                      </td>

                      {/* PEND. VACAS */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-center font-semibold text-emerald-600 font-mono tabular-nums">
                        {lic.pendVacaciones != null ? lic.pendVacaciones : '—'}
                      </td>

                      {/* ACCIONES: EDITAR, BORRAR (PDF page 5) */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-3 font-semibold text-xs">
                        {canManage ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(lic)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              EDITAR
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(lic)}
                              className="text-purple-600 hover:text-rose-600 cursor-pointer"
                            >
                              BORRAR
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[11px]">
                            Solo lectura
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Editar Solicitud con Soporte de Certificado */}
      {editingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 my-8">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base tracking-tight">Editar Solicitud de Licencia</h3>
              <button
                onClick={() => setEditingLicense(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Analista
                </label>
                <input
                  type="text"
                  disabled
                  value={editingLicense.analistaNombre}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Motivo
                  </label>
                  <select
                    value={editMotivo}
                    onChange={(e) => setEditMotivo(e.target.value as MotivoLicencia)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                  >
                    {MOTIVOS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Días Hábiles
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={editDiasHabiles}
                    onChange={(e) => setEditDiasHabiles(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  required
                  value={editFechaInicio}
                  onChange={(e) => setEditFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-mono tabular-nums"
                />
              </div>

              {/* Certificado adjunto en Edición */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Certificado / Comprobante (Foto)
                </label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleEditFileChange}
                  className="hidden"
                />

                {editCertificado ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-xs text-slate-800 truncate">
                        {editCertificado.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCertificateToView({
                            certificate: editCertificado,
                            analystName: editingLicense.analistaNombre,
                            motivo: editMotivo,
                            fecha: editFechaInicio,
                          })
                        }
                        className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Ver
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditCertificado(null)}
                        className="px-2 py-0.5 text-xs text-rose-600 hover:bg-rose-50 rounded"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-2 border border-dashed border-slate-300 hover:border-blue-400 rounded-lg text-xs text-blue-600 hover:bg-blue-50/50 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir o adjuntar comprobante</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  value={editObservaciones}
                  onChange={(e) => setEditObservaciones(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              ¿Eliminar Registro?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              ¿Desea eliminar la solicitud de <strong>{deleteCandidate.analistaNombre}</strong> ({deleteCandidate.motivo} del {deleteCandidate.fechaInicio})?
            </p>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteLicense(deleteCandidate.id);
                  setDeleteCandidate(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Certificado en Pantalla Completa */}
      {activeCertificateToView && (
        <CertificateViewerModal
          certificate={activeCertificateToView.certificate}
          analystName={activeCertificateToView.analystName}
          motivo={activeCertificateToView.motivo}
          fecha={activeCertificateToView.fecha}
          onClose={() => setActiveCertificateToView(null)}
        />
      )}
    </div>
  );
};
