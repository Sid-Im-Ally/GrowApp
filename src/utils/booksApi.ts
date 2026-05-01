import type { BookSuggestion } from '../types';

const GOOGLE_BASE = 'https://www.googleapis.com/books/v1/volumes';
const OL_BASE = 'https://openlibrary.org/search.json';

function normalizeGoogleResult(item: any): BookSuggestion {
  const info = item.volumeInfo ?? {};
  const isbn = info.industryIdentifiers?.find(
    (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
  )?.identifier;
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

function normalizeOpenLibraryResult(doc: any): BookSuggestion {
  const coverId = doc.cover_i;
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : '/book-placeholder.svg';
  const isbn = doc.isbn?.[0];
  return {
    title: doc.title ?? 'Unknown Title',
    author: doc.author_name?.join(', ') ?? 'Unknown Author',
    coverUrl,
    pageCount: doc.number_of_pages_median ?? undefined,
    isbn,
  };
}

async function searchGoogleBooks(query: string): Promise<BookSuggestion[]> {
  const url = `${GOOGLE_BASE}?q=${encodeURIComponent(query)}&maxResults=8&printType=books`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Books API error: ${res.status}`);
  const data = await res.json();
  if (!data.items || data.totalItems === 0) return [];
  return data.items.map(normalizeGoogleResult);
}

async function searchOpenLibrary(query: string): Promise<BookSuggestion[]> {
  const url = `${OL_BASE}?title=${encodeURIComponent(query)}&limit=8&fields=title,author_name,isbn,number_of_pages_median,cover_i`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Library API error: ${res.status}`);
  const data = await res.json();
  if (!data.docs?.length) return [];
  return data.docs.map(normalizeOpenLibraryResult);
}

export async function searchBooks(query: string): Promise<BookSuggestion[]> {
  if (!query.trim()) return [];
  try {
    return await searchGoogleBooks(query);
  } catch {
    return await searchOpenLibrary(query);
  }
}
