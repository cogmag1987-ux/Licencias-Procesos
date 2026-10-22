import React from 'react';
import { CertificateFile } from '../types';
import { formatDateDisplay } from '../utils/dateUtils';
import { X, Download, FileText, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';

interface CertificateViewerModalProps {
  certificate: CertificateFile;
  analystName: string;
  motivo: string;
  fecha: string;
  onClose: () => void;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  certificate,
  analystName,
  motivo,
  fecha,
  onClose,
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = certificate.dataUrl;
    link.download = certificate.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const win = window.open('');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Certificado - ${analystName}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${certificate.dataUrl}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const isImage = certificate.type.startsWith('image/') || certificate.dataUrl.startsWith('data:image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Certificado Respaldatorio
                </h3>
                <span className="inline-flex items-center text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Adjunto Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {analystName} • Motivo: <span className="text-blue-300 font-medium">{motivo}</span> • Fecha: <span className="tabular-nums font-mono text-slate-300">{formatDateDisplay(fecha)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrint}
              title="Imprimir certificado"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              title="Descargar comprobante"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Cerrar vista previa"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Canvas */}
        <div className="p-6 bg-slate-100 flex-1 overflow-y-auto flex items-center justify-center">
          <div className="bg-white shadow-md rounded-xl p-3 border border-slate-200/80 max-w-full">
            {isImage ? (
              <img
                src={certificate.dataUrl}
                alt={`Certificado de ${analystName}`}
                className="max-h-[60vh] w-auto object-contain rounded-lg mx-auto"
              />
            ) : (
              <div className="py-16 px-8 text-center space-y-4">
                <FileText className="w-16 h-16 text-blue-600 mx-auto" />
                <div>
                  <h4 className="font-semibold text-slate-900">{certificate.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {(certificate.size / 1024).toFixed(1)} KB • {certificate.type}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Documento</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Meta & Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate max-w-xs sm:max-w-md font-mono text-[11px] text-slate-700">
              {certificate.name} ({(certificate.size / 1024).toFixed(1)} KB)
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium transition-colors inline-flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
