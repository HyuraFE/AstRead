import type { Book, ReadingSession } from "../../types/database";
import { calculateSessionSpeed } from "../analytics/calculator";

const INITIAL_BOOKS: Book[] = [
  {
    id: "sample-book-1",
    user_id: "local-user",
    title: "Buying My Classmate Once a Week",
    volume: "Volume 2",
    author: "Fei",
    category: "light_novel",
    total_pages: 345,
    current_page: 345,
    status: "completed",
    rating: 5,
    notes: "Tamat Volume 2",
    cover_url: null,
    started_at: "2026-10-01T00:00:00.000Z",
    completed_at: "2026-10-25T00:00:00.000Z",
    created_at: "2026-10-01T00:00:00.000Z",
    updated_at: "2026-10-25T00:00:00.000Z",
  },
  {
    id: "sample-book-2",
    user_id: "local-user",
    title: "Buying My Classmate Once a Week",
    volume: "Volume 3",
    author: "Fei",
    category: "light_novel",
    total_pages: 229,
    current_page: 229,
    status: "completed",
    rating: 5,
    notes: "Tamat Volume 3",
    cover_url: null,
    started_at: "2026-11-01T00:00:00.000Z",
    completed_at: "2026-11-15T00:00:00.000Z",
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-15T00:00:00.000Z",
  },
];

const STORAGE_KEY_BOOKS = "astread_books";
const STORAGE_KEY_SESSIONS = "astread_sessions";

export class LocalBookRepository {
  private books: Book[];
  private sessions: ReadingSession[];

  constructor(initialBooks?: Book[]) {
    if (typeof window !== "undefined") {
      try {
        const storedBooks = localStorage.getItem(STORAGE_KEY_BOOKS);
        const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
        this.books = storedBooks ? JSON.parse(storedBooks) : (initialBooks ? [...initialBooks] : [...INITIAL_BOOKS]);
        this.sessions = storedSessions ? JSON.parse(storedSessions) : [];
      } catch {
        this.books = initialBooks ? [...initialBooks] : [...INITIAL_BOOKS];
        this.sessions = [];
      }
    } else {
      this.books = initialBooks ? [...initialBooks] : [...INITIAL_BOOKS];
      this.sessions = [];
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(this.books));
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(this.sessions));
      } catch (err) {
        console.error("Failed to persist to localStorage", err);
      }
    }
  }

  getBooks(): Book[] {
    return [...this.books];
  }

  getBookById(id: string): Book | undefined {
    return this.books.find((b) => b.id === id);
  }

  saveBook(
    bookData: Omit<Book, "id" | "user_id" | "created_at" | "updated_at"> & { id?: string }
  ): Book {
    const now = new Date().toISOString();

    if (bookData.id) {
      const idx = this.books.findIndex((b) => b.id === bookData.id);
      if (idx !== -1) {
        const updated: Book = {
          ...this.books[idx],
          ...bookData,
          updated_at: now,
        };
        this.books[idx] = updated;
        this.persist();
        return updated;
      }
    }

    const newBook: Book = {
      id: bookData.id || `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: "local-user",
      title: bookData.title,
      volume: bookData.volume ?? null,
      author: bookData.author ?? null,
      category: bookData.category,
      total_pages: bookData.total_pages,
      current_page: bookData.current_page || 0,
      status: bookData.status || "reading",
      rating: bookData.rating ?? null,
      notes: bookData.notes ?? null,
      cover_url: bookData.cover_url ?? null,
      started_at: bookData.started_at ?? now,
      completed_at: bookData.completed_at ?? null,
      created_at: now,
      updated_at: now,
    };

    this.books.unshift(newBook);
    this.persist();
    return newBook;
  }

  updateProgress(id: string, newPage: number): Book {
    const book = this.getBookById(id);
    if (!book) {
      throw new Error(`Book not found: ${id}`);
    }

    const cappedPage = Math.min(Math.max(0, newPage), book.total_pages);
    const isCompleted = cappedPage >= book.total_pages;
    const now = new Date().toISOString();

    const updated: Book = {
      ...book,
      current_page: cappedPage,
      status: isCompleted ? "completed" : book.status === "completed" ? "reading" : book.status,
      completed_at: isCompleted ? (book.completed_at || now) : null,
      updated_at: now,
    };

    const idx = this.books.findIndex((b) => b.id === id);
    this.books[idx] = updated;
    this.persist();
    return updated;
  }

  recordSession(
    bookId: string,
    endPage: number,
    durationMinutes: number,
    notes?: string
  ): ReadingSession {
    const book = this.getBookById(bookId);
    if (!book) {
      throw new Error(`Book not found: ${bookId}`);
    }

    const startPage = book.current_page;
    const pagesRead = Math.max(0, endPage - startPage);
    const speed = calculateSessionSpeed(pagesRead, durationMinutes);
    const now = new Date().toISOString();

    const session: ReadingSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      book_id: bookId,
      user_id: "local-user",
      start_page: startPage,
      end_page: endPage,
      pages_read: pagesRead,
      duration_minutes: durationMinutes,
      speed_pages_per_hour: speed,
      session_date: now.split("T")[0],
      notes: notes || null,
      created_at: now,
    };

    this.sessions.unshift(session);
    this.updateProgress(bookId, endPage);
    this.persist();
    return session;
  }

  getSessions(bookId?: string): ReadingSession[] {
    if (bookId) {
      return this.sessions.filter((s) => s.book_id === bookId);
    }
    return [...this.sessions];
  }
}

export const bookRepo = new LocalBookRepository();

