// IndexedDB is used instead of localStorage because:
// - Books with notes can grow large (localStorage limit is ~5MB)
// - IndexedDB handles structured data natively without JSON serialization overhead
// - Async operations don't block the UI thread
// - Browser quota is typically 50MB+, suitable for a personal reading library

import { openDB, type IDBPDatabase } from 'idb';
import type { Book, Note } from '../types';

const DB_NAME = 'grow';
const DB_VERSION = 1;
const STORE = 'books';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function getBooks(): Promise<Book[]> {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function addBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put(STORE, book);
}

export async function updateBook(book: Book): Promise<void> {
  const db = await getDB();
  await db.put(STORE, book);
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function addNote(bookId: string, note: Note): Promise<void> {
  const db = await getDB();
  const book: Book = await db.get(STORE, bookId);
  if (!book) return;
  book.notes = [...book.notes, note];
  book.updatedAt = new Date().toISOString();
  await db.put(STORE, book);
}

export async function updateNote(bookId: string, updatedNote: Note): Promise<void> {
  const db = await getDB();
  const book: Book = await db.get(STORE, bookId);
  if (!book) return;
  book.notes = book.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
  book.updatedAt = new Date().toISOString();
  await db.put(STORE, book);
}

export async function deleteNote(bookId: string, noteId: string): Promise<void> {
  const db = await getDB();
  const book: Book = await db.get(STORE, bookId);
  if (!book) return;
  book.notes = book.notes.filter((n) => n.id !== noteId);
  book.updatedAt = new Date().toISOString();
  await db.put(STORE, book);
}
