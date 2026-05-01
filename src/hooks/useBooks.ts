import { useState, useEffect, useCallback } from 'react';
import type { Book, Note } from '../types';
import * as db from '../utils/db';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getBooks().then((all) => {
      setBooks(all);
      setLoading(false);
    });
  }, []);

  const addBook = useCallback(async (book: Book) => {
    await db.addBook(book);
    setBooks((prev) => [...prev, book]);
  }, []);

  const updateBook = useCallback(async (updated: Book) => {
    await db.updateBook(updated);
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    await db.deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addNote = useCallback(async (bookId: string, note: Note) => {
    await db.addNote(bookId, note);
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, notes: [...b.notes, note], updatedAt: new Date().toISOString() }
          : b
      )
    );
  }, []);

  const updateNote = useCallback(async (bookId: string, updatedNote: Note) => {
    await db.updateNote(bookId, updatedNote);
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              notes: b.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );
  }, []);

  const deleteNote = useCallback(async (bookId: string, noteId: string) => {
    await db.deleteNote(bookId, noteId);
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              notes: b.notes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );
  }, []);

  const replaceAllBooks = useCallback(async (incoming: Book[]) => {
    // Used during import: merge by id (upsert), keep existing books not in import
    for (const book of incoming) {
      await db.updateBook(book);
    }
    const all = await db.getBooks();
    setBooks(all);
  }, []);

  return {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    addNote,
    updateNote,
    deleteNote,
    replaceAllBooks,
  };
}
