# Phase 3: Bento Share Card & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul visualisasi analitik (chart riwayat membaca mingguan/bulanan) dan komponen Bento Share Card dengan fitur *Save as Image* untuk di-share ke sosial media.

**Architecture:**
- Pure SVG chart components (zero external chart lib) di `src/components/charts/` — WeeklyBarChart, MonthlyHeatmap.
- Bento Share Card di `src/components/cards/ShareableBentoCard.tsx` — HTML/CSS render dengan export ke PNG via `html-to-image` atau native Canvas API.
- Analytics aggregation logic di `src/lib/analytics/aggregator.ts` — pure functions untuk weekly/monthly stats, streak calculation, dan reading pace trends.
- Capacitor native plugins: `@capacitor/preferences` untuk persistensi lokal, `@capacitor/haptics` untuk feedback timer, `@capacitor/status-bar` untuk theming.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, `html-to-image` (lightweight PNG export), Node.js built-in test runner (`node:test` via `tsx`).

**Spec:** `/root/projects/AstRead/ARCHITECTURE.md`

## Global Constraints
- Zero external chart library — semua chart dibuat dengan SVG inline + Tailwind styling.
- Bento Card harus bisa di-export sebagai PNG tanpa server-side rendering.
- Semua komponen visual harus accessible (aria-labels, keyboard navigable, contrast ratio ≥ 4.5:1).
- Mobile-first responsive: chart dan card harus readable di viewport 360px.
- Capacitor plugins harus lazy-loaded dan graceful fallback di web environment.

## Review Focus
1. Chart dengan data kosong (0 sesi) harus menampilkan empty state yang informatif, bukan crash.
2. Bento Card export harus handle font loading dan image CORS dengan benar.
3. Streak calculation harus handle timezone edge cases (midnight crossing).
4. Weekly aggregation harus benar untuk minggu yang belum lengkap (Senin-Minggu).
5. Capacitor plugin calls harus di-guard dengan `Capacitor.isNativePlatform()`.

---

### Task 1: Analytics Aggregator & Streak Engine

**Files:**
- Create: `src/lib/analytics/aggregator.ts`
- Test: `tests/aggregator.test.ts`

**Interfaces:**
- Produces:
  - `aggregateWeeklyStats(sessions: ReadingSession[]): WeeklyStats[]`
  - `aggregateMonthlyStats(sessions: ReadingSession[]): MonthlyStats[]`
  - `calculateStreak(sessions: ReadingSession[]): number`
  - `getReadingPaceTrend(sessions: ReadingSession[]): 'improving' | 'declining' | 'stable'`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement aggregator functions**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 2: SVG Chart Components

**Files:**
- Create: `src/components/charts/WeeklyBarChart.tsx`
- Create: `src/components/charts/MonthlyHeatmap.tsx`

**Interfaces:**
- Consumes: `WeeklyStats[]`, `MonthlyStats[]` dari aggregator
- Produces: Accessible SVG charts dengan empty states

- [ ] **Step 1: Create WeeklyBarChart with responsive SVG bars**
- [ ] **Step 2: Create MonthlyHeatmap with calendar grid**
- [ ] **Step 3: Add empty states and accessibility attributes**
- [ ] **Step 4: Commit**

---

### Task 3: Bento Share Card & PNG Export

**Files:**
- Create: `src/components/cards/ShareableBentoCard.tsx`
- Create: `src/lib/export/image-exporter.ts`

**Interfaces:**
- Consumes: `Book`, `ReadingStats`, `ReadingSession[]`
- Produces: Visual bento card component + `exportAsPng(element: HTMLElement): Promise<Blob>`

- [ ] **Step 1: Create ShareableBentoCard with book info, progress, stats**
- [ ] **Step 2: Implement image exporter with html-to-image**
- [ ] **Step 3: Add download/share button with loading state**
- [ ] **Step 4: Commit**

---

### Task 4: Capacitor Native Integration

**Files:**
- Create: `src/lib/capacitor/native-bridge.ts`
- Modify: `src/components/SessionTimerModal.tsx` (add haptics)

**Interfaces:**
- Produces:
  - `initNativePlugins(): Promise<void>`
  - `triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): Promise<void>`
  - `setStatusBarTheme(theme: 'dark' | 'light'): Promise<void>`
  - `saveToPreferences(key: string, value: string): Promise<void>`
  - `loadFromPreferences(key: string): Promise<string | null>`

- [ ] **Step 1: Create native bridge with platform guards**
- [ ] **Step 2: Wire haptics to session timer start/stop**
- [ ] **Step 3: Add preferences persistence for offline data**
- [ ] **Step 4: Commit**

---

### Task 5: Dashboard Integration & Analytics View

**Files:**
- Create: `src/app/stats/page.tsx`
- Modify: `src/app/page.tsx` (add stats link, bento card preview)

**Interfaces:**
- Consumes: All aggregator functions, chart components, bento card
- Produces: Full analytics dashboard page with charts and shareable card

- [ ] **Step 1: Create /stats route with weekly/monthly charts**
- [ ] **Step 2: Add bento card preview section**
- [ ] **Step 3: Wire navigation between dashboard and stats**
- [ ] **Step 4: Build & verify static export**
- [ ] **Step 5: Commit**
