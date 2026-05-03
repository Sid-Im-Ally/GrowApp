import type { Book, ReadingGoal, ReadingSession } from '../types';

export type Pace = 'behind' | 'on_track' | 'ahead';

export interface RecommendationOption {
  startPage: number;
  endPage: number;
  pages: number;
  progressGain: number;
}

export interface Recommendation {
  pace: Pace;
  pagesPerMinute: number;
  weeklyTargetPages: number;
  pagesReadThisWeek: number;
  options: {
    lighter: RecommendationOption;
    best: RecommendationOption;
    stretch: RecommendationOption;
  };
}

export function startOfWeek(d: Date = new Date()): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  // Monday-based week (0=Sun in JS — shift to Mon=0)
  const day = (out.getDay() + 6) % 7;
  out.setDate(out.getDate() - day);
  return out;
}

export function daysIntoWeek(d: Date = new Date()): number {
  const start = startOfWeek(d).getTime();
  const elapsedMs = d.getTime() - start;
  return Math.min(7, Math.max(0, elapsedMs / (1000 * 60 * 60 * 24)));
}

export function pagesReadInRange(sessions: ReadingSession[], from: Date, to: Date): number {
  return sessions.reduce((sum, s) => {
    const t = new Date(s.date).getTime();
    if (t < from.getTime() || t >= to.getTime()) return sum;
    const pages = Math.max(0, s.actualEndPage - s.startPage + 1);
    return sum + pages;
  }, 0);
}

export function weeksUntil(targetIso: string, from: Date = new Date()): number {
  const target = new Date(targetIso);
  const ms = target.getTime() - from.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24 * 7));
}

export function deriveWeeklyTarget(book: Book, goal: ReadingGoal, now: Date = new Date()): number {
  const remaining = Math.max(0, book.totalPages - book.currentPage);
  if (goal.mode === 'pages_per_week') {
    return Math.max(1, goal.weeklyTargetPages ?? 0);
  }
  // finish_by_date
  if (!goal.targetDate) return Math.max(1, remaining);
  const weeks = Math.max(1 / 7, weeksUntil(goal.targetDate, now));
  return Math.max(1, Math.ceil(remaining / weeks));
}

function clampPages(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface RecommendInput {
  book: Book;
  goal: ReadingGoal;
  availableMinutes: number;
  now?: Date;
}

export function recommend({ book, goal, availableMinutes, now = new Date() }: RecommendInput): Recommendation {
  const pagesPerMinute = goal.pagesPerMinute > 0 ? goal.pagesPerMinute : 1;
  const weeklyTargetPages = deriveWeeklyTarget(book, goal, now);

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const pagesReadThisWeek = pagesReadInRange(goal.sessions, weekStart, weekEnd);

  const expectedByNow = weeklyTargetPages * (daysIntoWeek(now) / 7);
  const tolerance = Math.max(3, weeklyTargetPages * 0.15);
  let pace: Pace;
  if (pagesReadThisWeek < expectedByNow - tolerance) pace = 'behind';
  else if (pagesReadThisWeek > expectedByNow + tolerance) pace = 'ahead';
  else pace = 'on_track';

  const baselinePages = Math.max(1, Math.round(availableMinutes * pagesPerMinute));
  const startPage = Math.min(book.totalPages, book.currentPage + 1);

  const multipliers = {
    lighter: 0.65,
    best:    pace === 'behind' ? 1.15 : 1.0,
    stretch: pace === 'behind' ? 1.4  : pace === 'ahead' ? 1.15 : 1.25,
  } as const;

  function buildOption(mult: number): RecommendationOption {
    const targetPages = Math.max(1, Math.round(baselinePages * mult));
    const endPage = clampPages(startPage + targetPages - 1, startPage, book.totalPages);
    const pages = endPage - startPage + 1;
    const progressGain = weeklyTargetPages > 0 ? pages / weeklyTargetPages : 0;
    return { startPage, endPage, pages, progressGain };
  }

  return {
    pace,
    pagesPerMinute,
    weeklyTargetPages,
    pagesReadThisWeek,
    options: {
      lighter: buildOption(multipliers.lighter),
      best:    buildOption(multipliers.best),
      stretch: buildOption(multipliers.stretch),
    },
  };
}
