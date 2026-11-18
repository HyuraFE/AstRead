"use client";

import { Play, CheckCircle2, BookOpen } from "lucide-react";
import type { Book } from "../types/database";

interface BookCardProps {
  book: Book;
  estimatedRemaining: string | null;
  rollingSpeed: number | null;
  onStartSession: (book: Book) => void;
}

const STATUS_CONFIG: Record<Book["status"], { label: string; className: string }> = {
  reading: { label: "Sedang dibaca", className: "text-indigo-300 bg-indigo-950/60 border-indigo-800/60" },
  completed: { label: "Tamat", className: "text-emerald-300 bg-emerald-950/60 border-emerald-800/60" },
  on_hold: { label: "On Hold", className: "text-amber-300 bg-amber-950/60 border-amber-800/60" },
  plan_to_read: { label: "Direncanakan", className: "text-slate-300 bg-slate-800/60 border-slate-700/60" },
};

export function BookCard({ book, estimatedRemaining, rollingSpeed, onStartSession }: BookCardProps) {
  const progress = book.total_pages > 0 ? (book.current_page / book.total_pages) * 100 : 0;
  const status = STATUS_CONFIG[book.status];
  const isCompleted = book.status === "completed";

  return (
    <article className="p-5 rounded-xl bg-[#12141f] border border-[#1e2235] hover:border-[#2a3050] transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm leading-tight truncate">{book.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {book.volume ? `${book.volume} • ` : ""}
            {book.author || "Unknown author"}
          </p>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 text-[10px] font-medium rounded-full border ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div
          className="h-2 w-full rounded-full bg-[#090a0f] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progres ${book.title}`}
        >
          <div
            className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <span className="text-slate-400 font-mono tabular-nums">
            {book.current_page} / {book.total_pages} hlm
          </span>
          <span className="text-slate-500 font-mono tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Speed & estimation info */}
      <div className="flex flex-wrap gap-2 mb-4">
        {rollingSpeed !== null && rollingSpeed > 0 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-md bg-[#090a0f] border border-[#1e2235] text-cyan-300 font-mono">
            <BookOpen className="w-3 h-3" aria-hidden="true" />
            {rollingSpeed} hlm/jam
          </span>
        )}
        {estimatedRemaining && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-md bg-[#090a0f] border border-[#1e2235] text-slate-300 font-mono">
            Sisa: {estimatedRemaining}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isCompleted ? (
          <div className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Tamat • {book.rating ? `${"★".repeat(book.rating)}` : "Belum dinilai"}
          </div>
        ) : (
          <button
            onClick={() => onStartSession(book)}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Mulai Sesi Baca
          </button>
        )}
      </div>
    </article>
  );
}
