import { useEffect, useMemo, useState } from 'react';
import type { Book, GoalMode, ReadingGoal, ReadingSession } from '../types';
import { DailyTimeline } from './DailyTimeline';
import { RecommendationPicker, type OptionKey } from './RecommendationPicker';
import { ExecutionMode } from './ExecutionMode';
import { deriveWeeklyTarget } from '../utils/recommend';
import { estimatePagesPerMinute } from '../utils/readingSpeed';
import type { RecommendationOption } from '../utils/recommend';

interface Props {
  book: Book;
  onClose: () => void;
  onUpdateBook: (book: Book) => void;
}

function todayPlusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function isoDateInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export function TrackingScreen({ book, onClose, onUpdateBook }: Props) {
  const goal: ReadingGoal | undefined = book.readingGoal;
  const [editingGoal, setEditingGoal] = useState(!goal);

  // Goal form state
  const [mode, setMode] = useState<GoalMode>(goal?.mode ?? 'finish_by_date');
  const [targetDate, setTargetDate] = useState<string>(
    isoDateInput(goal?.targetDate ?? todayPlusDaysIso(14))
  );
  const [weeklyPages, setWeeklyPages] = useState<string>(
    String(goal?.weeklyTargetPages ?? 100)
  );
  const [ppm, setPpm] = useState<string>(String(goal?.pagesPerMinute ?? 1));

  // Recommendation flow state
  const [availableMinutes, setAvailableMinutes] = useState<number>(20);
  const [selected, setSelected] = useState<{ key: OptionKey; option: RecommendationOption } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  function saveGoal() {
    const ppmNum = Math.max(0.1, parseFloat(ppm) || 1);
    const weeklyNum = Math.max(1, parseInt(weeklyPages) || 100);
    const next: ReadingGoal = {
      mode,
      targetDate: mode === 'finish_by_date' ? new Date(targetDate).toISOString() : undefined,
      weeklyTargetPages: mode === 'pages_per_week' ? weeklyNum : undefined,
      pagesPerMinute: ppmNum,
      startedAt: goal?.startedAt ?? new Date().toISOString(),
      sessions: goal?.sessions ?? [],
    };
    onUpdateBook({ ...book, readingGoal: next, updatedAt: new Date().toISOString() });
    setEditingGoal(false);
  }

  function handleComplete(actualEndPage: number, startedAtIso: string) {
    if (!selected || !goal) return;
    const session: ReadingSession = {
      id: crypto.randomUUID(),
      startedAt: startedAtIso,
      date: new Date().toISOString(),
      minutesAvailable: availableMinutes,
      startPage: selected.option.startPage,
      endPage: selected.option.endPage,
      actualEndPage,
      completed: actualEndPage >= selected.option.endPage,
    };
    const updatedSessions = [...goal.sessions, session];
    const updatedPpm = estimatePagesPerMinute(updatedSessions);
    const updatedGoal: ReadingGoal = {
      ...goal,
      pagesPerMinute: updatedPpm,
      sessions: updatedSessions,
    };
    const newCurrentPage = Math.max(book.currentPage, Math.min(book.totalPages, actualEndPage));
    onUpdateBook({
      ...book,
      currentPage: newCurrentPage,
      readingGoal: updatedGoal,
      updatedAt: new Date().toISOString(),
    });

    const weeklyTarget = deriveWeeklyTarget({ ...book, currentPage: newCurrentPage }, updatedGoal);
    const pagesRead = Math.max(0, actualEndPage - selected.option.startPage + 1);
    const gainPct = Math.round((pagesRead / Math.max(1, weeklyTarget)) * 100);
    setToast(
      session.completed
        ? `Nice. You moved ${gainPct}% closer to this week's goal.`
        : `Logged ${pagesRead} page${pagesRead !== 1 ? 's' : ''} (${gainPct}% of weekly goal).`
    );
    setSelected(null);
  }

  // Recompute the latest book + goal each render so the timeline updates after save.
  const liveGoal = book.readingGoal;
  const progressPct = book.totalPages > 0
    ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
    : 0;

  const summary = useMemo(() => {
    if (!liveGoal) return null;
    if (liveGoal.mode === 'finish_by_date' && liveGoal.targetDate) {
      const target = new Date(liveGoal.targetDate);
      return {
        primary: `Finish by ${target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        secondary: `${deriveWeeklyTarget(book, liveGoal)} pages/week pace`,
      };
    }
    return {
      primary: `${liveGoal.weeklyTargetPages ?? '—'} pages this week`,
      secondary: `${liveGoal.pagesPerMinute.toFixed(2)} ppm`,
    };
  }, [liveGoal, book]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(28,26,23,0.55)' }}
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          maxHeight: '92dvh',
        }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 shrink-0"
          style={{ borderBottom: '1px solid var(--line-soft)' }}
        >
          <img
            src={book.coverUrl || '/book-placeholder.svg'}
            alt={book.title}
            onError={(e) => ((e.target as HTMLImageElement).src = '/book-placeholder.svg')}
            className="w-10 h-14 object-cover rounded shrink-0"
            style={{ background: 'var(--line-soft)', boxShadow: '1px 1px 4px rgba(0,0,0,0.15)' }}
          />
          <div className="flex-1 min-w-0">
            <h2
              className="font-display leading-tight line-clamp-1"
              style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}
            >
              {book.title}
            </h2>
            <p className="font-mono-grow text-[8px] mt-0.5" style={{ color: 'var(--muted)' }}>
              p. {book.currentPage} / {book.totalPages} · {progressPct}%
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ background: 'var(--paper-2)', color: 'var(--muted)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 sm:py-5 space-y-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          {/* Toast */}
          {toast && (
            <div
              className="rounded-xl px-4 py-3 font-mono-grow text-[10px]"
              style={{
                background: 'rgba(107,122,90,0.12)',
                color: 'var(--sage)',
                border: '1px solid rgba(107,122,90,0.3)',
              }}
            >
              {toast}
            </div>
          )}

          {/* Execution mode takes over the body when active */}
          {selected ? (
            <ExecutionMode
              book={book}
              option={selected.option}
              availableMinutes={availableMinutes}
              onComplete={handleComplete}
              onCancel={() => setSelected(null)}
            />
          ) : (
            <>
              {/* Goal section */}
              <section>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-mono-grow text-[9px]" style={{ color: 'var(--muted)' }}>
                    Goal
                  </h3>
                  {liveGoal && !editingGoal && (
                    <button
                      onClick={() => setEditingGoal(true)}
                      className="font-mono-grow text-[8px] transition-colors"
                      style={{ color: 'var(--muted)' }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingGoal ? (
                  <div
                    className="rounded-2xl p-4 space-y-4"
                    style={{ background: 'var(--paper-3)', border: '1px solid var(--line-soft)' }}
                  >
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                      {(['finish_by_date', 'pages_per_week'] as GoalMode[]).map((m) => {
                        const active = mode === m;
                        return (
                          <button
                            key={m}
                            onClick={() => setMode(m)}
                            className="flex-1 font-mono-grow text-[9px] py-2 rounded-full transition-colors"
                            style={{
                              background: active ? 'var(--ink)' : 'transparent',
                              color: active ? 'var(--paper)' : 'var(--muted)',
                              border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
                            }}
                          >
                            {m === 'finish_by_date' ? 'Finish by date' : 'Pages per week'}
                          </button>
                        );
                      })}
                    </div>

                    {mode === 'finish_by_date' ? (
                      <label className="block">
                        <span className="font-mono-grow text-[8px]" style={{ color: 'var(--muted)' }}>
                          Target completion date
                        </span>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="mt-1 w-full rounded-lg px-3 py-2 focus:outline-none"
                          style={{
                            background: 'var(--paper)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                          }}
                        />
                      </label>
                    ) : (
                      <label className="block">
                        <span className="font-mono-grow text-[8px]" style={{ color: 'var(--muted)' }}>
                          Pages per week
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={weeklyPages}
                          onChange={(e) => setWeeklyPages(e.target.value)}
                          className="mt-1 w-full rounded-lg px-3 py-2 focus:outline-none tabular-nums"
                          style={{
                            background: 'var(--paper)',
                            border: '1px solid var(--line)',
                            color: 'var(--ink)',
                          }}
                        />
                      </label>
                    )}

                    <label className="block">
                      <span className="font-mono-grow text-[8px]" style={{ color: 'var(--muted)' }}>
                        Reading speed · pages per minute (auto-learned)
                      </span>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={ppm}
                        onChange={(e) => setPpm(e.target.value)}
                        className="mt-1 w-full rounded-lg px-3 py-2 focus:outline-none tabular-nums"
                        style={{
                          background: 'var(--paper)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                        }}
                      />
                    </label>

                    <div className="flex gap-2">
                      <button
                        onClick={saveGoal}
                        className="flex-1 font-mono-grow text-[9px] py-2.5 rounded-full transition-colors"
                        style={{ background: 'var(--ink)', color: 'var(--paper)' }}
                      >
                        Save goal
                      </button>
                      {liveGoal && (
                        <button
                          onClick={() => setEditingGoal(false)}
                          className="font-mono-grow text-[9px] px-4 py-2.5 transition-colors"
                          style={{ color: 'var(--muted)' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : summary ? (
                  <div
                    className="rounded-2xl p-4 flex items-baseline justify-between"
                    style={{ background: 'var(--paper-3)', border: '1px solid var(--line-soft)' }}
                  >
                    <div>
                      <p className="font-display" style={{ fontSize: 18, color: 'var(--ink)' }}>
                        {summary.primary}
                      </p>
                      <p className="font-mono-grow text-[8px] mt-1" style={{ color: 'var(--muted)' }}>
                        {summary.secondary}
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Today's timeline */}
              {liveGoal && (
                <section>
                  <DailyTimeline sessions={liveGoal.sessions} />
                </section>
              )}

              {/* Recommendation picker */}
              {liveGoal ? (
                <section>
                  <RecommendationPicker
                    book={book}
                    goal={liveGoal}
                    availableMinutes={availableMinutes}
                    onMinutesChange={setAvailableMinutes}
                    onPick={(key, option) => setSelected({ key, option })}
                  />
                </section>
              ) : (
                <p
                  className="font-display italic text-center py-4"
                  style={{ fontSize: 16, color: 'var(--muted)' }}
                >
                  Set a goal above to start getting reading recommendations.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
