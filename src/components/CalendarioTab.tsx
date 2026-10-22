import React, { useState, useMemo } from 'react';
import { Analyst, License, UserSession, CertificateFile } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { getMonthDaysMatrix, formatDateDisplay } from '../utils/dateUtils';
import { CertificateViewerModal } from './CertificateViewerModal';
import { FileSpreadsheet, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, X, FileCheck } from 'lucide-react';

interface CalendarioTabProps {
  analysts: Analyst[];
  licenses: License[];
  userSession: UserSession;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Pastel colors matching the aesthetic from the PDF
const PILL_COLORS: Array<{ bg: string; text: string; border: string }> = [
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
];

export const CalendarioTab: React.FC<CalendarioTabProps> = ({
  analysts,
  licenses,
  userSession,
}) => {
  const isAdmin = userSession.role === 'admin';

  // State for Month, Year, and Analyst Filter
  // Default to October 2026 to match PDF screenshot!
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>(
    isAdmin ? 'TODOS' : userSession.analyst.id
  );

  // Selected date modal / details
  const [activeDayDetails, setActiveDayDetails] = useState<{
    dateStr: string;
    events: Array<{ license: License; analyst?: Analyst }>;
  } | null>(null);

  const [activeCertForCalendar, setActiveCertForCalendar] = useState<{
    certificate: CertificateFile;
    analystName: string;
    motivo: string;
    fecha: string;
  } | null>(null);

  // Color generator based on analyst id or name for visual consistency
  const getAnalystColor = (analystId: string) => {
    let hash = 0;
    for (let i = 0; i < analystId.length; i++) {
      hash = analystId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % PILL_COLORS.length;
    return PILL_COLORS[idx];
  };

  // Map of analysts
  const analystMap = useMemo(() => {
    const map = new Map<string, Analyst>();
    analysts.forEach(a => map.set(a.id, a));
    return map;
  }, [analysts]);

  // Map of licenses by day
  const dayLicensesMap = useMemo(() => {
    const map = new Map<string, Array<{ license: License; analyst?: Analyst }>>();

    licenses.forEach((lic) => {
      // If user is regular analyst, only show their leaves unless admin
      if (!isAdmin && lic.analistaId !== userSession.analyst.id) {
        return;
      }

      if (selectedAnalystId !== 'TODOS' && lic.analistaId !== selectedAnalystId) {
        return;
      }

      const daysCovered = lic.fechasCubiertas && lic.fechasCubiertas.length > 0
        ? lic.fechasCubiertas
        : [lic.fechaInicio];

      daysCovered.forEach((dStr) => {
        const existing = map.get(dStr) || [];
        existing.push({
          license: lic,
          analyst: analystMap.get(lic.analistaId),
        });
        map.set(dStr, existing);
      });
    });

    return map;
  }, [licenses, selectedAnalystId, analystMap, isAdmin, userSession.analyst.id]);

  // Calendar matrix
  const calendarMatrix = useMemo(() => {
    return getMonthDaysMatrix(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Export to Excel for Calendar
  const handleExportExcel = () => {
    const currentMonthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const rows: Record<string, unknown>[] = [];

    licenses.forEach((lic) => {
      if (!isAdmin && lic.analistaId !== userSession.analyst.id) return;
      if (selectedAnalystId !== 'TODOS' && lic.analistaId !== selectedAnalystId) return;

      const covered = lic.fechasCubiertas || [lic.fechaInicio];
      covered.forEach((d) => {
        if (d.startsWith(currentMonthPrefix)) {
          rows.push({
            'Fecha del Día': d,
            'Mes': MONTH_NAMES[selectedMonth],
            'Año': selectedYear,
            'Analista': lic.analistaNombre,
            'Motivo': lic.motivo,
            'Fecha Inicio Solicitud': lic.fechaInicio,
            'Días Hábiles Solicitados': lic.diasHabiles,
            'Observaciones': lic.observaciones || '',
          });
        }
      });
    });

    exportToExcel(
      rows,
      `Calendario_Licencias_${MONTH_NAMES[selectedMonth]}_${selectedYear}`,
      'Calendario'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Filter and Navigation Bar (PDF page 4) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900 outline-hidden"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900 outline-hidden"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Analyst Selector */}
          <div className="min-w-[180px]">
            {isAdmin ? (
              <select
                value={selectedAnalystId}
                onChange={(e) => setSelectedAnalystId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-gray-800 outline-hidden"
              >
                <option value="TODOS">Todos</option>
                {analysts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium">
                {userSession.analyst.nombre}
              </div>
            )}
          </div>
        </div>

        {/* Excel Export Button */}
        <div>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container (PDF page 4) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Day Header row: Lun, Mar, Mié, Jue, Vie, Sáb, Dom */}
        <div className="grid grid-cols-7 border-b border-gray-200 text-center bg-gray-50/70 text-xs font-semibold text-gray-600">
          {WEEK_DAYS.map((day, idx) => (
            <div
              key={day}
              className={`py-3 ${idx >= 5 ? 'text-gray-400 bg-gray-50/40' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
          {calendarMatrix.map((cell, idx) => {
            const hasDate = cell.dateStr !== null;
            const events = hasDate ? dayLicensesMap.get(cell.dateStr!) || [] : [];
            const isWeekendCell = cell.isWeekend;

            return (
              <div
                key={idx}
                className={`min-h-[110px] p-2 flex flex-col justify-start transition-colors relative ${
                  !hasDate
                    ? 'bg-gray-50/30'
                    : isWeekendCell
                    ? 'bg-slate-50/50'
                    : 'bg-white hover:bg-blue-50/20'
                }`}
              >
                {/* Day number */}
                {hasDate && (
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold px-1 rounded ${
                        isWeekendCell ? 'text-gray-400' : 'text-gray-800'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {events.length > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full font-bold">
                        {events.length}
                      </span>
                    )}
                  </div>
                )}

                {/* Events list: Pills for each covered license */}
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] no-scrollbar">
                  {events.map((ev, evIdx) => {
                    const color = getAnalystColor(ev.license.analistaId);
                    // Extract first name or short name like in PDF (e.g. Andrea, Luis, Cristian, Gastón, Violeta, Soledad, Rebeca)
                    const firstName = ev.license.analistaNombre.split(' ')[0];

                    return (
                      <button
                        key={`${ev.license.id}-${evIdx}`}
                        onClick={() =>
                          setActiveDayDetails({
                            dateStr: cell.dateStr!,
                            events,
                          })
                        }
                        title={`${ev.license.analistaNombre} - ${ev.license.motivo}`}
                        className={`text-left text-[11px] font-medium px-2 py-0.5 rounded-md border truncate shadow-2xs transition-transform hover:scale-[1.02] cursor-pointer ${color.bg} ${color.text} ${color.border}`}
                      >
                        {firstName}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Detalle de Licencias del Día */}
      {activeDayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-base">
                  Licencias del {formatDateDisplay(activeDayDetails.dateStr)}
                </h3>
              </div>
              <button
                onClick={() => setActiveDayDetails(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {activeDayDetails.events.map(({ license, analyst }) => (
                <div
                  key={license.id}
                  className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {license.analistaNombre}
                      </h4>
                      <p className="text-[11px] text-gray-500">{analyst?.correo}</p>
                    </div>
                    <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                      {license.motivo}
                    </span>
                  </div>

                  <div className="text-gray-600 pt-1 border-t border-gray-200 flex justify-between">
                    <span>Inicio: {formatDateDisplay(license.fechaInicio)}</span>
                    <span className="font-semibold text-gray-800">
                      {license.diasHabiles} día(s) hábiles
                    </span>
                  </div>

                  {license.observaciones && (
                    <div className="bg-white p-2 rounded border border-gray-100 text-gray-700 italic">
                      "{license.observaciones}"
                    </div>
                  )}

                  {license.certificado && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCertForCalendar({
                            certificate: license.certificado!,
                            analystName: license.analistaNombre,
                            motivo: license.motivo,
                            fecha: license.fechaInicio,
                          })
                        }
                        className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Ver Certificado Adjunto ({license.certificado.name})</span>
                      </button>
                    </div>
                  )}

                  {analyst && (
                    <div className="text-[11px] text-gray-500 flex justify-between pt-1">
                      <span>Tel: {analyst.telefono}</span>
                      <span>CUIT: {analyst.cuit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveDayDetails(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {activeCertForCalendar && (
        <CertificateViewerModal
          certificate={activeCertForCalendar.certificate}
          analystName={activeCertForCalendar.analystName}
          motivo={activeCertForCalendar.motivo}
          fecha={activeCertForCalendar.fecha}
          onClose={() => setActiveCertForCalendar(null)}
        />
      )}
    </div>
  );
};
