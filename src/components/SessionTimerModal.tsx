"use client";

import { useEffect, useState } from "react";
import { X, Play, Square } from "lucide-react";

interface SessionTimerModalProps {
  open: boolean;
  bookTitle: string;
  volume: string | null;
  startPage: number;
  totalPages: number;
  onClose: () => void;
  onFinish: (endPage: number, durationMinutes: number) => void;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function SessionTimerModal({
  open,
  bookTitle,
  volume,
  startPage,
  totalPages,
  onClose,
  onFinish,
}: SessionTimerModalProps) {
  const [endPage, setEndPage] = useState(startPage);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEndPage(startPage);
      setElapsedSeconds(0);
      setRunning(true);
      setError(null);
    }
  }, [open, startPage]);

  useEffect(() => {
    if (!running || !open) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running, open]);

  if (!open) return null;

  const handleFinish = () => {
    const page = Number(endPage);
    if (isNaN(page) || page < startPage || page > totalPages) {
      setError(`Halaman harus antara ${startPage} dan ${totalPages}`);
      return;
    }
    const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    onFinish(page, durationMinutes);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Timer sesi baca ${bookTitle}`}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full sm:max-w-md bg-[#12141f] border border-[#1e2235] rounded-t-2xl sm:rounded-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{bookTitle}</h2>
            {volume && <p className="text-xs text-slate-400 mt-0.5">{volume}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center py-6 rounded-xl bg-[#090a0f] border border-[#1e2235] mb-5">
          <p className="text-4xl font-mono font-bold text-white tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </p>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">
            {running ? "Sedang membaca" : "Timer dijeda"}
          </p>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setRunning(!running)}
            className="h-11 flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#1e2235] text-slate-200 font-medium hover:bg-[#252a42] transition-colors"
          >
            {running ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? "Jeda" : "Lanjut"}
          </button>
        </div>

        <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="end-page">
          Halaman selesai ({startPage} → {totalPages})
        </label>
        <input
          id="end-page"
          type="number"
          inputMode="numeric"
          min={startPage}
          max={totalPages}
          value={endPage}
          onChange={(e) => setEndPage(Number(e.target.value))}
          className="w-full h-11 px-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white text-lg font-mono tabular-nums focus:outline-none focus:border-indigo-500 focus-visible:border-indigo-500"
        />
        {error && (
          <p className="text-xs text-red-400 mt-2" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleFinish}
          className="w-full h-12 mt-5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
        >
          Selesai & Simpan Sesi
        </button>
      </div>
    </div>
  );
}
