import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSessionSpeed,
  calculateRemainingHours,
  calculateRollingSpeed,
  formatDuration,
} from "../src/lib/analytics/calculator";

test("calculateSessionSpeed calculates pages per hour correctly", () => {
  // 30 pages in 60 minutes = 30 pages/hour
  assert.equal(calculateSessionSpeed(30, 60), 30);
  // 15 pages in 30 minutes = 30 pages/hour
  assert.equal(calculateSessionSpeed(15, 30), 30);
  // 10 pages in 15 minutes = 40 pages/hour
  assert.equal(calculateSessionSpeed(10, 15), 40);
});

test("calculateSessionSpeed guards against zero or negative duration", () => {
  assert.equal(calculateSessionSpeed(10, 0), 0);
  assert.equal(calculateSessionSpeed(10, -5), 0);
  assert.equal(calculateSessionSpeed(0, 30), 0);
});

test("calculateRemainingHours computes remaining time properly", () => {
  // 100 pages left at 50 pages/hr = 2 hours
  assert.equal(calculateRemainingHours(100, 200, 50), 2);
  // 0 pages left = 0 hours
  assert.equal(calculateRemainingHours(200, 200, 50), 0);
  // Already past total pages = 0 hours
  assert.equal(calculateRemainingHours(250, 200, 50), 0);
});

test("calculateRemainingHours handles zero or negative speed gracefully", () => {
  // Fallback to default or 0 instead of Infinity
  assert.equal(calculateRemainingHours(50, 200, 0), 0);
  assert.equal(calculateRemainingHours(50, 200, -10), 0);
});

test("calculateRollingSpeed calculates weighted average of sessions", () => {
  const sessions = [
    { pagesRead: 20, durationMinutes: 30 }, // 40 pph
    { pagesRead: 30, durationMinutes: 60 }, // 30 pph
  ];
  // Total 50 pages in 90 minutes = (50 / 1.5) = 33.33 pages/hr
  const speed = calculateRollingSpeed(sessions);
  assert.equal(Math.round(speed * 100) / 100, 33.33);
});

test("calculateRollingSpeed uses fallback when sessions empty", () => {
  assert.equal(calculateRollingSpeed([]), 30);
  assert.equal(calculateRollingSpeed([], 45), 45);
});

test("formatDuration formats hours and minutes cleanly", () => {
  assert.equal(formatDuration(0), "0m");
  assert.equal(formatDuration(0.5), "30m");
  assert.equal(formatDuration(1.25), "1j 15m");
  assert.equal(formatDuration(2), "2j");
});
