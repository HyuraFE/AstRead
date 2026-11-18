# AstRead — Phase 4 Architecture: Local EPUB Importer & Integrated Reader

Dokumen arsitektur teknis integrasi pembaca EPUB lokal (offline-first) ke dalam **AstRead** untuk platform Web & Android (Capacitor).

---

## 1. Core Principles
1. **100% Offline & Client-Side:** Tidak ada file EPUB yang dikirim ke remote server. Parsing metadata, cover extraction, dan rendering dilakukan murni di Webview / browser.
2. **Zero Bloat APK:** File installer APK tetap ringan (< 15MB). Buku di-import oleh pengguna secara mandiri dari storage HP.
3. **Seamless Auto-Tracking:** Mengeliminasi kebutuhan input progres manual saat membaca EPUB. Tracker otomatis mencatat durasi, persentase baca, dan menghitung kecepatan baca.
4. **Graceful Fallback:** Buku fisik / non-EPUB tetap bisa ditracking secara manual seperti biasa (Phase 1-3).

---

## 2. System Architecture Diagram

```
+-------------------------------------------------------------------------+
|                              AstRead App                                |
+-------------------------------------------------------------------------+
       |                                                 |
       v (User Import .epub)                             v (Buka Reader)
+-------------------------------+              +--------------------------+
|      EPUB Ingestion Pipeline  |              |   Integrated EPUB Reader |
|  - File Picker (HTML5 / Cap)  |              |  - epubjs / Web Reader   |
|  - Metadata & Cover Parser    |              |  - DOM Sanitization      |
|  - Chapter TOC Extraction     |              |  - Theme/Font Settings   |
+-------------------------------+              +--------------------------+
       |                                                 |
       v (Save Blob)                                     v (On Location Change)
+-------------------------------+              +--------------------------+
|  Local Storage Layer (IDB)    | <----------- |   Reading Session Engine |
|  - Database: `astread_books`  | (Fetch Blob) |  - Auto-start timer      |
|  - Store 1: `files` (Blob)    |              |  - Track delta pages/cfi |
|  - Store 2: `bookmarks`       |              |  - Auto-save on exit     |
+-------------------------------+              +--------------------------+
       |                                                 |
       +-----------------------+-------------------------+
                               |
                               v (Update Repository)
               +--------------------------------+
               | LocalBookRepository / Database |
               |  - current_page / progress     |
               |  - reading_sessions record     |
               |  - rolling speed calculation   |
               +--------------------------------+
```

---

## 3. Storage Architecture: IndexedDB (`astread_local_db`)

Karena file `.epub` berukuran 1MB - 100MB+, kita menggunakan **IndexedDB** dengan wrapper ringan `idb` (promise-based, ~1KB).

### Object Stores:
1. **`epub_files`**
   - **Key:** `book_id` (string UUID)
   - **Value:**
     ```typescript
     {
       bookId: string;
       fileName: string;
       fileSize: number;
       blob: Blob;            // Binary file EPUB
       updatedAt: string;
     }
     ```
2. **`reading_positions`**
   - **Key:** `book_id` (string UUID)
   - **Value:**
     ```typescript
     {
       bookId: string;
       cfi: string;            // Canonical Fragment Identifier (posisi akurat epubjs)
       progressPercentage: number; // 0.0 - 100.0
       chapterTitle: string;
       totalLocations: number;
       updatedAt: string;
     }
     ```

---

## 4. Metadata & Cover Extraction Pipeline
Saat user memilih file `.epub`:
1. **Parser Baca Metadata:** Mengambil `dc:title`, `dc:creator` (author), dan deskripsi dari berkas `.opf`.
2. **Cover Image:** Mengekstrak gambar cover dari manifest EPUB, di-convert menjadi data URL / base64 string dan disimpan di `cover_url` tabel `books`.
3. **Penyimpanan:**
   - File fisik (`Blob`) disimpan di IndexedDB `epub_files`.
   - Entry buku baru dibuat di `LocalBookRepository` dengan status `reading` atau `plan_to_read` dan metadata terkait.

---

## 5. Auto-Tracking & Reading Speed Metric
Tantangan EPUB: Teks bersifat *reflowable* (ukuran halaman dinamis tergantung resolusi layar dan font).

### Solusi Kalkulasi Progres & Halaman:
1. **Epub Location Generation:**
   - Reader membangkitkan lokasi terstandar (`book.locations.generate(1600)` — 1600 karakter setara 1 halaman standar novel).
   - Menghasilkan total *virtual pages* yang konsisten di semua layar.
2. **Auto-Session Lifecycle:**
   - **Mount Reader:** Mulai timer (`sessionStartTime = Date.now()`), catat `startPage`.
   - **Flip Page / Scroll:** Update `currentCfi` dan `progressPercentage` ke memory/IDB (debounced 1s agar efisien).
   - **Unmount / Tombol Back:**
     - Durasi: `Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000))` (dalam menit).
     - Halaman terbaca: `Math.max(0, endPage - startPage)`.
     - Panggil otomatis `repo.recordSession(bookId, startPage, endPage, durationMinutes)` jika durasi > 0 dan halaman terbaca > 0.
     - Kecepatan membaca langsung di-kalkulasi dan dimasukkan ke rolling analytics tanpa perlu interaksi manual.

---

## 6. UI & Reader Experience Specifications (Editorial Dual-Mode Locked)

Mengadopsi spesifikasi desain **`editorial-reader-design` (Warm Bunkobon Dual-Mode)**:

### Color Tokens & Palette
- **Light Mode (Warm Bunkobon Cream):**
  - Canvas Background: `#f6f0e8` (soft Japanese paperback paper tone)
  - Body Text: `#2b2420` (warm dark espresso/chocolate, WCAG AAA contrast)
  - Muted Text: `#7d7065`
  - Border & Hairlines: `#d8c8b4`
  - Accent: `#92400e` (warm amber)
  - HUD Card: `#e4d7c6`
- **Dark Mode (Midnight Espresso):**
  - Canvas Background: `#121010` (deep organic warm black)
  - Body Text: `#e2dad2` (soft ivory cream)
  - Muted Text: `#9e9187`
  - Border & Hairlines: `#322b27`
  - Accent: `#f59e0b` (golden amber)
  - HUD Card: `#201c1a`

### Typography & Layout Rules
- **Font Family:** Serif editorial (`Newsreader`, `Charter`, `Source Serif 4`, serif fallback).
- **Line Height:** `1.8` - `1.85` dengan paragraph first-line indent (`1.5rem`) untuk kenyamanan membaca novel panjang.
- **Font Scale:** Default `15px` / `16px`, slider adjustable `12px` - `22px`.

### Distraction-Free Interaction Model
- **Tap Center:** Toggle visibility HUD (header + bottom footer) secara halus.
- **Top HUD:** Tombol kembali, judul buku/bab, badge active session duration (`⏱️ <duration>m`), dan tombol pengaturan `Aa`.
- **Bottom HUD:** Progress bar responsif, indikator halaman & persentase, estimasi sisa waktu baca, tombol TOC, dan pace indicator (`⚡ <pace> hlm/jam`).
- **Quick Settings Drawer (`Aa`):** 1-tap theme switch (Warm Cream vs Midnight Espresso) dan font size controller.

---

---

## 7. Rencana Tahapan Implementasi (Milestones)

1. **Task 1: Storage Layer & File Ingestion**
   - Setup `idb` service untuk IndexedDB (`epub-storage.ts`).
   - Komponen modal / input import file `.epub` dengan auto-extract metadata & cover.
2. **Task 2: EPUB Rendering Engine**
   - Komponen core `EpubReader.tsx` menggunakan `epubjs`.
   - Custom styling sandboxed iframe (dark theme & responsive typography).
3. **Task 3: Reading Progress & Auto-Session Sync**
   - Integrasi auto-timer & CFI tracking.
   - Sinkronisasi otomatis ke `LocalBookRepository` saat exit reader.
4. **Task 4: Reader Controls & Settings UI**
   - Menu font size, theme mode (OLED/Dark), TOC modal/drawer.
