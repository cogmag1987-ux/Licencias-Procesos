import React, { useState, useMemo } from 'react';
import { Analyst, License, MotivoLicencia, UserSession } from '../types';
import { exportToExcel } from '../utils/excelExport';
import { FileSpreadsheet, Filter, PieChart as PieIcon, BarChart3 } from 'lucide-react';

interface DashboardTabProps {
  analysts: Analyst[];
  licenses: License[];
  userSession: UserSession;
}

const MOTIVO_COLORS: Record<MotivoLicencia, { bg: string; fill: string; stroke: string; text: string }> = {
  Estudio: { bg: 'bg-blue-500', fill: '#3b82f6', stroke: '#2563eb', text: 'text-blue-600' },
  Examen: { bg: 'bg-indigo-500', fill: '#6366f1', stroke: '#4f46e5', text: 'text-indigo-600' },
  Enfermedad: { bg: 'bg-red-500', fill: '#ef4444', stroke: '#dc2626', text: 'text-red-600' },
  'Trámite Personal': { bg: 'bg-amber-500', fill: '#f59e0b', stroke: '#d97706', text: 'text-amber-600' },
  Médico: { bg: 'bg-emerald-500', fill: '#10b981', stroke: '#059669', text: 'text-emerald-600' },
  Vacaciones: { bg: 'bg-cyan-500', fill: '#06b6d4', stroke: '#0891b2', text: 'text-cyan-600' },
  Otro: { bg: 'bg-slate-500', fill: '#64748b', stroke: '#475569', text: 'text-slate-600' },
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  analysts,
  licenses,
  userSession,
}) => {
  const isAdmin = userSession.role === 'admin';

  // Available years from licenses
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    licenses.forEach((l) => {
      const y = l.fechaInicio.split('-')[0];
      if (y) years.add(y);
    });
    years.add('2026');
    return Array.from(years).sort().reverse();
  }, [licenses]);

  // Filters state
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedAnalystId, setSelectedAnalystId] = useState<string>(
    isAdmin ? 'TODOS' : userSession.analyst.id
  );
  const [selectedStatus, setSelectedStatus] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<MotivoLicencia | null>(null);

  // Filtered analysts based on status filter
  const filteredAnalysts = useMemo(() => {
    return analysts.filter((a) => {
      if (selectedStatus === 'ACTIVOS') return a.activo;
      if (selectedStatus === 'INACTIVOS') return !a.activo;
      return true;
    });
  }, [analysts, selectedStatus]);

  // Analyst Map for fast lookup
  const analystMap = useMemo(() => {
    const m = new Map<string, Analyst>();
    analysts.forEach((a) => m.set(a.id, a));
    return m;
  }, [analysts]);

  // Filtered licenses based on year, analyst, and analyst active/inactive status
  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      // User restriction: regular user only sees their own data
      if (!isAdmin && lic.analistaId !== userSession.analyst.id) {
        return false;
      }

      // Year filter
      if (selectedYear !== 'TODOS') {
        if (!lic.fechaInicio.startsWith(selectedYear)) return false;
      }

      // Analyst filter
      if (selectedAnalystId !== 'TODOS' && lic.analistaId !== selectedAnalystId) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'TODOS') {
        const analyst = analystMap.get(lic.analistaId);
        if (!analyst) return false;
        if (selectedStatus === 'ACTIVOS' && !analyst.activo) return false;
        if (selectedStatus === 'INACTIVOS' && analyst.activo) return false;
      }

      return true;
    });
  }, [licenses, isAdmin, userSession.analyst.id, selectedYear, selectedAnalystId, selectedStatus, analystMap]);

  // Metrics count by reason (PDF page 2)
  const metrics = useMemo(() => {
    const counts: Record<MotivoLicencia, number> = {
      Estudio: 0,
      Examen: 0,
      Enfermedad: 0,
      'Trámite Personal': 0,
      Médico: 0,
      Vacaciones: 0,
      Otro: 0,
    };

    filteredLicenses.forEach((l) => {
      if (counts[l.motivo] !== undefined) {
        counts[l.motivo] += l.diasHabiles;
      } else {
        counts['Otro'] += l.diasHabiles;
      }
    });

    const totalDays = Object.values(counts).reduce((a, b) => a + b, 0);

    return { counts, totalDays };
  }, [filteredLicenses]);

  // Group days by analyst for Bar Chart
  const analystChartData = useMemo(() => {
    const totals: Record<string, { id: string; nombre: string; dias: number }> = {};

    // Initialize list with relevant analysts
    const targetAnalysts = selectedAnalystId !== 'TODOS'
      ? filteredAnalysts.filter(a => a.id === selectedAnalystId)
      : filteredAnalysts;

    targetAnalysts.forEach((a) => {
      totals[a.id] = { id: a.id, nombre: a.nombre, dias: 0 };
    });

    filteredLicenses.forEach((l) => {
      if (totals[l.analistaId]) {
        totals[l.analistaId].dias += l.diasHabiles;
      } else {
        totals[l.analistaId] = {
          id: l.analistaId,
          nombre: l.analistaNombre,
          dias: l.diasHabiles,
        };
      }
    });

    return Object.values(totals).sort((a, b) => b.dias - a.dias);
  }, [filteredLicenses, filteredAnalysts, selectedAnalystId]);

  // Export to Excel for Dashboard
  const handleExportExcel = () => {
    const rows = filteredLicenses.map((lic) => {
      const analyst = analystMap.get(lic.analistaId);
      return {
        'ID Licencia': lic.id,
        'Analista': lic.analistaNombre,
        'Correo': analyst?.correo || '',
        'Estado Analista': analyst?.activo ? 'Activo' : 'Inactivo',
        'Motivo': lic.motivo,
        'Fecha Inicio': lic.fechaInicio,
        'Días Hábiles': lic.diasHabiles,
        'Observaciones': lic.observaciones || '',
        'Pend. Examen/Estudio': lic.pendExamenEstudio != null ? lic.pendExamenEstudio : '-',
        'Pend. Vacaciones': lic.pendVacaciones != null ? lic.pendVacaciones : '-',
      };
    });

    const fileName = `Dashboard_Licencias_${selectedYear}_${selectedStatus}`;
    exportToExcel(rows, fileName, 'Resumen Licencias');
  };

  // Prepare Donut Chart Angles
  const donutSegments = useMemo(() => {
    const total = metrics.totalDays;
    if (total === 0) return [];

    let currentAngle = 0;
    const items = (Object.keys(metrics.counts) as MotivoLicencia[]).map((m) => {
      const count = metrics.counts[m];
      const percent = (count / total) * 100;
      const angle = (count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      return {
        motivo: m,
        count,
        percent,
        startAngle,
        endAngle,
        color: MOTIVO_COLORS[m],
      };
    });

    return items;
  }, [metrics]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Filter Bar with Excel Button */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Filtros:</span>
          </div>

          {/* Desplegable Año */}
          <div className="min-w-[120px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-gray-800"
            >
              <option value="TODOS">Todos los Años</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Desplegable Analista */}
          <div className="min-w-[180px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Analista
            </label>
            {isAdmin ? (
              <select
                value={selectedAnalystId}
                onChange={(e) => setSelectedAnalystId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-gray-800"
              >
                <option value="TODOS">Todos los Analistas</option>
                {filteredAnalysts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} {!a.activo ? '(Inactivo)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-2.5 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-lg font-medium text-gray-700">
                {userSession.analyst.nombre}
              </div>
            )}
          </div>

          {/* Desplegable Activos e Inactivos */}
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Estado Analista
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'TODOS' | 'ACTIVOS' | 'INACTIVOS')}
              className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-gray-800"
            >
              <option value="TODOS">Activos e Inactivos</option>
              <option value="ACTIVOS">Solo Activos</option>
              <option value="INACTIVOS">Solo Inactivos</option>
            </select>
          </div>
        </div>

        {/* Excel Export Button (green matching PDF) */}
        <div>
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* 7 Metric Cards (PDF page 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {(
          [
            'Estudio',
            'Examen',
            'Enfermedad',
            'Trámite Personal',
            'Médico',
            'Vacaciones',
            'Otro',
          ] as MotivoLicencia[]
        ).map((m) => {
          const count = metrics.counts[m] || 0;
          return (
            <div
              key={m}
              className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/90 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                  {m}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: MOTIVO_COLORS[m].fill }}
                />
              </div>
              <div className="mt-2.5 flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {count}
                </span>
                <span className="text-xs text-slate-500 font-medium">días</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Distribución por Motivo & Días Tomados por Analista (PDF page 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Distribución por Motivo (Donut Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
              <h3 className="font-bold text-base text-gray-900 flex items-center">
                <span>Distribución por Motivo</span>
              </h3>
            </div>

            {metrics.totalDays === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-gray-400 italic">
                No hay licencias registradas para los filtros seleccionados.
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* SVG Donut */}
                <div className="relative w-48 h-48 my-2">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {donutSegments.map((seg) => {
                      if (seg.percent === 0) return null;
                      const r = 36;
                      const c = 2 * Math.PI * r;
                      const strokeDasharray = `${(seg.percent / 100) * c} ${c}`;
                      const strokeDashoffset = -((seg.startAngle / 360) * c);

                      return (
                        <circle
                          key={seg.motivo}
                          cx="50"
                          cy="50"
                          r={r}
                          fill="transparent"
                          stroke={seg.color.fill}
                          strokeWidth={hoveredDonutSegment === seg.motivo ? 18 : 15}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredDonutSegment(seg.motivo)}
                          onMouseLeave={() => setHoveredDonutSegment(null)}
                        />
                      );
                    })}
                  </svg>
                  {/* Donut Center Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-900 leading-none">
                      {hoveredDonutSegment ? metrics.counts[hoveredDonutSegment] : metrics.totalDays}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium uppercase mt-0.5">
                      {hoveredDonutSegment || 'Total Días'}
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full text-xs">
                  {donutSegments.map((seg) => (
                    <div
                      key={seg.motivo}
                      onMouseEnter={() => setHoveredDonutSegment(seg.motivo)}
                      onMouseLeave={() => setHoveredDonutSegment(null)}
                      className={`flex items-center space-x-2 p-1 rounded-md transition-colors cursor-pointer ${
                        hoveredDonutSegment === seg.motivo ? 'bg-gray-100 font-semibold' : ''
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color.fill }}
                      />
                      <span className="text-gray-700 truncate">{seg.motivo}:</span>
                      <span className="text-gray-900 font-bold ml-auto">{seg.count}d</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Días Tomados por Analista (Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-gray-200 flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h3 className="font-bold text-base text-gray-900">
              Días Tomados por Analista
            </h3>
          </div>

          {analystChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400 italic">
              No hay datos para mostrar con los filtros aplicados.
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end pt-4">
              {/* SVG / HTML Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 border-b border-gray-200 pb-2 px-2 overflow-x-auto">
                {analystChartData.map((item) => {
                  const maxDays = Math.max(25, ...analystChartData.map(d => d.dias));
                  const heightPercent = Math.max(4, (item.dias / maxDays) * 100);

                  return (
                    <div
                      key={item.id}
                      className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                        {item.nombre}: {item.dias} días
                      </div>

                      {/* Bar Value */}
                      <span className="text-[10px] font-semibold text-gray-600 mb-1 group-hover:text-blue-600">
                        {item.dias}
                      </span>

                      {/* Bar Pillar */}
                      <div
                        className="w-full bg-blue-500 group-hover:bg-blue-600 rounded-t-sm transition-all duration-300 shadow-2xs"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels (Rotated or tilted) */}
              <div className="flex justify-between gap-1 sm:gap-2 pt-2 px-2 overflow-x-auto">
                {analystChartData.map((item) => (
                  <div
                    key={item.id}
                    className="flex-1 min-w-[28px] max-w-[48px] text-center"
                    title={item.nombre}
                  >
                    <p className="text-[10px] text-gray-600 font-medium truncate transform -rotate-45 origin-top-left translate-y-3 whitespace-nowrap">
                      {item.nombre}
                    </p>
                  </div>
                ))}
              </div>

              {/* Extra spacing for rotated labels */}
              <div className="h-10" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
