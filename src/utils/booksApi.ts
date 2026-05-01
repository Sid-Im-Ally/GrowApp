import type { BookSuggestion } from '../types';

const BASE = 'https://www.googleapis.com/books/v1/volumes';

export function normalizeGoogleBooksResult(item: any): BookSuggestion {
  const info = item.volumeInfo ?? {};
  const isbn = info.industryIdentifiers?.find(
    (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier;

  // Use HTTPS thumbnail to avoid mixed-content warnings; fall back to placeholder
  const rawThumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? '';
  const coverUrl = rawThumb.replace(/^http:\/\//, 'https://') || '/book-placeholder.svg';

  return {
    title: info.title ?? 'Unknown Title',
    author: info.authors?.join(', ') ?? 'Unknown Author',
    coverUrl,
    pageCount: info.pageCount ?? undefined,
    isbn,
  };
}

export async function searchBooks(query: string): Promise<BookSuggestion[]> {
  if (!query.trim()) return [];

  const url = `${BASE}?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);

  const data = await res.json();
  if (!data.items || data.totalItems === 0) return [];

  return data.items.map(normalizeGoogleBooksResult);
}
