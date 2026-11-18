"use client";

import { useState } from "react";
import { X, BookOpen } from "lucide-react";
import type { BookCategory } from "../types/database";

interface AddBookModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (book: {
    title: string;
    volume: string | null;
    author: string | null;
    category: BookCategory;
    total_pages: number;
    current_page: number;
  }) => void;
}

const CATEGORIES: { value: BookCategory; label: string }[] = [
  { value: "light_novel", label: "Light Novel" },
  { value: "novel", label: "Novel" },
  { value: "manga", label: "Manga" },
  { value: "non_fiction", label: "Non-Fiction" },
  { value: "academic", label: "Akademik" },
];

export function AddBookModal({ open, onClose, onAdd }: AddBookModalProps) {
  const [title, setTitle] = useState("");
  const [volume, setVolume] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<BookCategory>("light_novel");
  const [totalPages, setTotalPages] = useState("");
  const [currentPage, setCurrentPage] = useState("0");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tp = Number(totalPages);
    const cp = Number(currentPage || "0");

    if (!title.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    if (isNaN(tp) || tp <= 0) {
      setError("Total halaman harus angka positif");
      return;
    }
    if (isNaN(cp) || cp < 0 || cp > tp) {
      setError(`Halaman sekarang harus 0 sampai ${tp}`);
      return;
    }

    onAdd({
      title: title.trim(),
      volume: volume.trim() || null,
      author: author.trim() || null,
      category,
      total_pages: tp,
      current_page: cp,
    });
    setTitle("");
    setVolume("");
    setAuthor("");
    setCategory("light_novel");
    setTotalPages("");
    setCurrentPage("0");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tambah buku baru"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-[#12141f] border border-[#1e2235] rounded-t-2xl sm:rounded-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Tambah Buku
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="title">
          Judul <span className="text-indigo-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Misal: Otonari no Tenshi-sama"
          className="w-full h-11 px-4 mb-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white focus:outline-none focus:border-indigo-500"
        />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="volume">
              Volume
            </label>
            <input
              id="volume"
              type="text"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="Volume 1"
              className="w-full h-11 px-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="author">
              Author
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Saekisan"
              className="w-full h-11 px-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="category">
          Kategori
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as BookCategory)}
          className="w-full h-11 px-4 mb-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white focus:outline-none focus:border-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="total-pages">
              Total Halaman <span className="text-indigo-400">*</span>
            </label>
            <input
              id="total-pages"
              type="number"
              inputMode="numeric"
              min={1}
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="345"
              className="w-full h-11 px-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2" htmlFor="current-page">
              Halaman Sekarang
            </label>
            <input
              id="current-page"
              type="number"
              inputMode="numeric"
              min={0}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-[#090a0f] border border-[#1e2235] text-white font-mono tabular-nums focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-4" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full h-12 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
        >
          Simpan Buku
        </button>
      </form>
    </div>
  );
}
