export function getDRDateBounds(fechaStr?: string): { startDate: Date, endDate: Date } {
  let year, month, date;
  
  if (fechaStr) {
    // Expected format: YYYY-MM-DD
    const parts = fechaStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // 0-indexed
    date = parseInt(parts[2], 10);
  } else {
    // Current DR Time
    const now = new Date();
    // UTC-4
    const drTimeMs = now.getTime() - (4 * 3600000);
    const drDate = new Date(drTimeMs);
    year = drDate.getUTCFullYear();
    month = drDate.getUTCMonth();
    date = drDate.getUTCDate();
  }

  // DR midnight is 04:00 UTC
  const startDate = new Date(Date.UTC(year, month, date, 4, 0, 0, 0));
  // DR 23:59:59 is 03:59:59.999 UTC the next day
  const endDate = new Date(Date.UTC(year, month, date + 1, 3, 59, 59, 999));

  return { startDate, endDate };
}

export function isDateInDRHoy(fecha: Date): boolean {
  const { startDate, endDate } = getDRDateBounds();
  return fecha.getTime() >= startDate.getTime() && fecha.getTime() <= endDate.getTime();
}
