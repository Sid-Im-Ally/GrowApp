import { useState, useRef } from 'react';
import type { Book, BookSuggestion, Note } from '../types';
import { BookList } from './BookList';
import { BookCard } from './BookCard';
import { BookSearch } from './BookSearch';
import { CompletedBooksDrawer } from './CompletedBooksDrawer';
import { EmptyState } from './EmptyState';
import { TrackingScreen } from './TrackingScreen';
import { exportToJSON, importFromJSON } from '../utils/exportImport';

interface Props {
  books: Book[];
  loading: boolean;
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onAddNote: (bookId: string, note: Note) => void;
  onUpdateNote: (bookId: string, note: Note) => void;
  onDeleteNote: (bookId: string, noteId: string) => void;
  onImport: (books: Book[]) => void;
}

/* ── Sun & Mountain mark — the primary Grow identity symbol ──
   sun: hollow ring + brass core · mountain triangle bisects lower third · horizon rule */
function GrowMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const fg = light ? '#f4f0e8' : 'var(--ink)';
  const w = size;
  const h = size * (80 / 120);
  return (
    <svg width={w} height={h} viewBox="0 0 120 80" fill="none" aria-label="Grow mark">
      <circle cx="60" cy="40" r="22" stroke={fg} strokeWidth="1.8" fill="none" />
      <circle cx="60" cy="40" r="5.5" fill="var(--sun)" />
      <line x1="6" y1="64" x2="114" y2="64" stroke={fg} strokeWidth="1.2" opacity="0.45" />
      <path d="M40 64 L60 44 L80 64 Z" fill={light ? '#1c1a17' : fg} stroke={fg} strokeWidth="1.8" strokeLinejoin="miter" />
    </svg>
  );
}

/* ── Completed icon — closed ensō with a calm check ── */
function CompletedIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5 L11 15 L15.5 9" />
    </svg>
  );
}

export function AppShell({
  books, loading, onAddBook, onUpdateBook, onDeleteBook,
  onAddNote, onUpdateNote, onDeleteNote, onImport,
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [addingBook, setAddingBook] = useState<BookSuggestion | null>(null);
  const [manualPages, setManualPages] = useState('');
  const [importError, setImportError] = useState('');
  const [trackingBookId, setTrackingBookId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const readingBooks = books.filter((b) => b.status === 'reading');
  const completedBooks = books.filter((b) => b.status === 'completed');
  const libraryBooks = books.filter((b) => b.status === 'library');

  function handleBookSelect(suggestion: BookSuggestion) {
    if (!suggestion.pageCount) { setAddingBook(suggestion); setManualPages(''); }
    else confirmAddToLibrary(suggestion, suggestion.pageCount);
  }

  function confirmAddToLibrary(suggestion: BookSuggestion, pages: number) {
    onAddBook({
      id: crypto.randomUUID(),
      title: suggestion.title,
      author: suggestion.author,
      coverUrl: suggestion.coverUrl,
      totalPages: pages,
      currentPage: 0,
      status: 'library',
      notes: [],
      isbn: suggestion.isbn,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setAddingBook(null);
  }

  function handleStartReading(book: Book) {
    onUpdateBook({ ...book, status: 'reading', updatedAt: new Date().toISOString() });
  }

  function handleMoveToReading(book: Book) {
    onUpdateBook({ ...book, status: 'reading', completedAt: undefined, updatedAt: new Date().toISOString() });
    setShowCompleted(false);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJSON(file);
      onImport(imported);
      setImportError('');
    } catch (err: any) {
      setImportError(err.message ?? 'Import failed.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{
        background: 'var(--paper-2)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >

      {/* ── Header ── */}
      <header
        className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 shrink-0 z-10"
        style={{
          background: 'var(--paper)',
          borderBottom: '1px solid var(--line)',
          height: 52,
          boxShadow: '0 1px 0 rgba(28,26,23,0.03)',
        }}
      >
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--muted)' }}
          onClick={() => setShowSidebar((v) => !v)}
          aria-label="Toggle library"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo — mark + wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <GrowMark size={32} />
          <div className="hidden sm:block" style={{ width: 1, height: 28, background: 'var(--line)', opacity: 0.6 }} />
          <span
            className="font-display"
            style={{ fontSize: 20, fontWeight: 300, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink)', paddingLeft: '0.1em' }}
          >
            Grow
          </span>
          {/* stats */}
          {books.length > 0 && (
            <span className="font-mono-grow text-[9px] ml-1 hidden sm:inline" style={{ color: 'var(--muted)', opacity: 0.7 }}>
              {[
                readingBooks.length > 0 && `${readingBooks.length} reading`,
                libraryBooks.length > 0 && `${libraryBooks.length} in library`,
                completedBooks.length > 0 && `${completedBooks.length} finished`,
              ].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToJSON(books)}
            className="hidden sm:flex items-center gap-1.5 font-mono-grow text-[9px] px-3 py-1.5 rounded-full transition-colors"
            style={{ border: '1px solid var(--line)', color: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
            title="Export"
          >
            Export
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="hidden sm:flex items-center gap-1.5 font-mono-grow text-[9px] px-3 py-1.5 rounded-full transition-colors"
            style={{ border: '1px solid var(--line)', color: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
            title="Import"
          >
            Import
          </button>
          <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />

          {/* Finished button — sage bg, ensō+check icon */}
          <button
            onClick={() => setShowCompleted(true)}
            className="flex items-center gap-2 font-mono-grow text-[9px] font-medium px-3 py-1.5 rounded-full transition-colors"
            style={{ background: 'var(--sage)', color: 'var(--paper)', border: '1px solid var(--sage)' }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <CompletedIcon size={13} color="var(--paper)" />
            <span className="hidden sm:inline">Finished</span>
            {completedBooks.length > 0 && (
              <span
                className="text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                style={{ background: 'rgba(244,240,232,0.25)', color: 'var(--paper)' }}
              >
                {completedBooks.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {importError && (
        <div className="px-4 py-2 font-mono-grow text-[9px] flex items-center justify-between shrink-0"
          style={{ background: 'rgba(154,110,78,0.1)', borderBottom: '1px solid var(--clay)', color: 'var(--clay)' }}>
          {importError}
          <button onClick={() => setImportError('')} style={{ color: 'var(--clay)', opacity: 0.6 }}>✕</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-20 md:hidden"
            style={{ background: 'rgba(28,26,23,0.5)' }}
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed md:relative z-30 md:z-auto top-0 bottom-0 left-0
            w-72 flex flex-col overflow-hidden
            transition-transform duration-200 ease-out
            ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ background: 'var(--ink)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Sidebar top */}
          <div className="px-4 pt-5 pb-3 shrink-0">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 mb-4 md:hidden">
              <GrowMark size={28} light />
              <span className="font-display" style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--paper)' }}>
                Grow
              </span>
            </div>

            <p className="font-mono-grow text-[9px] mb-3" style={{ color: 'rgba(122,116,104,0.5)' }}>
              My Library
            </p>

            {/* Search */}
            <BookSearch onBookSelect={handleBookSelect} variant="dark" />

            {/* Page count prompt */}
            {addingBook && (
              <div
                className="mt-3 rounded-xl p-3 space-y-2"
                style={{ background: 'rgba(200,169,106,0.08)', border: '1px solid rgba(200,169,106,0.2)' }}
              >
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(244,240,232,0.6)' }}>
                  <span style={{ color: 'rgba(244,240,232,0.9)' }}>"{addingBook.title}"</span> has no page count. How many pages?
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 320"
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value)}
                    className="w-24 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--paper)' }}
                    autoFocus
                  />
                  <button
                    onClick={() => { const p = parseInt(manualPages); if (p > 0) confirmAddToLibrary(addingBook, p); }}
                    disabled={!manualPages || parseInt(manualPages) <= 0}
                    className="font-mono-grow text-[9px] px-3 py-1.5 rounded-full disabled:opacity-40 transition-colors"
                    style={{ background: 'var(--sun)', color: 'var(--ink)' }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAddingBook(null)}
                    className="font-mono-grow text-[9px] px-2 py-1.5 transition-colors"
                    style={{ color: 'rgba(122,116,104,0.6)' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Book list */}
          <div className="flex-1 overflow-y-auto px-1 scrollbar-thin">
            <BookList
              books={books}
              onStartReading={(book) => { handleStartReading(book); setShowSidebar(false); }}
              onDeleteBook={onDeleteBook}
            />
          </div>

          {/* Sidebar footer */}
          <div className="px-3 py-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => exportToJSON(books)}
              className="flex-1 font-mono-grow text-[8px] py-2 rounded-full transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(122,116,104,0.6)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(244,240,232,0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(122,116,104,0.6)')}
            >
              Export
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="flex-1 font-mono-grow text-[8px] py-2 rounded-full transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(122,116,104,0.6)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(244,240,232,0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(122,116,104,0.6)')}
            >
              Import
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="max-w-5xl mx-auto px-4 py-6 sm:px-5 sm:py-8 md:px-8">
            {/* Section heading */}
            <div className="mb-5 sm:mb-7 flex items-baseline gap-3">
              <h1
                className="font-display italic"
                style={{ fontSize: 24, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}
              >
                Currently Reading
              </h1>
              {readingBooks.length > 0 && (
                <span className="font-mono-grow text-[9px]" style={{ color: 'var(--muted)' }}>
                  {readingBooks.length} book{readingBooks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'var(--sun)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : readingBooks.length === 0 ? (
              <EmptyState
                icon="○"
                message="Nothing open yet."
                subtext={libraryBooks.length > 0
                  ? 'Open your library and tap Read → on a book.'
                  : 'Search for a book in the sidebar to begin.'}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {readingBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onUpdate={onUpdateBook}
                    onDelete={onDeleteBook}
                    onAddNote={onAddNote}
                    onUpdateNote={onUpdateNote}
                    onDeleteNote={onDeleteNote}
                    onTrack={(b) => setTrackingBookId(b.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showCompleted && (
        <CompletedBooksDrawer
          books={completedBooks}
          onClose={() => setShowCompleted(false)}
          onMoveToReading={handleMoveToReading}
        />
      )}

      {trackingBookId && (() => {
        const trackingBook = books.find((b) => b.id === trackingBookId);
        if (!trackingBook) return null;
        return (
          <TrackingScreen
            book={trackingBook}
            onClose={() => setTrackingBookId(null)}
            onUpdateBook={onUpdateBook}
          />
        );
      })()}
    </div>
  );
}
