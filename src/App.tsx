import { useBooks } from './hooks/useBooks';
import { AppShell } from './components/AppShell';
import type { Book } from './types';

export default function App() {
  const {
    books,
    loading,
    addBook,
    updateBook,
    deleteBook,
    addNote,
    updateNote,
    deleteNote,
    replaceAllBooks,
  } = useBooks();

  async function handleImport(incoming: Book[]) {
    await replaceAllBooks(incoming);
  }

  return (
    <AppShell
      books={books}
      loading={loading}
      onAddBook={addBook}
      onUpdateBook={updateBook}
      onDeleteBook={deleteBook}
      onAddNote={addNote}
      onUpdateNote={updateNote}
      onDeleteNote={deleteNote}
      onImport={handleImport}
    />
  );
}
