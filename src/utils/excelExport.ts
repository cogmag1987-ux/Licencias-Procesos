import * as XLSX from 'xlsx';

/**
 * Utility function to export data to an Excel (.xlsx) file and trigger browser download
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'Datos'
) {
  if (!data || data.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on longest string in each column
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    let maxLength = key.length;
    data.forEach((row) => {
      const val = row[key];
      const strVal = val != null ? String(val) : '';
      if (strVal.length > maxLength) {
        maxLength = strVal.length;
      }
    });
    return { wch: Math.min(Math.max(maxLength + 3, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  // Write and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
