import { useEffect, useRef, useState } from 'react';
import type { Book } from '../types';
import type { RecommendationOption } from '../utils/recommend';

interface Props {
  book: Book;
  option: RecommendationOption;
  availableMinutes: number;
  onComplete: (actualEndPage: number, startedAtIso: string) => void;
  onCancel: () => void;
}

function formatMMSS(secs: number) {
  const m = Math.max(0, Math.floor(secs / 60));
  const s = Math.max(0, secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExecutionMode({ book, option, availableMinutes, onComplete, onCancel }: Props) {
  const totalSecs = availableMinutes * 60;
  const [secsLeft, setSecsLeft] = useState(totalSecs);
  const [didntFinishOpen, setDidntFinishOpen] = useState(false);
  const [actualPage, setActualPage] = useState<string>(String(option.endPage));
  const startedAtRef = useRef<number>(Date.now());
  const startedAtIsoRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setSecsLeft(Math.max(0, totalSecs - elapsed));
    }, 1000);
    return () => clearInterval(id);
  }, [totalSecs]);

  const elapsedRatio = totalSecs > 0 ? 1 - secsLeft / totalSecs : 0;

  function handleMarkComplete() {
    onComplete(option.endPage, startedAtIsoRef.current);
  }

  function handleSubmitDidntFinish() {
    const parsed = parseInt(actualPage);
    if (isNaN(parsed)) return;
    const clamped = Math.max(option.startPage - 1, Math.min(book.totalPages, parsed));
    onComplete(clamped, startedAtIsoRef.current);
  }

  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'var(--ink)',
        color: 'var(--paper)',
        boxShadow: '0 24px 60px rgba(28,26,23,0.35)',
      }}
    >
      <p
        className="font-mono-grow text-[9px] mb-3"
        style={{ color: 'var(--sun)' }}
      >
        Reading session · in progress
      </p>

      {/* Countdown */}
      <p
        className="font-display tabular-nums"
        style={{
          fontSize: 56,
          lineHeight: 1,
          fontWeight: 400,
          color: 'var(--ember-hot)',
          textShadow: '0 0 24px rgba(224,138,60,0.35)',
        }}
      >
        {formatMMSS(secsLeft)}
      </p>

      <p
        className="font-mono-grow text-[8px] mt-2"
        style={{ color: 'rgba(244,240,232,0.5)' }}
      >
        {Math.round(elapsedRatio * 100)}% of session elapsed
      </p>

      {/* Page range */}
      <div className="mt-6">
        <p
          className="font-display italic"
          style={{ fontSize: 22, color: 'var(--paper)', lineHeight: 1.2 }}
        >
          Read pages {option.startPage}–{option.endPage}
        </p>
        <p
          className="text-xs mt-1.5"
          style={{ color: 'rgba(244,240,232,0.55)' }}
        >
          {book.title} · {option.pages} page{option.pages !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      {!didntFinishOpen ? (
        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleMarkComplete}
            className="flex-1 font-mono-grow text-[9px] py-3 rounded-full transition-colors"
            style={{ background: 'var(--sun)', color: 'var(--ink)' }}
          >
            Mark complete →
          </button>
          <button
            onClick={() => setDidntFinishOpen(true)}
            className="flex-1 font-mono-grow text-[9px] py-3 rounded-full transition-colors"
            style={{ background: 'transparent', color: 'rgba(244,240,232,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            Didn't finish
          </button>
          <button
            onClick={onCancel}
            className="font-mono-grow text-[9px] px-4 py-3 rounded-full transition-colors"
            style={{ color: 'rgba(244,240,232,0.45)' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-xs" style={{ color: 'rgba(244,240,232,0.7)' }}>
            What page did you reach?
          </p>
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              min={option.startPage - 1}
              max={book.totalPages}
              value={actualPage}
              onChange={(e) => setActualPage(e.target.value)}
              autoFocus
              className="w-24 text-center text-lg font-medium tabular-nums rounded-lg px-3 py-2 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--paper)',
              }}
            />
            <button
              onClick={handleSubmitDidntFinish}
              className="font-mono-grow text-[9px] px-4 py-2.5 rounded-full transition-colors"
              style={{ background: 'var(--sun)', color: 'var(--ink)' }}
            >
              Save
            </button>
            <button
              onClick={() => setDidntFinishOpen(false)}
              className="font-mono-grow text-[9px] px-3 py-2.5 transition-colors"
              style={{ color: 'rgba(244,240,232,0.5)' }}
            >
              ✕
            </button>
          </div>
          <p
            className="font-mono-grow text-[8px]"
            style={{ color: 'rgba(244,240,232,0.4)' }}
          >
            Range was {option.startPage}–{option.endPage}
          </p>
        </div>
      )}
    </div>
  );
}
