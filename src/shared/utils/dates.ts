/** Fecha local en formato YYYY-MM-DD. */
export function toLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(value: string, days: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

export function daysAgo(days: number, from: Date = new Date()): string {
  return addDays(toLocalDate(from), -days);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function startOfWeek(value: string): string {
  const date = parseLocalDate(value);
  const offset = (date.getDay() + 6) % 7;
  return addDays(value, -offset);
}

export function monthKey(value: string): string {
  return value.slice(0, 7);
}
