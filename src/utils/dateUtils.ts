/**
 * Utilities for business day calculations and date formatting
 */

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculates an array of YYYY-MM-DD dates representing business days (excluding Sat & Sun)
 * starting from `startDateStr` for `count` days.
 */
export function calculateBusinessDays(startDateStr: string, count: number): string[] {
  if (!startDateStr || count <= 0) return [];
  const result: string[] = [];
  const curr = parseDate(startDateStr);

  let added = 0;
  // Safety guard against infinite loops
  let guard = 0;
  while (added < count && guard < 365) {
    guard++;
    if (!isWeekend(curr)) {
      result.push(formatDateISO(curr));
      added++;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return result;
}

export function getMonthDaysMatrix(year: number, monthIndex: number) {
  // monthIndex: 0 = Jan, 11 = Dec
  // Week starts on Monday (1) to Sunday (0)
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const totalDays = lastDay.getDate();

  // Day of week: Sunday = 0, Monday = 1, ..., Saturday = 6
  let firstDayOfWeek = firstDay.getDay();
  // Adjust so Monday = 0, ..., Sunday = 6
  firstDayOfWeek = (firstDayOfWeek + 6) % 7;

  const matrix: Array<{ dayNumber: number | null; dateStr: string | null; isWeekend: boolean }> = [];

  // Padding days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    matrix.push({ dayNumber: null, dateStr: null, isWeekend: false });
  }

  // Days of month
  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const curDate = new Date(year, monthIndex, d);
    const dayOfWeek = curDate.getDay();
    const isWknd = dayOfWeek === 0 || dayOfWeek === 6;
    matrix.push({
      dayNumber: d,
      dateStr: dStr,
      isWeekend: isWknd
    });
  }

  // Padding to complete full weeks (multiple of 7)
  while (matrix.length % 7 !== 0) {
    matrix.push({ dayNumber: null, dateStr: null, isWeekend: false });
  }

  return matrix;
}
