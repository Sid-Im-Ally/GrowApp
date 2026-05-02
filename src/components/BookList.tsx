import { useState } from 'react';
import type { Book } from '../types';
import { ProgressBar } from './ProgressBar';

interface Props {
  books: Book[];
  onStartReading: (book: Book) => void;
  onDeleteBook: (id: string) => void;
}

/* Library icon — books on a shelf with a leaf on the leaning spine */
function LibraryIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* shelf */}
      <line x1="2.5" y1="20" x2="21.5" y2="20" />
      {/* left book — tall, straight */}
      <rect x="3" y="8" width="4" height="12" rx="0.5" />
      {/* middle book — shorter, slightly leaning, with leaf */}
      <path d="M9.5 20 L9.5 12 Q9.5 11 10.5 10.8 L13.5 10.5 Q14.5 10.3 14.5 11.3 L14.5 20" />
      {/* leaf on the leaning spine */}
      <path d="M12 10.6 C11 8.5 11.5 6.5 13 6 C13.5 7.5 13 9.5 12 10.6 Z" fill="currentColor" stroke="none" style={{ color: 'var(--sage)' }} />
      {/* right book — medium, straight */}
      <rect x="16" y="10" width="4" height="10" rx="0.5" />
    </svg>
  );
}

export function BookList({ books, onStartReading, onDeleteBook }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const libraryBooks = books.filter((b) => b.status === 'library');
  const readingBooks = books.filter((b) => b.status === 'reading');

  if (libraryBooks.length === 0 && readingBooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <LibraryIcon size={28} />
        <p className="font-mono-grow text-[9px] mt-4 leading-relaxed" style={{ color: 'rgba(122,116,104,0.6)' }}>
          Search above to add books to your library.
        </p>
      </div>
    );
  }

  const rowStyle = 'group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-default';

  return (
    <div className="space-y-5 py-2">
      {/* IN LIBRARY */}
      {libraryBooks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 px-3 mb-2">
            <span style={{ color: 'rgba(122,116,104,0.5)' }}><LibraryIcon size={12} /></span>
            <span className="font-mono-grow text-[9px]" style={{ color: 'rgba(122,116,104,0.5)' }}>
              In Library · {libraryBooks.length}
            </span>
          </div>
          <div className="space-y-px">
            {libraryBooks.map((book) => (
              <div
                key={book.id}
                className={rowStyle}
                style={{}}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <img
                  src={book.coverUrl || '/book-placeholder.svg'}
                  alt={book.title}
                  onError={(e) => ((e.target as HTMLImageElement).src = '/book-placeholder.svg')}
                  className="w-7 h-10 object-cover rounded shrink-0"
                  style={{ boxShadow: '1px 1px 4px rgba(0,0,0,0.3)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug line-clamp-1" style={{ color: 'rgba(244,240,232,0.8)' }}>
                    {book.title}
                  </p>
                  <p className="font-mono-grow text-[8px] mt-0.5 truncate" style={{ color: 'rgba(122,116,104,0.7)' }}>
                    {book.author}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {confirmId === book.id ? (
                    <>
                      <button
                        onClick={() => { onDeleteBook(book.id); setConfirmId(null); }}
                        className="font-mono-grow text-[8px] px-1.5 py-1 rounded transition-colors"
                        style={{ color: 'var(--clay)' }}
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="font-mono-grow text-[8px] px-1.5 py-1 rounded transition-colors"
                        style={{ color: 'rgba(122,116,104,0.6)' }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onStartReading(book)}
                        className="row-action font-mono-grow text-[8px] px-2 py-1 rounded-full transition-all"
                        style={{ background: 'rgba(200,169,106,0.15)', color: 'var(--sun)' }}
                        title="Start reading"
                        aria-label={`Start reading ${book.title}`}
                      >
                        Read →
                      </button>
                      <button
                        onClick={() => setConfirmId(book.id)}
                        className="row-action p-1 rounded transition-all"
                        style={{ color: 'rgba(122,116,104,0.5)' }}
                        title="Remove"
                        aria-label={`Remove ${book.title}`}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* NOW READING */}
      {readingBooks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 px-3 mb-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--sun)', opacity: 0.8 }} />
            <span className="font-mono-grow text-[9px]" style={{ color: 'rgba(122,116,104,0.5)' }}>
              Now Reading · {readingBooks.length}
            </span>
          </div>
          <div className="space-y-px">
            {readingBooks.map((book) => (
              <div
                key={book.id}
                className={rowStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <img
                  src={book.coverUrl || '/book-placeholder.svg'}
                  alt={book.title}
                  onError={(e) => ((e.target as HTMLImageElement).src = '/book-placeholder.svg')}
                  className="w-7 h-10 object-cover rounded shrink-0"
                  style={{ boxShadow: '1px 1px 4px rgba(0,0,0,0.3)' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug line-clamp-1" style={{ color: 'rgba(244,240,232,0.8)' }}>
                    {book.title}
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar current={book.currentPage} total={book.totalPages} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
