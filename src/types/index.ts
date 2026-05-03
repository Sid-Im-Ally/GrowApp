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
  readingGoal?: ReadingGoal;
}

export type GoalMode = 'finish_by_date' | 'pages_per_week';

export interface ReadingSession {
  id: string;
  startedAt: string;
  date: string;
  minutesAvailable: number;
  startPage: number;
  endPage: number;
  actualEndPage: number;
  completed: boolean;
}

export interface ReadingGoal {
  mode: GoalMode;
  targetDate?: string;
  weeklyTargetPages?: number;
  pagesPerMinute: number;
  startedAt: string;
  sessions: ReadingSession[];
}

export interface BookSuggestion {
  title: string;
  author: string;
  coverUrl: string;
  pageCount?: number;
  isbn?: string;
}
