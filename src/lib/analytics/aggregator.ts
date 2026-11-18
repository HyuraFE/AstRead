import type { ReadingSession } from "../../types/database";

export interface WeeklyStats {
  weekStart: string; // ISO date string (Monday)
  weekEnd: string;   // ISO date string (Sunday)
  totalPages: number;
  totalMinutes: number;
  sessionCount: number;
  avgSpeed: number; // pages per hour
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalPages: number;
  totalMinutes: number;
  sessionCount: number;
  avgSpeed: number;
  dailyBreakdown: Array<{
    date: string; // YYYY-MM-DD
    pages: number;
    minutes: number;
  }>;
}

/**
 * Aggregate sessions into weekly buckets (Monday-Sunday).
 */
export function aggregateWeeklyStats(sessions: ReadingSession[]): WeeklyStats[] {
  if (!sessions || sessions.length === 0) return [];

  const weekMap = new Map<string, { pages: number; minutes: number; count: number }>();

  for (const s of sessions) {
    const date = new Date(s.session_date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    const monday = new Date(date);
    monday.setDate(diff);
    const weekKey = monday.toISOString().split("T")[0];

    const existing = weekMap.get(weekKey) || { pages: 0, minutes: 0, count: 0 };
    existing.pages += s.pages_read;
    existing.minutes += s.duration_minutes;
    existing.count += 1;
    weekMap.set(weekKey, existing);
  }

  return Array.from(weekMap.entries())
    .map(([weekStart, data]) => {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        weekStart,
        weekEnd: end.toISOString().split("T")[0],
        totalPages: data.pages,
        totalMinutes: data.minutes,
        sessionCount: data.count,
        avgSpeed: data.minutes > 0 ? Math.round((data.pages / (data.minutes / 60)) * 100) / 100 : 0,
      };
    })
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Aggregate sessions into monthly buckets with daily breakdown.
 */
export function aggregateMonthlyStats(sessions: ReadingSession[]): MonthlyStats[] {
  if (!sessions || sessions.length === 0) return [];

  const monthMap = new Map<string, Map<string, { pages: number; minutes: number }>>();

  for (const s of sessions) {
    const monthKey = s.session_date.substring(0, 7); // YYYY-MM
    const dayKey = s.session_date;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, new Map());
    }
    const dayMap = monthMap.get(monthKey)!;
    const existing = dayMap.get(dayKey) || { pages: 0, minutes: 0 };
    existing.pages += s.pages_read;
    existing.minutes += s.duration_minutes;
    dayMap.set(dayKey, existing);
  }

  return Array.from(monthMap.entries())
    .map(([month, dayMap]) => {
      let totalPages = 0;
      let totalMinutes = 0;
      let sessionCount = 0;

      const dailyBreakdown = Array.from(dayMap.entries())
        .map(([date, data]) => {
          totalPages += data.pages;
          totalMinutes += data.minutes;
          sessionCount += 1;
          return { date, pages: data.pages, minutes: data.minutes };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        month,
        totalPages,
        totalMinutes,
        sessionCount,
        avgSpeed: totalMinutes > 0 ? Math.round((totalPages / (totalMinutes / 60)) * 100) / 100 : 0,
        dailyBreakdown,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate current reading streak (consecutive days with at least one session).
 */
export function calculateStreak(sessions: ReadingSession[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const uniqueDays = new Set(sessions.map((s) => s.session_date));
  const sortedDays = Array.from(uniqueDays).sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let currentDate = new Date(today);

  for (const day of sortedDays) {
    const dayDate = new Date(day);
    const diffTime = currentDate.getTime() - dayDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      streak++;
      currentDate = dayDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Determine reading pace trend by comparing recent vs older sessions.
 */
export function getReadingPaceTrend(sessions: ReadingSession[]): "improving" | "declining" | "stable" {
  if (!sessions || sessions.length < 4) return "stable";

  const sorted = [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date));
  const mid = Math.floor(sorted.length / 2);
  const recent = sorted.slice(mid);
  const older = sorted.slice(0, mid);

  const recentSpeed = recent.reduce((sum, s) => sum + s.speed_pages_per_hour, 0) / recent.length;
  const olderSpeed = older.reduce((sum, s) => sum + s.speed_pages_per_hour, 0) / older.length;

  if (recentSpeed > olderSpeed * 1.1) return "improving";
  if (recentSpeed < olderSpeed * 0.9) return "declining";
  return "stable";
}
