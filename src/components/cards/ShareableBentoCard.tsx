"use client";

import { useRef, useState } from "react";
import { Download, Share2, Loader2, BookOpen, Clock, TrendingUp, Flame } from "lucide-react";
import type { Book } from "../../types/database";
import type { ReadingStats } from "../../types/database";
import { formatDuration } from "../../lib/analytics/calculator";
import { exportAsPng, shareOrDownload } from "../../lib/export/image-exporter";

interface ShareableBentoCardProps {
  book: Book;
  stats: ReadingStats;
  streak: number;
}

export function ShareableBentoCard({ book, stats, streak }: ShareableBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
  const isCompleted = book.status === "completed";

  const handleExport = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const blob = await exportAsPng(cardRef.current);
      const filename = `astread-${book.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.png`;
      await shareOrDownload(blob, filename, `Progres baca: ${book.title}`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bento Card Preview */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f111a] to-[#1a1d2e] border border-[#2a3050] p-6"
        style={{ width: "100%", maxWidth: 480, margin: "0 auto" }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-600/10 rounded-full blur-2xl" />

        {/* Header */}
        <div className="relative flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">{book.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {book.volume ? `${book.volume} • ` : ""}
                {book.author || "Unknown"}
              </p>
            </div>
          </div>
          {isCompleted && (
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
              Tamat
            </span>
          )}
        </div>

        {/* Progress Ring */}
        <div className="relative flex items-center justify-center py-6">
          <svg width={140} height={140} viewBox="0 0 140 140" className="transform -rotate-90">
            <circle
              cx={70}
              cy={70}
              r={60}
              fill="none"
              stroke="#1e2235"
              strokeWidth={8}
            />
            <circle
              cx={70}
              cy={70}
              r={60}
              fill="none"
              stroke={isCompleted ? "#10b981" : "#6366f1"}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white font-mono tabular-nums">
              {Math.round(progress)}%
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {book.current_page} / {book.total_pages} hlm
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="relative grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[#090a0f]/60 border border-[#1e2235] text-center">
            <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-white font-mono tabular-nums">
              {formatDuration(stats.estimatedRemainingHours)}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Sisa waktu</p>
          </div>
          <div className="p-3 rounded-xl bg-[#090a0f]/60 border border-[#1e2235] text-center">
            <TrendingUp className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-white font-mono tabular-nums">
              {stats.rollingAvgSpeedPerHour}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Hlm/jam</p>
          </div>
          <div className="p-3 rounded-xl bg-[#090a0f]/60 border border-[#1e2235] text-center">
            <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-white font-mono tabular-nums">
              {streak}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-0.5">Hari streak</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-5 pt-4 border-t border-[#1e2235] text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            AstRead • Personal Book Tracker
          </p>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Mengekspor...
          </>
        ) : (
          <>
            {typeof navigator !== "undefined" && "share" in navigator ? (
              <Share2 className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {typeof navigator !== "undefined" && "share" in navigator
              ? "Bagikan Kartu"
              : "Simpan sebagai PNG"}
          </>
        )}
      </button>
    </div>
  );
}
