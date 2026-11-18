import { BookOpen, Sparkles, Clock, Compass, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AstRead
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Phase 1 Scaffolding
              </span>
            </h1>
            <p className="text-xs text-slate-400">Personal Book & Light Novel Tracker</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Foundation Ready</span>
        </div>
      </header>

      {/* Main Hero Bento Preview */}
      <section className="my-8 space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1">
                Active Architecture Spec
              </p>
              <h2 className="text-2xl font-bold text-white">Next.js 16 + Capacitor + Supabase</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Scaffold arsitektur Phase 1 selesai. Sistem siap untuk modul reading session timer,
                kalkulasi estimasi tamat buku, dan ekspor bento card.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Port: 7755
              </span>
              <span className="px-3 py-1 text-xs rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                fun.pylexia.astread
              </span>
            </div>
          </div>
        </div>

        {/* 3 Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="h-8 w-8 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 mb-3 border border-indigo-800/50">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Dynamic Reading Speed</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Algoritma rolling average pages/jam berdasarkan timer sesi baca aktual.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="h-8 w-8 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400 mb-3 border border-amber-800/50">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Bento Share Card</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Generate kartu progres baca estetik bergaya visual Gridly untuk sosial media.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <div className="h-8 w-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-800/50">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-200 text-sm">Offline-first & Capacitor</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Siap di-export ke native Android APK via Capacitor CLI dan sync local storage.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Status */}
      <footer className="pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
        AstRead by Pylexia • Phase 1 Scaffold Verified • Target Next: Phase 2 Core Tracker
      </footer>
    </main>
  );
}
