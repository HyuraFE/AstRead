# AstRead Phase 1: Foundation & Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyiapkan fondasi project AstRead: inisialisasi Next.js 16 + React 19 + TypeScript + Tailwind CSS v4, konfigurasi Capacitor (`fun.pylexia.astread`), schema SQL Supabase + RLS, TypeScript domain types, Supabase client helper, dan verifikasi build/dev server di port 7755.

**Architecture:** Next.js App Router dengan dukungan static export untuk build Android native via Capacitor, styling Neobrutalism/Clean minimal via Tailwind v4, client Supabase berpagar TypeScript types untuk operasi realtime/auth.

**Tech Stack:** Next.js 16, React 19, TypeScript strict mode, Tailwind CSS v4, Lucide Icons, Capacitor v8 (`@capacitor/core`, `@capacitor/cli`), `@supabase/supabase-js`.

**Spec:** `/root/projects/AstRead/ARCHITECTURE.md`

## Global Constraints

- Dev server preview HARUS di-bind ke `0.0.0.0` port `7755` (`RULES.md`).
- Next.js output konfigurasi kompatibel dengan Capacitor static export (`output: 'export'` atau script build `next build`).
- App ID Capacitor: `fun.pylexia.astread`, App Name: `AstRead`.
- No LaTeX formatting, plain text or Unicode cleanly formatted.

## Review Focus

1. `capacitor.config.ts` menunjuk ke web asset directory yang tepat (`out`).
2. Supabase client menangani gracefully fallback ketika env vars belum di-set pada runtime client-side.
3. Strict typing untuk semua entitas database (`Book`, `ReadingSession`, `BookCategory`, `BookStatus`).
4. RLS script membatasi akses per `auth.uid() = user_id`.
5. `next build` berhasil tanpa error TypeScript atau linting.

---

### Task 1: Initialize Next.js Project & Dependencies

**Files:**
- Create: `/root/projects/AstRead/package.json`
- Create: `/root/projects/AstRead/tsconfig.json`
- Create: `/root/projects/AstRead/next.config.ts`
- Create: `/root/projects/AstRead/postcss.config.mjs`

- [ ] **Step 1: Inisialisasi package.json dan pasang dependencies**
- [ ] **Step 2: Konfigurasi tsconfig.json dengan path alias `@/*`**
- [ ] **Step 3: Konfigurasi next.config.ts untuk static export Capacitor**
- [ ] **Step 4: Konfigurasi postcss.config.mjs untuk Tailwind CSS v4**

---

### Task 2: Configure Tailwind CSS v4 & Base Layout

**Files:**
- Create: `/root/projects/AstRead/src/app/globals.css`
- Create: `/root/projects/AstRead/src/app/layout.tsx`
- Create: `/root/projects/AstRead/src/app/page.tsx`

- [ ] **Step 1: Setup globals.css dengan `@import "tailwindcss";` dan variable styling**
- [ ] **Step 2: Setup root layout dengan font metadata dan viewport mobile-friendly**
- [ ] **Step 3: Setup placeholder page.tsx untuk verifikasi tampilan Phase 1**

---

### Task 3: Setup Capacitor Configuration

**Files:**
- Create: `/root/projects/AstRead/capacitor.config.ts`

- [ ] **Step 1: Konfigurasi Capacitor dengan appId `fun.pylexia.astread` dan webDir `out`**
- [ ] **Step 2: Update package.json scripts untuk `cap sync` dan `cap open`**

---

### Task 4: Setup Database Schema & TypeScript Domain Models

**Files:**
- Create: `/root/projects/AstRead/supabase/schema.sql`
- Create: `/root/projects/AstRead/src/types/database.ts`
- Create: `/root/projects/AstRead/src/lib/supabase/client.ts`
- Create: `/root/projects/AstRead/.env.example`
- Create: `/root/projects/AstRead/.env.local`

- [ ] **Step 1: Tulis migration SQL lengkap untuk tabel `books` & `reading_sessions` beserta RLS policies**
- [ ] **Step 2: Tulis domain TypeScript types matching database schema**
- [ ] **Step 3: Tulis singleton Supabase client helper**
- [ ] **Step 4: Siapkan environment template**

---

### Task 5: Build Verification & Healthcheck

- [ ] **Step 1: Jalankan `npm run build` untuk memverifikasi export static dan type checking**
- [ ] **Step 2: Verifikasi dev server start pada `0.0.0.0:7755`**
