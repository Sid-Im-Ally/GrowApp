import type { Book } from '../types';

interface Props {
  books: Book[];
  onClose: () => void;
  onMoveToReading: (book: Book) => void;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/* Completed icon — closed ensō circle with a calm check */
function CompletedIcon({ size = 20, color = 'var(--sage)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5 L11 15 L15.5 9" />
    </svg>
  );
}

export function CompletedBooksDrawer({ books, onClose, onMoveToReading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(28,26,23,0.5)' }} onClick={onClose} />

      <div
        className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden max-h-[85vh]"
        style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--line-soft)' }}
        >
          <div className="flex items-center gap-3">
            <CompletedIcon size={22} />
            <div>
              <h2
                className="font-display italic"
                style={{ fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}
              >
                Finished Books
              </h2>
              <p className="font-mono-grow text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
                {books.length === 0 ? 'circle not yet closed' : `${books.length} book${books.length !== 1 ? 's' : ''} complete`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--paper-2)', color: 'var(--muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--line-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-4">
          {books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CompletedIcon size={40} color="var(--line)" />
              <p className="font-display italic mt-5" style={{ fontSize: 20, color: 'var(--muted)', fontWeight: 300 }}>
                No finished books yet.
              </p>
              <p className="font-mono-grow text-[9px] mt-2" style={{ color: 'var(--muted)', opacity: 0.6 }}>
                Finish reading a book and it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 rounded-xl group transition-colors"
                  style={{ border: '1px solid var(--line-soft)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="relative shrink-0">
                    <img
                      src={book.coverUrl || '/book-placeholder.svg'}
                      alt={book.title}
                      onError={(e) => ((e.target as HTMLImageElement).src = '/book-placeholder.svg')}
                      className="w-10 h-[56px] object-cover rounded-md"
                      style={{ background: 'var(--line-soft)' }}
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--sage)' }}
                    >
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-medium leading-snug line-clamp-1" style={{ color: 'var(--ink)' }}>
                      {book.title}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>{book.author}</p>
                    {book.completedAt && (
                      <p className="font-mono-grow text-[8px] mt-1" style={{ color: 'var(--sage)' }}>
                        Finished {formatDate(book.completedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onMoveToReading(book)}
                    className="opacity-0 group-hover:opacity-100 font-mono-grow text-[8px] px-3 py-1.5 rounded-full transition-all"
                    style={{ border: '1px solid var(--line)', color: 'var(--muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--sun)'; e.currentTarget.style.color = 'var(--sun)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--muted)'; }}
                  >
                    Re-read
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
