# ARCHITECTURE SPECIFICATION: AstRead

**Project Name:** AstRead  
**Type:** Personal Book & Light Novel Tracker with Dynamic Reading Speed Analytics  
**Target Platforms:** Android APK (Capacitor) & Web Dashboard  
**Host & Preview:** `0.0.0.0:7755`

---

## 1. TECH STACK & FOUNDATION

- **Framework:** Next.js (App Router, React 19, TypeScript strict mode)
- **Styling:** Tailwind CSS (v4) + Lucide Icons + Neobrutalism/Clean minimal UI
- **Mobile Wrapper:** `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
- **Native Plugins:** `@capacitor/preferences` (local key-value), `@capacitor/haptics`, `@capacitor/status-bar`
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Row Level Security) + IndexedDB/LocalStorage (offline-first fallback)
- **Deployment:** Vercel (Web) & GitHub Actions / Local Build (Android APK)

---

## 2. DIRECTORY STRUCTURE

```text
/root/projects/AstRead/
├── android/                   # Generated Android native project (Capacitor)
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Auth routes (Supabase Auth / Google OAuth)
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx       # Main dashboard: active reading, progress bento, ETA stats
│   │   │   ├── books/         # Bookshelf catalog & detail page
│   │   │   ├── session/       # Active reading session timer
│   │   │   └── stats/         # Reading speed analytics & history charts
│   │   ├── api/               # Server-side API endpoints & metadata scrapers
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # Base UI: Button, Input, Modal, ProgressBar, Badge
│   │   ├── books/             # BookCard, BookForm, VolumeList, CoverUpload
│   │   ├── session/           # ReadingTimer, PageSlider, SessionSummaryModal
│   │   └── cards/             # ShareableBentoCard (HTML2Canvas / SVG export)
│   ├── lib/
│   │   ├── supabase/          # Client & Server Supabase helpers
│   │   ├── calculations/      # Reading speed (pages/hr), completion ETA algorithms
│   │   └── capacitor/         # Native device bridge helpers
│   └── types/                 # Database types, session records, book schemas
├── supabase/
│   └── schema.sql             # Migration & RLS definitions
├── capacitor.config.ts        # Capacitor App configuration (App ID: fun.pylexia.astread)
├── ARCHITECTURE.md            # Technical architecture spec
└── package.json
```

---

## 3. DATA MODEL (SUPABASE SCHEMA)

### A. Table: `books`
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `user_id` (uuid, references `auth.users`, not null)
- `title` (text, not null)
- `author` (text)
- `category` (enum: `novel`, `light_novel`, `manga`, `non_fiction`, `academic`)
- `current_volume` (int, default 1)
- `total_volumes` (int, default 1)
- `current_page` (int, default 0)
- `total_pages` (int, not null)
- `cover_url` (text)
- `status` (enum: `reading`, `completed`, `on_hold`, `plan_to_read`)
- `created_at`, `updated_at` (timestamptz)

### B. Table: `reading_sessions`
- `id` (uuid, primary key, default `gen_random_uuid()`)
- `book_id` (uuid, references `books.id` on delete cascade)
- `user_id` (uuid, references `auth.users`)
- `start_page` (int, not null)
- `end_page` (int, not null)
- `duration_seconds` (int, not null)
- `speed_pages_per_hour` (numeric, generated / calculated)
- `session_date` (date, default `current_date`)
- `created_at` (timestamptz)

---

## 4. CORE ENGINE & LOGIC

### A. Reading Speed & ETA Algorithm (`src/lib/calculations/reading-stats.ts`)
1. **Pages Read in Session:** `Δpages = end_page - start_page`
2. **Speed (pages/hour):** `(Δpages / duration_seconds) * 3600`
3. **Rolling Average Speed:** Rata-rata terbobot dari 5 sesi terakhir pengguna.
4. **Remaining Pages:** `total_pages - current_page`
5. **Estimated Time to Finish (Hours):** `Remaining Pages / Rolling Average Speed`
6. **Projected Completion Date:** `Current Date + (Estimated Hours / Average Daily Reading Time)`

### B. Bento Card Share Generator
- Mengonversi data progres buku aktif ke format kartu visual bento grid siap simpan gambar (PNG) untuk di-share ke medsos atau story Discord.
- Memuat judul, cover art, volume, badge persentase progres, dan estimasi waktu selesai.

---

## 5. CAPACITOR INTEGRATION CHECKLIST

- **Web Asset Output:** `out` directory (`next.config.ts` configured with `output: 'export'`)
- **App ID:** `fun.pylexia.astread`
- **App Name:** `AstRead`
- **Native Permissions:** Biometric (opsional), Network status monitoring.

---

## 6. IMPLEMENTATION ROADMAP

- **Phase 1: Foundation & Scaffold**
  - Setup Next.js 16 + React 19 + Tailwind CSS v4 + Capacitor skeleton.
  - Setup Supabase table migrations (`supabase/schema.sql`) & RLS policies.
  - Setup core database and domain TypeScript interfaces.
  - Verify static export & build pipeline.
- **Phase 2: Core Tracker & Reading Session Timer**
  - CRUD buku & volume.
  - Sesi baca interaktif (timer + input halaman selesai baca).
  - Algoritma kalkulasi *pages/hr* dan prediksi tanggal tamat.
- **Phase 3: Bento Share Card & Analytics**
  - Chart riwayat membaca mingguan/bulanan.
  - Komponen Bento Card dengan fitur *Save as Image*.
- **Phase 4: Android Build & Polishing**
  - Capacitor Android sync & icons configuration.
  - Verifikasi build APK dan uji responsivitas mobile.
