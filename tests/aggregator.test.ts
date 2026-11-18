import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateWeeklyStats,
  aggregateMonthlyStats,
  calculateStreak,
  getReadingPaceTrend,
} from "../src/lib/analytics/aggregator";
import type { ReadingSession } from "../src/types/database";

function makeSession(overrides: Partial<ReadingSession>): ReadingSession {
  return {
    id: `s-${Math.random().toString(36).substring(2, 7)}`,
    book_id: "book-1",
    user_id: "user-1",
    start_page: 0,
    end_page: 30,
    pages_read: 30,
    duration_minutes: 60,
    speed_pages_per_hour: 30,
    session_date: "2026-11-18",
    notes: null,
    created_at: "2026-11-18T10:00:00.000Z",
    ...overrides,
  };
}

test("aggregateWeeklyStats groups sessions by week (Monday start)", () => {
  const sessions = [
    makeSession({ session_date: "2026-11-16", pages_read: 20, duration_minutes: 40 }), // Monday
    makeSession({ session_date: "2026-11-17", pages_read: 30, duration_minutes: 60 }), // Tuesday
    makeSession({ session_date: "2026-11-18", pages_read: 10, duration_minutes: 20 }), // Wednesday
    makeSession({ session_date: "2026-11-09", pages_read: 50, duration_minutes: 100 }), // Previous Monday
  ];

  const weekly = aggregateWeeklyStats(sessions);
  assert.equal(weekly.length, 2);
  assert.equal(weekly[0].weekStart, "2026-11-09");
  assert.equal(weekly[0].totalPages, 50);
  assert.equal(weekly[1].weekStart, "2026-11-16");
  assert.equal(weekly[1].totalPages, 60);
  assert.equal(weekly[1].totalMinutes, 120);
  assert.equal(weekly[1].sessionCount, 3);
});

test("aggregateWeeklyStats returns empty array for no sessions", () => {
  assert.deepEqual(aggregateWeeklyStats([]), []);
});

test("aggregateMonthlyStats groups by month with daily breakdown", () => {
  const sessions = [
    makeSession({ session_date: "2026-11-01", pages_read: 20, duration_minutes: 40 }),
    makeSession({ session_date: "2026-11-01", pages_read: 10, duration_minutes: 20 }),
    makeSession({ session_date: "2026-11-15", pages_read: 30, duration_minutes: 60 }),
    makeSession({ session_date: "2026-10-20", pages_read: 40, duration_minutes: 80 }),
  ];

  const monthly = aggregateMonthlyStats(sessions);
  assert.equal(monthly.length, 2);
  assert.equal(monthly[0].month, "2026-10");
  assert.equal(monthly[0].totalPages, 40);
  assert.equal(monthly[1].month, "2026-11");
  assert.equal(monthly[1].totalPages, 60);
  assert.equal(monthly[1].dailyBreakdown.length, 2);
  assert.equal(monthly[1].dailyBreakdown[0].date, "2026-11-01");
  assert.equal(monthly[1].dailyBreakdown[0].pages, 30);
});

test("calculateStreak counts consecutive days correctly", () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split("T")[0];

  const sessions = [
    makeSession({ session_date: today }),
    makeSession({ session_date: yesterday }),
    makeSession({ session_date: twoDaysAgo }),
  ];

  assert.equal(calculateStreak(sessions), 3);
});

test("calculateStreak breaks on gap", () => {
  const today = new Date().toISOString().split("T")[0];
  const threeDaysAgo = new Date(Date.now() - 259200000).toISOString().split("T")[0];

  const sessions = [
    makeSession({ session_date: today }),
    makeSession({ session_date: threeDaysAgo }),
  ];

  assert.equal(calculateStreak(sessions), 1);
});

test("calculateStreak returns 0 for empty sessions", () => {
  assert.equal(calculateStreak([]), 0);
});

test("getReadingPaceTrend detects improving trend", () => {
  const sessions = [
    makeSession({ session_date: "2026-11-01", speed_pages_per_hour: 20 }),
    makeSession({ session_date: "2026-11-02", speed_pages_per_hour: 20 }),
    makeSession({ session_date: "2026-11-03", speed_pages_per_hour: 40 }),
    makeSession({ session_date: "2026-11-04", speed_pages_per_hour: 40 }),
  ];

  assert.equal(getReadingPaceTrend(sessions), "improving");
});

test("getReadingPaceTrend returns stable for insufficient data", () => {
  const sessions = [
    makeSession({ session_date: "2026-11-01", speed_pages_per_hour: 30 }),
    makeSession({ session_date: "2026-11-02", speed_pages_per_hour: 30 }),
  ];

  assert.equal(getReadingPaceTrend(sessions), "stable");
});
