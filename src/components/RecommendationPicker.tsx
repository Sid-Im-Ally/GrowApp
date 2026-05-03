import { useMemo } from 'react';
import type { Book, ReadingGoal } from '../types';
import { recommend, type Recommendation, type RecommendationOption } from '../utils/recommend';

export type OptionKey = 'lighter' | 'best' | 'stretch';

interface Props {
  book: Book;
  goal: ReadingGoal;
  availableMinutes: number;
  onMinutesChange: (minutes: number) => void;
  onPick: (key: OptionKey, option: RecommendationOption) => void;
}

const OPTION_META: Record<OptionKey, { label: string; sub: string }> = {
  lighter: { label: 'Lighter', sub: 'Easy win' },
  best:    { label: 'Best',    sub: 'Right for now' },
  stretch: { label: 'Stretch', sub: 'Push a little' },
};

export function RecommendationPicker({ book, goal, availableMinutes, onMinutesChange, onPick }: Props) {
  const rec: Recommendation = useMemo(
    () => recommend({ book, goal, availableMinutes }),
    [book, goal, availableMinutes]
  );

  const remaining = Math.max(0, book.totalPages - book.currentPage);

  const paceCopy =
    rec.pace === 'behind'
      ? 'Slightly behind this week — bumping recommendations up.'
      : rec.pace === 'ahead'
      ? "Ahead of pace — keep it light if you'd like."
      : 'On pace for this week.';

  const paceColor =
    rec.pace === 'behind' ? 'var(--ember)' : rec.pace === 'ahead' ? 'var(--sage)' : 'var(--muted)';

  return (
    <div className="space-y-4">
      {/* Headline input */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}
      >
        <p
          className="font-display"
          style={{ fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1.15 }}
        >
          I have
          <input
            type="number"
            min={1}
            max={480}
            value={availableMinutes || ''}
            onChange={(e) => onMinutesChange(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="20"
            aria-label="Available minutes"
            className="mx-2 w-20 text-center rounded-lg focus:outline-none tabular-nums"
            style={{
              fontFamily: 'inherit',
              fontSize: 22,
              padding: '2px 8px',
              background: 'var(--paper-2)',
              border: '1px solid var(--line)',
              color: 'var(--ember)',
            }}
          />
          minutes right now.
        </p>
        <p className="font-mono-grow text-[9px] mt-3" style={{ color: paceColor }}>
          {paceCopy}
        </p>
      </div>

      {/* Three option cards */}
      {availableMinutes > 0 && remaining > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(OPTION_META) as OptionKey[]).map((key) => {
            const opt = rec.options[key];
            const meta = OPTION_META[key];
            const isBest = key === 'best';
            const finishesBook = opt.endPage >= book.totalPages;
            return (
              <button
                key={key}
                onClick={() => onPick(key, opt)}
                className="text-left rounded-xl p-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: isBest ? 'var(--ink)' : 'var(--paper)',
                  color: isBest ? 'var(--paper)' : 'var(--ink)',
                  border: `1px solid ${isBest ? 'var(--ink)' : 'var(--line)'}`,
                  boxShadow: isBest ? '0 8px 22px rgba(28,26,23,0.18)' : '0 1px 0 rgba(28,26,23,0.04)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="font-mono-grow text-[8px]"
                    style={{ color: isBest ? 'var(--sun)' : 'var(--muted)' }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="font-mono-grow text-[8px]"
                    style={{ color: isBest ? 'rgba(244,240,232,0.55)' : 'var(--muted)', opacity: 0.7 }}
                  >
                    {meta.sub}
                  </span>
                </div>
                <p
                  className="font-display"
                  style={{ fontSize: 20, lineHeight: 1.1, fontWeight: 500 }}
                >
                  pp. {opt.startPage}–{opt.endPage}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: isBest ? 'rgba(244,240,232,0.7)' : 'var(--muted)' }}
                >
                  {opt.pages} page{opt.pages !== 1 ? 's' : ''} · {Math.round(opt.progressGain * 100)}% of weekly goal
                </p>
                {finishesBook && (
                  <p
                    className="font-mono-grow text-[8px] mt-2"
                    style={{ color: isBest ? 'var(--sun)' : 'var(--sage)' }}
                  >
                    Finishes the book ✦
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {availableMinutes > 0 && remaining === 0 && (
        <p
          className="font-display italic text-center py-6"
          style={{ fontSize: 18, color: 'var(--muted)' }}
        >
          You're already on the last page — mark this book complete on its card.
        </p>
      )}
    </div>
  );
}
