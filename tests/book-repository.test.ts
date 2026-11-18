import test from "node:test";
import assert from "node:assert/strict";
import { LocalBookRepository } from "../src/lib/storage/book-repository";

test("LocalBookRepository initializes with default books", () => {
  const repo = new LocalBookRepository();
  const books = repo.getBooks();
  assert.ok(books.length >= 2);
  assert.equal(books[0].title, "Buying My Classmate Once a Week");
});

test("LocalBookRepository can add a new book", () => {
  const repo = new LocalBookRepository([]);
  const newBook = repo.saveBook({
    title: "Chitose-kun wa Ramune Bin no Naka",
    volume: "Volume 1",
    author: "Hiromu",
    category: "light_novel",
    total_pages: 320,
    current_page: 0,
    status: "reading",
    rating: null,
    notes: null,
    cover_image_url: null,
  });

  assert.ok(newBook.id);
  assert.equal(repo.getBooks().length, 1);
  assert.equal(repo.getBookById(newBook.id)?.title, "Chitose-kun wa Ramune Bin no Naka");
});

test("LocalBookRepository updateProgress auto-completes when target reached", () => {
  const repo = new LocalBookRepository([]);
  const book = repo.saveBook({
    title: "Test Novel",
    volume: "1",
    author: "Author",
    category: "light_novel",
    total_pages: 100,
    current_page: 10,
    status: "reading",
    rating: null,
    notes: null,
    cover_image_url: null,
  });

  // Update progress to halfway
  const midUpdate = repo.updateProgress(book.id, 50);
  assert.equal(midUpdate.current_page, 50);
  assert.equal(midUpdate.status, "reading");

  // Update progress to 100
  const finalUpdate = repo.updateProgress(book.id, 100);
  assert.equal(finalUpdate.current_page, 100);
  assert.equal(finalUpdate.status, "completed");
  assert.ok(finalUpdate.completed_at);
});

test("LocalBookRepository recordSession adds reading session and updates book progress", () => {
  const repo = new LocalBookRepository([]);
  const book = repo.saveBook({
    title: "Otonari no Tenshi-sama",
    volume: "Volume 8",
    author: "Saekisan",
    category: "light_novel",
    total_pages: 300,
    current_page: 50,
    status: "reading",
    rating: null,
    notes: null,
    cover_image_url: null,
  });

  // Read 30 pages in 45 minutes (target page 80)
  const session = repo.recordSession(book.id, 80, 45, "Chapter 4 finish");
  assert.equal(session.start_page, 50);
  assert.equal(session.end_page, 80);
  assert.equal(session.pages_read, 30);
  assert.equal(session.duration_minutes, 45);
  assert.equal(session.speed_pages_per_hour, 40);

  const updatedBook = repo.getBookById(book.id);
  assert.equal(updatedBook?.current_page, 80);

  const sessions = repo.getSessions(book.id);
  assert.equal(sessions.length, 1);
});
