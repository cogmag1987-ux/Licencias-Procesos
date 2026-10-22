import { CertificateFile } from '../types';

/**
 * Creates an authentic SVG data URL for sample certificates (Medical, Exam, etc.)
 */
export function createSampleCertificateSvg(
  tipo: 'Médico' | 'Examen' | 'Enfermedad',
  analistaNombre: string,
  fecha: string,
  diagnostico: string,
  doctorOInstitucion: string
): string {
  const isMed = tipo === 'Médico' || tipo === 'Enfermedad';
  const headerTitle = isMed ? 'CERTIFICADO MÉDICO OFICIAL' : 'CONSTANCIA DE EXAMEN UNIVERSITARIO';
  const subtitle = isMed ? 'Subsecretaría de Atención y Salud Laboral - GCBA' : 'Facultad de Ciencias Económicas / Exactas - UBA';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="1"/>
      </pattern>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </linearGradient>
    </defs>

    <!-- Background sheet -->
    <rect width="800" height="1000" fill="#ffffff" />
    <rect width="800" height="1000" fill="url(#grid)" />
    
    <!-- Outer border -->
    <rect x="25" y="25" width="750" height="950" fill="none" stroke="#cbd5e1" stroke-width="2" rx="8"/>
    <rect x="35" y="35" width="730" height="930" fill="none" stroke="#e2e8f0" stroke-width="1" rx="6"/>

    <!-- Header bar -->
    <rect x="35" y="35" width="730" height="110" fill="url(#headerGrad)" rx="6"/>
    
    <!-- Header text -->
    <text x="70" y="80" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" letter-spacing="1">
      ${headerTitle}
    </text>
    <text x="70" y="112" fill="#93c5fd" font-family="system-ui, -apple-system, sans-serif" font-size="13">
      ${subtitle}
    </text>
    <text x="690" y="95" fill="#e2e8f0" font-family="monospace" font-size="12" text-anchor="end">
      N° DOC: ${Math.floor(100000 + Math.random() * 900000)}
    </text>

    <!-- Document Info Box -->
    <rect x="70" y="180" width="660" height="60" fill="#f8fafc" stroke="#e2e8f0" rx="6" />
    <text x="90" y="215" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">
      FECHA DE EMISIÓN: <tspan fill="#0f172a">${fecha}</tspan>
    </text>
    <text x="450" y="215" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600">
      ESTADO: <tspan fill="#16a34a">VÁLIDO / VERIFICADO</tspan>
    </text>

    <!-- Body content -->
    <g transform="translate(70, 275)" font-family="system-ui, -apple-system, sans-serif">
      <text x="0" y="0" fill="#64748b" font-size="12" text-transform="uppercase" letter-spacing="0.5" font-weight="bold">
        DATOS DEL BENEFICIARIO / ANALISTA:
      </text>
      <text x="0" y="32" fill="#0f172a" font-size="20" font-weight="bold">
        ${analistaNombre}
      </text>
      <text x="0" y="60" fill="#475569" font-size="13">
        Agente dependiente de la Dirección General de Sistemas de Información (DGSISAN) - GCBA.
      </text>

      <!-- Divider line -->
      <line x1="0" y1="90" x2="660" y2="90" stroke="#e2e8f0" stroke-width="1" />

      <!-- Section: Medical / Exam info -->
      <text x="0" y="125" fill="#64748b" font-size="12" text-transform="uppercase" letter-spacing="0.5" font-weight="bold">
        ${isMed ? 'DIAGNÓSTICO Y PRESCRIPCIÓN MÉDICA:' : 'ASIGNATURA Y CONDICIÓN DE EVALUACIÓN:'}
      </text>
      
      <rect x="0" y="145" width="660" height="100" fill="#ffffff" stroke="#cbd5e1" stroke-dasharray="4" rx="6"/>
      <text x="25" y="185" fill="#0f172a" font-size="15" font-style="italic" font-weight="500">
        "${diagnostico}"
      </text>
      <text x="25" y="215" fill="#475569" font-size="13">
        ${isMed ? 'Se indica reposo laboral e imposibilidad de concurrir a sus tareas habituales.' : 'Se extiende la presente a pedido del interesado para ser presentada ante quien corresponda.'}
      </text>

      <!-- Authority info -->
      <text x="0" y="295" fill="#64748b" font-size="12" text-transform="uppercase" letter-spacing="0.5" font-weight="bold">
        PROFESIONAL / INSTITUCIÓN INTERVINIENTE:
      </text>
      <text x="0" y="325" fill="#0f172a" font-size="15" font-weight="600">
        ${doctorOInstitucion}
      </text>
      <text x="0" y="350" fill="#64748b" font-size="12">
        Matrícula Nacional / Registro Oficial: M.N. ${Math.floor(10000 + Math.random() * 89999)}
      </text>
    </g>

    <!-- Signatures and stamps -->
    <g transform="translate(120, 780)">
      <!-- Institutional Stamp -->
      <circle cx="80" cy="50" r="48" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6,3" opacity="0.8"/>
      <circle cx="80" cy="50" r="38" fill="none" stroke="#2563eb" stroke-width="1" opacity="0.6"/>
      <text x="80" y="45" fill="#2563eb" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" letter-spacing="1">GCBA OFICIAL</text>
      <text x="80" y="60" fill="#2563eb" font-family="system-ui, sans-serif" font-size="8" text-anchor="middle">CERTIFICADO</text>

      <!-- Signature Line -->
      <line x1="320" y1="60" x2="520" y2="60" stroke="#475569" stroke-width="1.5" />
      <path d="M 340 50 Q 380 20, 420 48 T 470 30" fill="none" stroke="#1e3a8a" stroke-width="2.5" />
      <text x="420" y="80" fill="#475569" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="middle">
        Firma y Sello del Profesional
      </text>
      <text x="420" y="96" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">
        Validador Digital DGSISAN
      </text>
    </g>

    <!-- Bottom security bar -->
    <rect x="35" y="930" width="730" height="35" fill="#f1f5f9" rx="4"/>
    <text x="55" y="952" fill="#64748b" font-family="monospace" font-size="10">
      HASH SEGURIDAD: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()} • SISTEMA DE GESTIÓN DE LICENCIAS PROCESOS
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Prepares default mock certificates for the sample historical records
 */
export function createSampleCertificateFile(
  tipo: 'Médico' | 'Examen' | 'Enfermedad',
  analistaNombre: string,
  fecha: string,
  diagnostico: string,
  doctorOInstitucion: string
): CertificateFile {
  const fileName = `Certificado_${tipo.toLowerCase()}_${analistaNombre.replace(/\s+/g, '_')}_${fecha}.png`;
  const dataUrl = createSampleCertificateSvg(tipo, analistaNombre, fecha, diagnostico, doctorOInstitucion);
  
  return {
    name: fileName,
    size: 245000, // ~245 KB
    type: 'image/svg+xml',
    dataUrl,
    uploadDate: `${fecha}T09:00:00Z`,
  };
}
