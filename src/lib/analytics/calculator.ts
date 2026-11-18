/**
 * Pure business logic for AstRead Dynamic Speed & Time Estimation Analytics
 */

export interface SessionReadingInput {
  pagesRead: number;
  durationMinutes: number;
}

/**
 * Hitung kecepatan membaca dalam satuan lembar/halaman per jam (pages per hour).
 */
export function calculateSessionSpeed(pagesRead: number, durationMinutes: number): number {
  if (pagesRead <= 0 || durationMinutes <= 0) {
    return 0;
  }
  const hours = durationMinutes / 60;
  return Math.round((pagesRead / hours) * 100) / 100;
}

/**
 * Hitung estimasi sisa waktu baca (dalam jam) berdasarkan sisa halaman dan kecepatan baca rata-rata.
 */
export function calculateRemainingHours(
  currentPage: number,
  totalPages: number,
  speedPagesPerHour: number
): number {
  if (speedPagesPerHour <= 0) {
    return 0;
  }
  const pagesRemaining = Math.max(0, totalPages - currentPage);
  if (pagesRemaining === 0) {
    return 0;
  }
  return Math.round((pagesRemaining / speedPagesPerHour) * 100) / 100;
}

/**
 * Hitung weighted rolling average kecepatan baca dari histori sesi baca terakhir.
 * Jika histori kosong, gunakan fallback default (default: 30 lembar/jam).
 */
export function calculateRollingSpeed(
  sessions: SessionReadingInput[],
  fallbackSpeed: number = 30
): number {
  if (!sessions || sessions.length === 0) {
    return fallbackSpeed;
  }

  let totalPages = 0;
  let totalMinutes = 0;

  for (const s of sessions) {
    if (s.pagesRead > 0 && s.durationMinutes > 0) {
      totalPages += s.pagesRead;
      totalMinutes += s.durationMinutes;
    }
  }

  if (totalPages === 0 || totalMinutes === 0) {
    return fallbackSpeed;
  }

  const hours = totalMinutes / 60;
  return Math.round((totalPages / hours) * 100) / 100;
}

/**
 * Format durasi jam desimal menjadi teks ringkas dan ramah pembaca (misal: "1j 15m", "45m", "2j").
 */
export function formatDuration(hours: number): string {
  if (hours <= 0 || isNaN(hours)) {
    return "0m";
  }

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}j`;
  }
  return `${h}j ${m}m`;
}
