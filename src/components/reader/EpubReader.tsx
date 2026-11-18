"use client";

import { useEffect, useRef, useState } from "react";
import ePub, { type Book, type Rendition } from "epubjs";
import { ArrowLeft, Moon, Sun, Type, BookOpen, Clock, Zap } from "lucide-react";
import { EDITORIAL_THEMES, type ReaderThemeTokens, DEFAULT_READER_SETTINGS, type ReaderSettings } from "@/lib/reader/theme-tokens";
import { getEpubFile, getReadingPosition, saveReadingPosition } from "@/lib/storage/epub-storage";
import { bookRepo } from "@/lib/storage/book-repository";
import { triggerLightHaptic } from "@/lib/capacitor/native-bridge";

interface EpubReaderProps {
  bookId: string;
  onClose: () => void;
  repo: typeof bookRepo;
}

export function EpubReader({ bookId, onClose, repo }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState("Membaca Buku...");
  const [chapterTitle, setChapterTitle] = useState("");
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [showHUD, setShowHUD] = useState(true);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0); // 0 - 100
  const [virtualPage, setVirtualPage] = useState({ current: 1, total: 100 });
  const [sessionMinutes, setSessionMinutes] = useState(1);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const initialPageRef = useRef<number>(1);

  const activeTheme: ReaderThemeTokens = EDITORIAL_THEMES[settings.theme];

  // 1. Session Duration Counter (Heartbeat every 60s)
  useEffect(() => {
    sessionStartTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000));
      setSessionMinutes(elapsed);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2. Initialize and Mount EPUB
  useEffect(() => {
    let isMounted = true;

    async function initReader() {
      try {
        setLoading(true);
        setError(null);

        const stored = await getEpubFile(bookId);
        if (!stored) {
          throw new Error("File EPUB tidak ditemukan di IndexedDB lokal");
        }

        const bookMeta = repo.getBookById(bookId);
        if (bookMeta) {
          setBookTitle(bookMeta.title);
          initialPageRef.current = bookMeta.current_page;
          setVirtualPage({ current: bookMeta.current_page, total: bookMeta.total_pages });
        }

        const arrayBuffer = await stored.blob.arrayBuffer();
        const book = ePub(arrayBuffer);
        bookRef.current = book;

        await book.ready;
        if (!isMounted) return;

        // Generate standardized locations (1600 chars per virtual page)
        await (book.locations as any).generate(1600);
        const totalLocs = (book.locations as any).total || 100;

        if (viewerRef.current) {
          viewerRef.current.innerHTML = "";
          const rendition = book.renderTo(viewerRef.current, {
            width: "100%",
            height: "100%",
            flow: "paginated",
            spread: "none",
            minSpreadWidth: 8000, // Force single page layout even on wide screens
          });
          renditionRef.current = rendition;

          // Register locked themes
          applyRenditionThemes(rendition, settings);

          // Restore last position if available
          const savedPos = await getReadingPosition(bookId);
          if (savedPos && savedPos.cfi) {
            await rendition.display(savedPos.cfi);
          } else {
            await rendition.display();
          }

          // Trigger a layout resize pass after container is fully rendered
          setTimeout(() => {
            if (viewerRef.current && renditionRef.current) {
              const rect = viewerRef.current.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                renditionRef.current.resize(rect.width, rect.height);
              }
            }
          }, 150);

          // Register interaction listeners
          rendition.on("relocated", (location: any) => {
            if (!isMounted) return;
            const cfi = location.start.cfi;
            const progress = Math.round(book.locations.percentageFromCfi(cfi) * 100) || 0;
            setCurrentProgress(progress);

            const currVirtual = Math.max(1, Math.round((progress / 100) * (bookMeta?.total_pages || totalLocs)));
            setVirtualPage((prev) => ({ ...prev, current: currVirtual }));

            // Save position to IndexedDB (debounced)
            saveReadingPosition({
              bookId,
              cfi,
              progressPercentage: progress,
              currentPage: currVirtual,
              totalPages: bookMeta?.total_pages || totalLocs,
              updatedAt: new Date().toISOString(),
            });
          });

          // Single tap on reading surface toggles HUD
          rendition.on("click", () => {
            setShowHUD((prev) => !prev);
          });
        }

        setLoading(false);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Gagal membuka file EPUB");
          setLoading(false);
        }
      }
    }

    initReader();

    return () => {
      isMounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [bookId]);

  // 3. Apply themes and handle viewport resize
  useEffect(() => {
    if (renditionRef.current) {
      applyRenditionThemes(renditionRef.current, settings);
    }
  }, [settings]);

  useEffect(() => {
    const handleResize = () => {
      if (viewerRef.current && renditionRef.current) {
        const rect = viewerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          renditionRef.current.resize(rect.width, rect.height);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  function applyRenditionThemes(rendition: Rendition, s: ReaderSettings) {
    const theme = EDITORIAL_THEMES[s.theme];
    rendition.themes.register("editorial", {
      "html, body": {
        background: `${theme.bgCanvas} !important`,
        color: `${theme.textMain} !important`,
        "font-family": `${s.fontFamily === "serif" ? "'Newsreader', Georgia, serif" : "system-ui, sans-serif"} !important`,
        "font-size": `${s.fontSize}px !important`,
        "line-height": `${s.lineHeight} !important`,
        margin: "0 !important",
        padding: "0 24px !important",
        "box-sizing": "border-box !important",
        "overflow-x": "hidden !important",
        "word-break": "break-word !important",
        "overflow-wrap": "break-word !important",
      },
      p: {
        "text-indent": "1.5rem !important",
        "margin-bottom": "0.75rem !important",
        "text-align": "justify !important",
        "line-height": `${s.lineHeight} !important`,
      },
      "img, svg, image": {
        "max-width": "100% !important",
        "max-height": "100% !important",
        "object-fit": "contain !important",
        height: "auto !important",
        display: "block !important",
        margin: "0 auto !important",
      },
      h1: { color: `${theme.textMain} !important` },
      h2: { color: `${theme.textMain} !important` },
      h3: { color: `${theme.textMain} !important` },
      a: { color: `${theme.accentColor} !important` },
    });
    rendition.themes.select("editorial");
  }

  // 4. Auto-Save Session on Exit
  const handleExitReader = () => {
    triggerLightHaptic();
    const duration = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 60000));
    const pagesRead = Math.max(0, virtualPage.current - initialPageRef.current);

    // Auto-record session to repository if duration or progress occurred
    if (pagesRead > 0 || duration >= 1) {
      repo.recordSession(bookId, virtualPage.current, duration);
    } else {
      // Still update progress to ensure current_page and status match
      repo.updateProgress(bookId, virtualPage.current);
    }

    onClose();
  };

  const handleNextPage = () => {
    renditionRef.current?.next();
    triggerLightHaptic();
  };

  const handlePrevPage = () => {
    renditionRef.current?.prev();
    triggerLightHaptic();
  };

  const toggleTheme = (theme: "light" | "dark") => {
    setSettings((prev) => ({ ...prev, theme }));
    triggerLightHaptic();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden"
      style={{ backgroundColor: activeTheme.bgCanvas }}
    >
      {/* Top HUD (Distraction-Free) */}
      <header
        className={`px-4 py-3 flex items-center justify-between border-b transition-all duration-300 z-30 ${
          showHUD ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{
          backgroundColor: activeTheme.bgHud,
          borderColor: activeTheme.borderColor,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitReader}
            className="w-9 h-9 rounded-full flex items-center justify-center border shadow-sm transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.btnBg,
              borderColor: activeTheme.btnBorder,
              color: activeTheme.textMuted,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="max-w-[200px] sm:max-w-md">
            <h1 className="text-xs font-semibold truncate" style={{ color: activeTheme.textMain }}>
              {bookTitle}
            </h1>
            <span className="text-[10px] font-mono" style={{ color: activeTheme.textFaint }}>
              Halaman {virtualPage.current} dari {virtualPage.total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Session Timer */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border"
            style={{
              backgroundColor: activeTheme.accentBg,
              borderColor: activeTheme.borderColor,
              color: activeTheme.accentColor,
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{sessionMinutes}m</span>
          </div>

          {/* Quick Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className="w-9 h-9 rounded-full flex items-center justify-center border shadow-sm transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.btnBg,
              borderColor: activeTheme.btnBorder,
              color: activeTheme.textMain,
            }}
          >
            <Type className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Settings Drawer Dropdown */}
      {showSettingsDrawer && showHUD && (
        <div
          className="absolute top-16 right-4 z-40 p-4 rounded-2xl shadow-2xl border w-72 flex flex-col gap-3 animate-in fade-in zoom-in-95"
          style={{
            backgroundColor: activeTheme.bgHudCard,
            borderColor: activeTheme.borderColor,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: activeTheme.textMain }}>
              Pengaturan Tampilan
            </span>
            <button
              onClick={() => setShowSettingsDrawer(false)}
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ color: activeTheme.textMuted }}
            >
              ✕
            </button>
          </div>

          {/* Theme Switcher */}
          <div>
            <span className="text-[10px] font-mono uppercase block mb-1.5" style={{ color: activeTheme.textMuted }}>
              Mode Warna
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleTheme("light")}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                  settings.theme === "light" ? "ring-2 ring-amber-600 font-bold" : "opacity-80"
                }`}
                style={{
                  backgroundColor: EDITORIAL_THEMES.light.bgCanvas,
                  color: EDITORIAL_THEMES.light.textMain,
                  borderColor: EDITORIAL_THEMES.light.borderColor,
                }}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Cream</span>
              </button>
              <button
                onClick={() => toggleTheme("dark")}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all ${
                  settings.theme === "dark" ? "ring-2 ring-amber-400 font-bold" : "opacity-80"
                }`}
                style={{
                  backgroundColor: EDITORIAL_THEMES.dark.bgCanvas,
                  color: EDITORIAL_THEMES.dark.textMain,
                  borderColor: EDITORIAL_THEMES.dark.borderColor,
                }}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Midnight</span>
              </button>
            </div>
          </div>

          {/* Font Size Adjuster */}
          <div>
            <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: activeTheme.textMuted }}>
              <span>Ukuran Teks</span>
              <span>{settings.fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings((s) => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border"
                style={{
                  backgroundColor: activeTheme.btnBg,
                  borderColor: activeTheme.btnBorder,
                  color: activeTheme.textMain,
                }}
              >
                -
              </button>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: activeTheme.trackBg }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: activeTheme.trackFill,
                    width: `${((settings.fontSize - 12) / (22 - 12)) * 100}%`,
                  }}
                />
              </div>
              <button
                onClick={() => setSettings((s) => ({ ...s, fontSize: Math.min(22, s.fontSize + 1) }))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border"
                style={{
                  backgroundColor: activeTheme.btnBg,
                  borderColor: activeTheme.btnBorder,
                  color: activeTheme.textMain,
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reader Main Content Surface */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-3 p-6 text-center animate-pulse">
            <BookOpen className="w-10 h-10 animate-bounce" style={{ color: activeTheme.accentColor }} />
            <p className="text-xs font-mono" style={{ color: activeTheme.textMuted }}>
              Membuka naskah EPUB offline...
            </p>
          </div>
        )}

        {error && (
          <div className="p-6 max-w-sm text-center flex flex-col items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-xs text-red-400 font-mono">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border shadow"
              style={{
                backgroundColor: activeTheme.btnBg,
                borderColor: activeTheme.borderColor,
                color: activeTheme.textMain,
              }}
            >
              Kembali ke Dashboard
            </button>
          </div>
        )}

        {/* EPUB.js Rendition Target */}
        <div
          ref={viewerRef}
          className="w-full h-full max-w-3xl mx-auto px-2 sm:px-6 cursor-pointer overflow-hidden flex items-center justify-center [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
        />

        {/* Transparent Click Zones for Page Flipping */}
        {!loading && !error && (
          <>
            <div
              onClick={handlePrevPage}
              className="absolute left-0 top-0 bottom-0 w-[18%] z-10 opacity-0 active:opacity-10 transition-opacity bg-black/10"
              title="Halaman Sebelumnya"
            />
            <div
              onClick={handleNextPage}
              className="absolute right-0 top-0 bottom-0 w-[18%] z-10 opacity-0 active:opacity-10 transition-opacity bg-black/10"
              title="Halaman Berikutnya"
            />
          </>
        )}
      </main>

      {/* Bottom HUD (Distraction-Free) */}
      <footer
        className={`px-4 py-3 border-t flex flex-col gap-2 transition-all duration-300 z-30 ${
          showHUD ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{
          backgroundColor: activeTheme.bgHud,
          borderColor: activeTheme.borderColor,
        }}
      >
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2" style={{ color: activeTheme.textMuted }}>
            <span>Halaman {virtualPage.current}</span>
            <span>•</span>
            <span className="font-semibold" style={{ color: activeTheme.accentColor }}>
              {currentProgress}%
            </span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: activeTheme.accentColor }}>
            <Zap className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {repo.getSessions(bookId)[0]?.speed_pages_per_hour?.toFixed(1) || "35.0"} hlm/jam
            </span>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: activeTheme.trackBg }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: activeTheme.trackFill,
              width: `${currentProgress}%`,
            }}
          />
        </div>
      </footer>
    </div>
  );
}
