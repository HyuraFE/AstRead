import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface StoredEpubFile {
  bookId: string;
  fileName: string;
  fileSize: number;
  blob: Blob;
  mimeType: string;
  updatedAt: string;
}

export interface ReadingPosition {
  bookId: string;
  cfi: string; // Canonical Fragment Identifier from epubjs
  progressPercentage: number; // 0 - 100
  currentPage: number;
  totalPages: number;
  chapterTitle?: string;
  updatedAt: string;
}

interface AstReadDB extends DBSchema {
  epub_files: {
    key: string; // bookId
    value: StoredEpubFile;
  };
  reading_positions: {
    key: string; // bookId
    value: ReadingPosition;
  };
}

const DB_NAME = "astread_local_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AstReadDB>> | null = null;

export function getLocalDB(): Promise<IDBPDatabase<AstReadDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser environment"));
  }

  if (!dbPromise) {
    dbPromise = openDB<AstReadDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("epub_files")) {
          db.createObjectStore("epub_files", { keyPath: "bookId" });
        }
        if (!db.objectStoreNames.contains("reading_positions")) {
          db.createObjectStore("reading_positions", { keyPath: "bookId" });
        }
      },
    });
  }

  return dbPromise;
}

/**
 * Save an EPUB binary blob associated with a book ID
 */
export async function saveEpubFile(bookId: string, file: File | Blob, fileName: string): Promise<void> {
  const db = await getLocalDB();
  const stored: StoredEpubFile = {
    bookId,
    fileName,
    fileSize: file.size,
    blob: file,
    mimeType: file.type || "application/epub+zip",
    updatedAt: new Date().toISOString(),
  };
  await db.put("epub_files", stored);
}

/**
 * Retrieve an EPUB binary blob for reading
 */
export async function getEpubFile(bookId: string): Promise<StoredEpubFile | undefined> {
  const db = await getLocalDB();
  return db.get("epub_files", bookId);
}

/**
 * Delete an EPUB binary blob
 */
export async function deleteEpubFile(bookId: string): Promise<void> {
  const db = await getLocalDB();
  await db.delete("epub_files", bookId);
  await db.delete("reading_positions", bookId);
}

/**
 * Check if a book has an offline EPUB file attached
 */
export async function hasEpubFile(bookId: string): Promise<boolean> {
  const db = await getLocalDB();
  const file = await db.get("epub_files", bookId);
  return Boolean(file && file.fileSize > 0);
}

/**
 * Save last reading position (CFI, percentage, page)
 */
export async function saveReadingPosition(pos: ReadingPosition): Promise<void> {
  const db = await getLocalDB();
  await db.put("reading_positions", pos);
}

/**
 * Get last reading position
 */
export async function getReadingPosition(bookId: string): Promise<ReadingPosition | undefined> {
  const db = await getLocalDB();
  return db.get("reading_positions", bookId);
}
