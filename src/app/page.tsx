"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Clock, Timer, BarChart3 } from "lucide-react";
import Link from "next/link";
import type { Book, ReadingSession } from "../types/database";
import { LocalBookRepository } from "../lib/storage/book-repository";
import { calculateRollingSpeed, calculateRemainingHours, formatDuration } from "../lib/analytics/calculator";
import { BookCard } from "../components/BookCard";
import { SessionTimerModal } from "../components/SessionTimerModal";
import { AddBookModal } from "../components/AddBookModal";
import { ImportEpubModal } from "../components/modals/ImportEpubModal";
import { EpubReader } from "../components/reader/EpubReader";
import { hasEpubFile } from "../lib/storage/epub-storage";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "reading", label: "Sedang dibaca" },
  { value: "completed", label: "Tamat" },
  { value: "on_hold", label: "On Hold" },
  { value: "plan_to_read", label: "Rencana" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

export default function HomePage() {
  const repo = useMemo(() => new LocalBookRepository(), []);
  const [books, setBooks] = useState<Book[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [readingEpubBookId, setReadingEpubBookId] = useState<string | null>(null);
  const [epubAvailability, setEpubAvailability] = useState<Record<string, boolean>>({});

  // Load initial data on mount
  useEffect(() => {
    const loadedBooks = repo.getBooks();
    setBooks(loadedBooks);
    setSessions(repo.getSessions());

    // Check which books have local EPUB attached in IndexedDB
    async function checkEpubs() {
      const avail: Record<string, boolean> = {};
      for (const b of loadedBooks) {
        avail[b.id] = await hasEpubFile(b.id);
      }
      setEpubAvailability(avail);
    }
    checkEpubs();
  }, [repo]);

  const handleAddBook = (data: {
    title: string;
    volume: string | null;
    author: string | null;
    category: Book["category"];
    total_pages: number;
    current_page: number;
  }) => {
    repo.saveBook({
      ...data,
      status: "reading",
      rating: null,
      notes: null,
      cover_url: null,
      started_at: null,
      completed_at: null,
    });
    setBooks(repo.getBooks());
    setSessions(repo.getSessions());
  };

  const handleFinishSession = (endPage: number, durationMinutes: number) => {
    if (!activeBook) return;
    repo.recordSession(activeBook.id, endPage, durationMinutes);
    setBooks(repo.getBooks());
    setSessions(repo.getSessions());
    setActiveBook(null);
  };

  // Compute per-book analytics using reading session history
  const bookAnalytics = useMemo(() => {
    const map = new Map<string, { remaining: string | null; speed: number | null }>();
    for (const book of books) {
      const bookSessions = sessions.filter((s) => s.book_id === book.id);
      const speed = calculateRollingSpeed(
        bookSessions.map((s) => ({ pagesRead: s.pages_read, durationMinutes: s.duration_minutes }))
      );
      const remainingHours =
        book.status === "completed"
          ? null
          : calculateRemainingHours(book.current_page, book.total_pages, speed);
      map.set(book.id, {
        remaining: remainingHours !== null && remainingHours > 0 ? formatDuration(remainingHours) : null,
        speed: bookSessions.length > 0 ? speed : null,
      });
    }
    return map;
  }, [books, sessions]);

  // Global stats for the summary header
  const globalStats = useMemo(() => {
    const readingBooks = books.filter((b) => b.status === "reading").length;
    const completedBooks = books.filter((b) => b.status === "completed").length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    return { readingBooks, completedBooks, totalMinutes };
  }, [books, sessions]);

  const filteredBooks = filter === "all" ? books : books.filter((b) => b.status === filter);

  return (
    <main className="min-h-screen px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#29241d] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-editorial font-bold italic tracking-wide text-amber-100">AstRead</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-400">
                Journal
              </span>
            </div>
            <p className="text-xs text-amber-200/60 font-sans">Personal Novel & Light-Novel Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/stats"
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-[#171512] border border-[#29241d] text-amber-200/70 hover:text-amber-100 hover:border-amber-800/50 transition-colors"
            aria-label="Statistik"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setShowImportModal(true)}
            className="h-11 flex items-center gap-2 px-3 sm:px-4 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-300 text-xs sm:text-sm font-semibold hover:bg-amber-900/40 transition-colors shadow-sm"
            title="Import EPUB dari HP"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Import EPUB</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 flex items-center gap-2 px-4 rounded-xl bg-amber-700 text-amber-50 text-xs sm:text-sm font-semibold hover:bg-amber-600 active:bg-amber-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </header>

      {/* Literary Atmosphere Quote / Header Accent */}
      <div className="mt-4 border-l-2 border-amber-600/60 pl-3.5 py-1">
        <p className="font-editorial italic text-xs sm:text-sm text-amber-200/80 leading-relaxed">
          &ldquo;Membaca bukan tentang perlombaan halaman, melainkan waktu yang kau habiskan bersamanya.&rdquo;
        </p>
      </div>

      {/* Stats summary */}
      <section className="grid grid-cols-3 gap-3 my-5">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171512] border border-[#29241d]">
          <p className="text-xl sm:text-2xl font-bold text-amber-100 font-mono tabular-nums">
            {globalStats.readingBooks}
          </p>
          <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400/60 mt-1">Kini Dibaca</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171512] border border-[#29241d]">
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {globalStats.completedBooks}
          </p>
          <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400/60 mt-1">Tamat</p>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#171512] border border-[#29241d]">
          <p className="text-xl sm:text-2xl font-bold text-amber-300 font-mono tabular-nums">
            {formatDuration(globalStats.totalMinutes / 60)}
          </p>
          <p className="text-[10px] uppercase font-mono tracking-wider text-amber-400/60 mt-1">Total Waktu</p>
        </div>
      </section>

      {/* Filter tabs */}
      <nav className="flex gap-2 mb-5 overflow-x-auto" aria-label="Filter status buku">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`h-9 shrink-0 px-4 rounded-full text-xs font-medium font-mono transition-colors ${
              filter === f.value
                ? "bg-amber-700 text-amber-50 shadow-sm"
                : "bg-[#171512] text-amber-200/60 border border-[#29241d] hover:text-amber-100 hover:border-amber-900/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {/* Book list */}
      {filteredBooks.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-[#29241d]">
          <Timer className="w-10 h-10 text-amber-900/60 mx-auto mb-3" />
          <p className="text-sm font-editorial italic text-amber-200/70">
            {filter === "all"
              ? "Rak bukumu masih kosong. Tambahkan buku pertamamu atau import file EPUB."
              : "Tidak ada buku pada kategori ini."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="h-11 inline-flex items-center gap-2 px-5 rounded-xl bg-amber-950/60 border border-amber-800/50 text-amber-300 text-sm font-semibold hover:bg-amber-900/40 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Import EPUB
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-11 inline-flex items-center gap-2 px-5 rounded-xl bg-amber-700 text-amber-50 text-sm font-semibold hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Manual
            </button>
          </div>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {filteredBooks.map((book) => {
            const analytics = bookAnalytics.get(book.id);
            return (
              <BookCard
                key={book.id}
                book={book}
                estimatedRemaining={analytics?.remaining ?? null}
                rollingSpeed={analytics?.speed ?? null}
                onStartSession={setActiveBook}
                hasEpub={Boolean(epubAvailability[book.id])}
                onReadEpub={(id) => setReadingEpubBookId(id)}
              />
            );
          })}
        </section>
      )}

      {/* Active reading indicator */}
      {activeBook && (
        <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-700 text-amber-50 text-xs font-medium shadow-lg z-30">
          <Clock className="w-4 h-4 animate-pulse" />
          Sesi baca aktif: {activeBook.title}
        </div>
      )}

      <SessionTimerModal
        open={activeBook !== null}
        bookTitle={activeBook?.title ?? ""}
        volume={activeBook?.volume ?? null}
        startPage={activeBook?.current_page ?? 0}
        totalPages={activeBook?.total_pages ?? 0}
        onClose={() => setActiveBook(null)}
        onFinish={handleFinishSession}
      />

      <AddBookModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddBook}
      />

      <ImportEpubModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        repo={repo}
        onImportSuccess={async (newBookId) => {
          setBooks(repo.getBooks());
          setEpubAvailability((prev) => ({ ...prev, [newBookId]: true }));
          setReadingEpubBookId(newBookId);
        }}
      />

      {readingEpubBookId && (
        <EpubReader
          bookId={readingEpubBookId}
          repo={repo}
          onClose={async () => {
            setReadingEpubBookId(null);
            const updated = repo.getBooks();
            setBooks(updated);
            setSessions(repo.getSessions());
            // Refresh epub availability map
            const avail: Record<string, boolean> = {};
            for (const b of updated) {
              avail[b.id] = await hasEpubFile(b.id);
            }
            setEpubAvailability(avail);
          }}
        />
      )}

      <footer className="pt-8 border-t border-[#29241d] text-center text-[10px] font-mono text-amber-500/50">
        AstRead by Pylexia • Editorial Reading Journal
      </footer>
    </main>
  );
}
