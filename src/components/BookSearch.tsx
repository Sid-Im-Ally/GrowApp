import { useState, useEffect, useRef } from 'react';
import type { BookSuggestion } from '../types';
import { searchBooks } from '../utils/booksApi';
import { useDebounce } from '../hooks/useDebounce';

interface Props {
  onBookSelect: (suggestion: BookSuggestion) => void;
  variant?: 'dark';
}

export function BookSearch({ onBookSelect, variant }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);
  const dark = variant === 'dark';

  useEffect(() => {
    if (!debouncedQuery.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    setError('');
    searchBooks(debouncedQuery)
      .then((results) => { setSuggestions(results); setOpen(true); })
      .catch(() => { setError('Could not reach Google Books.'); setSuggestions([]); })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function handleSelect(s: BookSuggestion) {
    onBookSelect(s);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
  }

  const inputBg = dark ? 'rgba(255,255,255,0.06)' : 'var(--paper)';
  const inputBorder = dark ? 'rgba(255,255,255,0.1)' : 'var(--line)';
  const inputText = dark ? 'rgba(244,240,232,0.85)' : 'var(--ink)';
  const placeholderStyle = dark ? 'rgba(122,116,104,0.7)' : 'var(--muted)';

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all"
        style={{ background: inputBg, border: `1px solid ${inputBorder}` }}
      >
        <svg className="w-3.5 h-3.5 shrink-0" style={{ color: dark ? 'rgba(122,116,104,0.8)' : 'var(--muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
          style={{ color: inputText }}
          placeholder="Search books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {loading && (
          <div
            className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin shrink-0"
            style={{ borderColor: 'var(--sun)', borderTopColor: 'transparent' }}
          />
        )}
      </div>

      {/* css placeholder color — injected as a style tag approach via inline style hack */}
      <style>{`input::placeholder { color: ${placeholderStyle}; }`}</style>

      {error && (
        <p className="font-mono-grow text-[9px] mt-1 px-1" style={{ color: 'var(--clay)' }}>{error}</p>
      )}

      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl shadow-2xl overflow-hidden"
          style={{
            background: dark ? '#1c1a17' : 'var(--paper)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'var(--line)'}`,
          }}
        >
          {suggestions.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>
              No results for "{debouncedQuery}"
            </p>
          )}
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'var(--line-soft)'}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'var(--paper-3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <img
                src={s.coverUrl || '/book-placeholder.svg'}
                alt={s.title}
                onError={(e) => ((e.target as HTMLImageElement).src = '/book-placeholder.svg')}
                className="w-8 h-11 object-cover rounded-md shrink-0"
                style={{ background: dark ? '#2a2620' : 'var(--line-soft)' }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: dark ? 'rgba(244,240,232,0.9)' : 'var(--ink)' }}>
                  {s.title}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>{s.author}</p>
                {s.pageCount && (
                  <p className="font-mono-grow text-[9px] mt-0.5" style={{ color: dark ? 'rgba(122,116,104,0.8)' : 'var(--muted)' }}>
                    {s.pageCount} pages
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
