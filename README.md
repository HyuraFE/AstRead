# AstRead

Personal Book & Light Novel Tracker with Dynamic Reading Speed Analytics, Bento Share Card, and Local Offline EPUB Reader.

Dibuat untuk mencatat progres bacaan, menghitung estimasi selesai secara adaptif, dan membaca berkas EPUB langsung di perangkat tanpa backend server (100% offline-first).

---

## Fitur Utama

- **Reading Progress Tracker:** Pantau progres per judul buku atau volume (*Sedang Dibaca*, *Tamat*, *Ingin Dibaca*) lengkap dengan persentase dan sisa halaman.
- **Reading Speed & Adaptive ETA:** Timer sesi baca interaktif yang menghitung kecepatan membaca (*rolling pace* halaman/jam) dan mengestimasi sisa waktu tuntasnya buku secara realistis.
- **Bento Share Card:** Export statistik bacaan mingguan dan profil bacaan ke dalam kartu visual Bento (PNG) siap share ke media sosial.
- **Offline EPUB Reader:** Impor naskah `.epub` langsung dari memori lokal (tersimpan di IndexedDB perangkat). Dilengkapi tema Editorial Dual-Mode (*Warm Cream Paper* & *Midnight Espresso*), drawer ukuran font dinamis, dan auto-save posisi halaman (CFI) serta durasi sesi saat keluar.
- **Cross-Platform (Web & Android):** Berbasis web modern yang dibungkus Capacitor 8 untuk berjalan mulus sebagai aplikasi native Android APK.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Static Export), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide Icons
- **Storage:** IndexedDB (`idb`) untuk binary file EPUB, `localStorage` untuk metadata tracker
- **EPUB Engine:** `epubjs`, `jszip`
- **Mobile Container:** Capacitor 8 Android (`fun.pylexia.astread`)
- **Testing:** Node.js native test runner via `tsx`

---

## Menjalankan Proyek

### 1. Development Server
```bash
npm install
npm run dev
```
Buka `http://localhost:7755` di browser.

### 2. Unit Testing
```bash
npm test
```

### 3. Build & Sync ke Android
```bash
npm run export:android
```

---

## Lisensi

Private personal project. Dibuat oleh [HyuraFE](https://github.com/HyuraFE).
