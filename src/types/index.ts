export interface Note {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  currentPage: number;
  status: 'library' | 'reading' | 'completed';
  notes: Note[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isbn?: string;
}

export interface BookSuggestion {
  title: string;
  author: string;
  coverUrl: string;
  pageCount?: number;
  isbn?: string;
}
