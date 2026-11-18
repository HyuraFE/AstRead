"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Flame, TrendingUp, TrendingDown, Minus, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Book, ReadingSession } from "../../types/database";
import { LocalBookRepository } from "../../lib/storage/book-repository";
import { aggregateWeeklyStats, aggregateMonthlyStats, calculateStreak, getReadingPaceTrend } from "../../lib/analytics/aggregator";
import { calculateRollingSpeed, calculateRemainingHours } from "../../lib/analytics/calculator";
import { WeeklyBarChart } from "../../components/charts/WeeklyBarChart";
import { MonthlyHeatmap } from "../../components/charts/MonthlyHeatmap";
import { ShareableBentoCard } from "../../components/cards/ShareableBentoCard";

export default function StatsPage() {
  const repo = useMemo(() => new LocalBookRepository(), []);
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);

  useEffect(() => {
    setBooks(repo.getBooks());
    setSessions(repo.getSessions());
  }, [repo]);

  const weeklyStats = useMemo(() => aggregateWeeklyStats(sessions), [sessions]);
  const monthlyStats = useMemo(() => aggregateMonthlyStats(sessions), [sessions]);
  const streak = useMemo(() => calculateStreak(sessions), [sessions]);
  const paceTrend = useMemo(() => getReadingPaceTrend(sessions), [sessions]);

  const activeBook = useMemo(() => {
    return books.find((b) => b.status === "reading") || books[0];
  }, [books]);

  const activeBookStats = useMemo(() => {
    if (!activeBook) return null;
    const bookSessions = sessions.filter((s) => s.book_id === activeBook.id);
    const speed = calculateRollingSpeed(
      bookSessions.map((s) => ({ pagesRead: s.pages_read, durationMinutes: s.duration_minutes }))
    );
    const remainingHours = calculateRemainingHours(activeBook.current_page, activeBook.total_pages, speed);
    return {
      pagesRead: activeBook.current_page,
      durationMinutes: bookSessions.reduce((sum, s) => sum + s.duration_minutes, 0),
      currentSpeedPerHour: speed,
      rollingAvgSpeedPerHour: speed,
      remainingPages: activeBook.total_pages - activeBook.current_page,
      estimatedRemainingHours: remainingHours,
      projectedFinishDate: null,
    };
  }, [activeBook, sessions]);

  const TrendIcon = paceTrend === "improving" ? TrendingUp : paceTrend === "declining" ? TrendingDown : Minus;
  const trendColor = paceTrend === "improving" ? "text-emerald-400" : paceTrend === "declining" ? "text-red-400" : "text-slate-400";

  return (
    <main className="min-h-screen px-4 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#1e2235] pb-5">
        <Link
          href="/"
          className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Kembali ke dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Statistik & Analitik</h1>
          <p className="text-xs text-slate-400">Riwayat membaca dan performa</p>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-4 rounded-xl bg-[#12141f] border border-[#1e2235]">
          <Flame className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white font-mono tabular-nums">{streak}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Hari streak</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12141f] border border-[#1e2235]">
          <TrendIcon className={`w-5 h-5 ${trendColor} mb-2`} />
          <p className="text-2xl font-bold text-white font-mono tabular-nums capitalize">{paceTrend}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Tren kecepatan</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12141f] border border-[#1e2235]">
          <BookOpen className="w-5 h-5 text-indigo-400 mb-2" />
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {sessions.reduce((sum, s) => sum + s.pages_read, 0)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Total halaman</p>
        </div>
        <div className="p-4 rounded-xl bg-[#12141f] border border-[#1e2235]">
          <p className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
            {sessions.length}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Total sesi</p>
        </div>
      </section>

      {/* Weekly Chart */}
      <section className="mb-6 p-5 rounded-xl bg-[#12141f] border border-[#1e2235]">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Halaman per Minggu</h2>
        <WeeklyBarChart data={weeklyStats} />
      </section>

      {/* Monthly Heatmap */}
      <section className="mb-6 p-5 rounded-xl bg-[#12141f] border border-[#1e2235]">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Aktivitas Bulanan</h2>
        <MonthlyHeatmap data={monthlyStats} />
      </section>

      {/* Bento Share Card */}
      {activeBook && activeBookStats && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Bagikan Progres</h2>
          <ShareableBentoCard book={activeBook} stats={activeBookStats} streak={streak} />
        </section>
      )}

      <footer className="pt-8 border-t border-[#1e2235] text-center text-[10px] text-slate-600">
        AstRead by Pylexia • Phase 3 Analytics
      </footer>
    </main>
  );
}
