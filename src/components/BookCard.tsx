"use client";

import { Play, CheckCircle2, BookOpen } from "lucide-react";
import type { Book } from "../types/database";

interface BookCardProps {
  book: Book;
  estimatedRemaining: string | null;
  rollingSpeed: number | null;
  onStartSession: (book: Book) => void;
  hasEpub?: boolean;
  onReadEpub?: (bookId: string) => void;
}

const STATUS_CONFIG: Record<Book["status"], { label: string; className: string }> = {
  reading: { label: "Kini Dibaca", className: "text-amber-300 bg-amber-950/60 border-amber-800/60" },
  completed: { label: "Tamat", className: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60" },
  on_hold: { label: "Ditunda", className: "text-stone-400 bg-stone-900/60 border-stone-800/60" },
  plan_to_read: { label: "Rencana", className: "text-stone-300 bg-stone-900/60 border-stone-800/60" },
};

export function BookCard({
  book,
  estimatedRemaining,
  rollingSpeed,
  onStartSession,
  hasEpub,
  onReadEpub,
}: BookCardProps) {
  const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
  const status = STATUS_CONFIG[book.status];
  const isCompleted = book.status === "completed";

  return (
    <article className="p-4 sm:p-5 rounded-2xl bg-[#171512] border border-[#29241d] hover:border-amber-900/50 transition-colors flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-editorial text-base sm:text-lg font-bold text-amber-100 leading-snug truncate">
              {book.title}
            </h3>
            <p className="text-xs text-amber-200/60 mt-0.5 font-sans">
              {book.volume ? `${book.volume} • ` : ""}
              {book.author || "Penulis tidak diketahui"}
            </p>
          </div>
          <span
            className={`shrink-0 px-2.5 py-0.5 text-[10px] font-mono rounded-full border ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div
            className="h-1.5 w-full rounded-full bg-[#241e17] overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progres ${book.title}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? "bg-emerald-500" : "bg-amber-600"}`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs font-mono">
            <span className="text-amber-200/60 tabular-nums">
              {book.current_page} / {book.total_pages} hlm
            </span>
            <span className="text-amber-400 font-semibold tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Speed & estimation info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {rollingSpeed !== null && rollingSpeed > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-md bg-[#241e17] border border-amber-900/30 text-amber-300 font-mono">
              <BookOpen className="w-3 h-3 text-amber-400" aria-hidden="true" />
              {rollingSpeed} hlm/jam
            </span>
          )}
          {estimatedRemaining && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-md bg-[#241e17] border border-amber-900/30 text-amber-200/80 font-mono">
              Sisa: {estimatedRemaining}
            </span>
          )}
          {hasEpub && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 font-mono font-medium">
              EPUB OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-2">
        {hasEpub ? (
          <button
            onClick={() => onReadEpub?.(book.id)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-600 active:bg-amber-800 text-amber-50 text-xs font-semibold transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            {isCompleted ? "Baca Ulang EPUB" : "Lanjut Baca EPUB"}
          </button>
        ) : isCompleted ? (
          <div className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 text-xs font-medium font-mono">
            <CheckCircle2 className="w-4 h-4" />
            Tamat • {book.rating ? `${"★".repeat(book.rating)}` : "Terselesaikan"}
          </div>
        ) : (
          <button
            onClick={() => onStartSession(book)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-amber-700 text-amber-50 text-xs font-semibold hover:bg-amber-600 active:bg-amber-800 transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Mulai Sesi Baca
          </button>
        )}
      </div>
    </article>
  );
}
