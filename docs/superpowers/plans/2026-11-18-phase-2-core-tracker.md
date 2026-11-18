# Phase 2: Core Tracker & Reading Session Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul manajemen buku (tambah, edit, list, filter kategori) dan kalkulasi analitik kecepatan baca dinamis (session timer, rolling average pages/hour, estimasi tamat buku) lengkap dengan unit tests.

**Architecture:** 
- Pure business logic layer di `src/lib/analytics/` (kalkulasi reading speed, remaining time, rolling stats) diisolasi tanpa dependensi UI agar 100% testable via Node test runner.
- Data storage layer di `src/lib/storage/` (offline-first in-memory/localStorage dengan adapter interface yang dapat disinkronkan ke Supabase).
- UI component layer: `BookCard`, `SessionTimerModal`, `AddBookModal`, dan dashboard view.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Node.js built-in test runner (`node:test`).

**Spec:** `/root/projects/AstRead/ARCHITECTURE.md`

## Global Constraints
- Framework: Next.js 16 App Router dengan React 19 & TypeScript strict mode.
- Test runner: Zero external deps, menggunakan Node 22 built-in `node:test` + `node:assert/strict` via `npm test`.
- Visual styling: Clean dark mode neobrutalism, warna primer `#090a0f`, surface `#12141f`, border `#1e2235`, accent `#6366f1`.
- Mobile safety: Tap targets minimal 44px, safe area insets untuk viewport mobile.

## Review Focus
1. Sesi baca dengan durasi 0 menit atau pergantian halaman 0 (tidak boleh menghasilkan `Infinity` atau `NaN` pada pages/hour).
2. Perhitungan sisa waktu saat progress halaman sudah mencapai atau melebihi total halaman (harus 0 menit, bukan negatif).
3. Rolling average kecepatan baca saat belum ada riwayat sesi baca (harus fallback ke default benchmark 30 lembar/jam, bukan crash).
4. Sesi baca lintas hari/jam tidak boleh menghasilkan durasi negatif.
5. Pembaruan progress buku otomatis mengubah status buku ke `completed` saat `current_page === total_pages`.

---

### Task 1: Reading Analytics & Speed Engine

**Files:**
- Create: `src/lib/analytics/calculator.ts`
- Test: `tests/analytics.test.ts`

**Interfaces:**
- Produces:
  - `calculateSessionSpeed(pagesRead: number, durationMinutes: number): number`
  - `calculateRemainingHours(currentPage: number, totalPages: number, speedPagesPerHour: number): number`
  - `calculateRollingSpeed(sessions: Array<{ pagesRead: number; durationMinutes: number }>, fallbackSpeed?: number): number`
  - `formatDuration(hours: number): string`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement analytics functions in `src/lib/analytics/calculator.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 2: Local & Offline-First Book Repository

**Files:**
- Create: `src/lib/storage/book-repository.ts`
- Test: `tests/book-repository.test.ts`

**Interfaces:**
- Produces:
  - `BookRepository` interface dan class `LocalBookRepository` dengan method:
    - `getBooks(): Book[]`
    - `getBookById(id: string): Book | undefined`
    - `saveBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Book`
    - `updateProgress(id: string, newPage: number): Book`
    - `recordSession(bookId: string, pagesRead: number, durationMinutes: number, notes?: string): ReadingSession`
    - `getSessions(bookId?: string): ReadingSession[]`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `LocalBookRepository`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 3: Interactive Tracker UI & Active Session Timer

**Files:**
- Create: `src/components/BookCard.tsx`
- Create: `src/components/SessionTimerModal.tsx`
- Create: `src/components/AddBookModal.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `LocalBookRepository`, `calculateRollingSpeed`, `calculateRemainingHours`, `formatDuration`
- Produces: Full working UI dashboard with active reading timer and progress tracker.

- [ ] **Step 1: Create UI components with accessible interactive controls**
- [ ] **Step 2: Wire components to `src/app/page.tsx`**
- [ ] **Step 3: Build & verify static export**
- [ ] **Step 4: Commit**
