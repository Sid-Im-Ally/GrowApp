import { useState } from 'react';
import type { Book, Note } from '../types';
import { ProgressBar } from './ProgressBar';
import { NotesPanel } from './NotesPanel';

interface Props {
  book: Book;
  onUpdate: (book: Book) => void;
  onDelete: (id: string) => void;
  onAddNote: (bookId: string, note: Note) => void;
  onUpdateNote: (bookId: string, note: Note) => void;
  onDeleteNote: (bookId: string, noteId: string) => void;
}

export function BookCard({ book, onUpdate, onDelete, onAddNote, onUpdateNote, onDeleteNote }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isFinished = book.currentPage >= book.totalPages && book.totalPages > 0;
  const coverSrc = imgError ? '/book-placeholder.svg' : book.coverUrl || '/book-placeholder.svg';

  function handlePageChange(raw: string) {
    const page = Math.max(0, Math.min(book.totalPages, parseInt(raw) || 0));
    onUpdate({ ...book, currentPage: page, updatedAt: new Date().toISOString() });
  }

  function handleComplete() {
    onUpdate({
      ...book,
      status: 'completed',
      currentPage: book.totalPages,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleAddNote(text: string) {
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddNote(book.id, note);
  }

  return (
    <div
      className="flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(28,26,23,0.06)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(28,26,23,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 16px rgba(28,26,23,0.06)')}
    >
      {/* Cover + info */}
      <div className="flex">
        {/* Book cover with spine accent */}
        <div className="relative shrink-0">
          <img
            src={coverSrc}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-[88px] h-[128px] object-cover"
            style={{ background: 'var(--line-soft)', boxShadow: 'inset -3px 0 6px rgba(28,26,23,0.1)' }}
          />
          {/* Sun-colored spine rule */}
          <div className="absolute inset-y-0 right-0 w-[3px]" style={{ background: 'var(--sun)', opacity: 0.7 }} />
        </div>

        {/* Info panel */}
        <div className="flex-1 p-4 min-w-0">
          <h3
            className="font-display font-semibold leading-tight line-clamp-2 mb-0.5"
            style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.2 }}
          >
            {book.title}
          </h3>
          <p className="text-xs font-light mb-3" style={{ color: 'var(--muted)' }}>{book.author}</p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono-grow text-[9px]" style={{ color: 'var(--muted)' }}>page</span>
              <input
                type="number"
                min={0}
                max={book.totalPages}
                value={book.currentPage || ''}
                onChange={(e) => handlePageChange(e.target.value)}
                placeholder="0"
                className="w-14 text-sm font-medium rounded-lg px-2 py-1 focus:outline-none tabular-nums"
                style={{
                  background: 'var(--paper-2)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              />
              <span className="font-mono-grow text-[9px]" style={{ color: 'var(--line)' }}>/ {book.totalPages}</span>
            </div>
            <ProgressBar current={book.currentPage} total={book.totalPages} />
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid var(--line-soft)' }}
      >
        {/* Mark Completed — sun style when done, ghost otherwise */}
        {isFinished ? (
          <button
            onClick={handleComplete}
            className="flex-1 text-xs font-medium px-4 py-2 rounded-full transition-colors"
            style={{ background: 'var(--sun)', color: 'var(--ink)', border: '1px solid var(--sun)' }}
          >
            Mark complete →
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="flex-1 text-xs font-medium px-4 py-2 rounded-full transition-colors"
            style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid var(--line)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            Mark complete
          </button>
        )}

        {/* Notes toggle */}
        <button
          onClick={() => setNotesOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full transition-colors"
          style={{
            background: notesOpen ? 'var(--ink)' : 'transparent',
            color: notesOpen ? 'var(--paper)' : 'var(--muted)',
            border: `1px solid ${notesOpen ? 'var(--ink)' : 'var(--line)'}`,
          }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {book.notes.length > 0 ? (
            <span>{book.notes.length}</span>
          ) : (
            <span>Notes</span>
          )}
        </button>

        {/* Delete */}
        {confirmDelete ? (
          <div className="flex gap-1 items-center">
            <button
              onClick={() => onDelete(book.id)}
              className="font-mono-grow text-[8px] px-2 py-1.5 rounded-full"
              style={{ background: 'var(--clay)', color: 'var(--paper)' }}
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="font-mono-grow text-[8px] px-2 py-1.5 rounded-full"
              style={{ color: 'var(--muted)' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--line)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--clay)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--line)')}
            title="Remove"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Finished nudge */}
      {isFinished && (
        <div
          className="mx-4 mb-3 font-mono-grow text-[9px] px-3 py-2 rounded-lg"
          style={{ background: 'rgba(200,169,106,0.1)', color: 'var(--sun)', border: '1px solid rgba(200,169,106,0.25)' }}
        >
          You've reached the last page — ready to mark it complete.
        </div>
      )}

      {/* Notes panel */}
      {notesOpen && (
        <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
          <NotesPanel
            notes={book.notes}
            onAdd={handleAddNote}
            onUpdate={(note) => onUpdateNote(book.id, note)}
            onDelete={(noteId) => onDeleteNote(book.id, noteId)}
          />
        </div>
      )}
    </div>
  );
}
