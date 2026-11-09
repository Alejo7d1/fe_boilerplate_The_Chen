export const TZ = 'America/El_Salvador';

export const dayKey = (d: Date | string | number) =>
  new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });

// Los próximos 7 días (YYYY-MM-DD) en hora de El Salvador.
export function nextDays(count = 7): string[] {
  const start = Date.now();
  return Array.from({ length: count }, (_, i) => dayKey(start + i * 864e5));
}
