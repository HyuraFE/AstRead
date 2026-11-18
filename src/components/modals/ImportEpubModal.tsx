"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { parseEpubFile, type ParsedEpubMetadata } from "@/lib/reader/epub-parser";
import { saveEpubFile } from "@/lib/storage/epub-storage";
import { bookRepo } from "@/lib/storage/book-repository";
import { triggerSuccessHaptic, triggerLightHaptic } from "@/lib/capacitor/native-bridge";

interface ImportEpubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (bookId: string) => void;
}

export function ImportEpubModal({ isOpen, onClose, onImportSuccess }: ImportEpubModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedMeta, setParsedMeta] = useState<ParsedEpubMetadata | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".epub")) {
      setError("File harus berekstensi .epub");
      return;
    }

    try {
      setError(null);
      setParsing(true);
      setSelectedFile(file);

      // Parse metadata, cover, & virtual pages client-side
      const meta = await parseEpubFile(file);
      setParsedMeta(meta);
      triggerLightHaptic();
    } catch (err: any) {
      setError(err.message || "Gagal membaca struktur file EPUB");
      setSelectedFile(null);
      setParsedMeta(null);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !parsedMeta) return;

    try {
      setSaving(true);
      setError(null);

      // 1. Add book metadata to repository
      const newBook = bookRepo.saveBook({
        title: parsedMeta.title,
        volume: null,
        author: parsedMeta.author,
        category: "light_novel",
        total_pages: parsedMeta.totalEstimatedPages,
        current_page: 0,
        status: "reading",
        rating: null,
        notes: "Diimpor dari file EPUB lokal",
        cover_url: parsedMeta.coverDataUrl || null,
        started_at: new Date().toISOString(),
        completed_at: null,
      });

      // 2. Save raw EPUB binary blob to IndexedDB
      await saveEpubFile(newBook.id, selectedFile, selectedFile.name);

      triggerSuccessHaptic();
      onImportSuccess(newBook.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan file EPUB ke database lokal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#0f111a] border border-[#1e2238] rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        
        <div className="flex items-center justify-between border-b border-[#1e2238] pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-white">Import EPUB Lokal</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* File Picker Zone */}
        {!parsedMeta && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#2a3050] hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-[#090a10]/60 active:scale-[0.98]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".epub,application/epub+zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-200">
                {parsing ? "Memproses berkas EPUB..." : "Ketuk untuk memilih file .epub dari HP"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Disimpan 100% offline di storage lokal HP
              </p>
            </div>
          </div>
        )}

        {/* Parsed Preview Card */}
        {parsedMeta && (
          <div className="p-4 rounded-xl bg-[#141724] border border-[#22273d] flex gap-4 items-center">
            {parsedMeta.coverDataUrl ? (
              <img
                src={parsedMeta.coverDataUrl}
                alt="Cover"
                className="w-16 h-22 object-cover rounded-lg border border-slate-700 shadow"
              />
            ) : (
              <div className="w-16 h-22 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-400 border border-slate-700">
                No Cover
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                Metadata Terbaca
              </span>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">
                {parsedMeta.title}
              </h3>
              <p className="text-xs text-slate-400 truncate">{parsedMeta.author}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                <span>📖 ~{parsedMeta.totalEstimatedPages} Halaman</span>
                <span>•</span>
                <span>📦 {(selectedFile!.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!parsedMeta || saving}
            onClick={handleConfirmImport}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              parsedMeta && !saving
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <span>Menyimpan ke HP...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Mulai Membaca</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
