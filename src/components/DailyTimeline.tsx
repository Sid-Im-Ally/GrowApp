import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReadingSession } from '../types';

interface Props {
  sessions: ReadingSession[];
  /** Override "now" — only used in tests. */
  nowOverride?: Date;
}

const HOUR_START = 6;   // 6 AM
const HOUR_END = 23;    // 11 PM
const HOUR_PX = 56;
const TOP_PAD = 12;
const BOTTOM_PAD = 12;
const RAIL_WIDTH = 56;
const SPINE_X = 62;     // just past the rail
const TOTAL_H = (HOUR_END - HOUR_START) * HOUR_PX + TOP_PAD + BOTTOM_PAD;

function hourToY(h: number) {
  const clamped = Math.max(HOUR_START, Math.min(HOUR_END, h));
  return TOP_PAD + (clamped - HOUR_START) * HOUR_PX;
}

function dateToHours(d: Date) {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function hourLabel(h: number) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

/** Re-renders the component on a sub-minute cadence so the ember position tracks "now". */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

interface BlockProps {
  session: ReadingSession;
  now: Date;
}

function SessionBlock({ session, now }: BlockProps) {
  const start = new Date(session.startedAt);
  const end = new Date(session.date);
  if (end.getTime() < start.getTime()) return null;

  const startH = dateToHours(start);
  const endH = dateToHours(end);

  const top = hourToY(startH);
  const rawH = (Math.min(HOUR_END, endH) - Math.max(HOUR_START, startH)) * HOUR_PX - 4;
  const height = Math.max(22, rawH);

  const isPast = end.getTime() <= now.getTime();
  const pages = Math.max(0, session.actualEndPage - session.startPage + 1);

  const ashStyle: React.CSSProperties = isPast
    ? {
        background: '#e3dccb',
        color: 'rgba(28,26,23,0.55)',
        filter: 'saturate(0.5)',
      }
    : {};

  const tagColor = session.completed ? 'var(--sage)' : 'var(--clay)';
  const tagLabel = session.completed ? 'Read' : 'Partial';

  return (
    <div
      className="absolute transition-colors"
      style={{
        left: 76, right: 12,
        top: top + 2, height,
        background: 'var(--paper-2)',
        color: 'var(--ink)',
        borderRadius: 10,
        padding: '8px 12px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        border: '1px solid var(--line-soft)',
        ...ashStyle,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div
          className="font-display"
          style={{
            fontSize: height > 60 ? 18 : 15,
            lineHeight: 1.15,
            textDecoration: isPast ? 'line-through' : 'none',
            fontWeight: 500,
          }}
        >
          pp. {session.startPage}–{session.actualEndPage}
        </div>
        <div
          className="font-mono-grow"
          style={{
            fontSize: 8,
            color: tagColor,
            whiteSpace: 'nowrap',
            paddingTop: 2,
            opacity: isPast ? 0.6 : 1,
          }}
        >
          {tagLabel}
        </div>
      </div>
      {height > 44 && (
        <div className="font-mono-grow" style={{ fontSize: 9, opacity: 0.7 }}>
          {fmtTime(start)} — {fmtTime(end)} · {pages} {pages === 1 ? 'page' : 'pages'}
        </div>
      )}
    </div>
  );
}

export function DailyTimeline({ sessions, nowOverride }: Props) {
  const liveNow = useNow();
  const now = nowOverride ?? liveNow;
  const containerRef = useRef<HTMLDivElement>(null);

  const todaySessions = useMemo(
    () => sessions.filter((s) => isSameLocalDay(new Date(s.startedAt), now)),
    [sessions, now]
  );

  const nowHours = dateToHours(now);
  const burnY = hourToY(nowHours);
  const beforeRange = nowHours < HOUR_START;
  const afterRange = nowHours > HOUR_END;

  // Auto-scroll once on mount so the ember is roughly centered.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const target = Math.max(0, burnY - el.clientHeight / 2);
    el.scrollTop = target;
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = Math.max(0, HOUR_END - nowHours);
  const remH = Math.floor(remaining);
  const remM = Math.round((remaining - remH) * 60);

  return (
    <div className="space-y-3">
      {/* Day header */}
      <div className="flex items-baseline justify-between">
        <div>
          <p
            className="font-display"
            style={{ fontSize: 22, fontWeight: 400, color: 'var(--ink)', lineHeight: 1 }}
          >
            Today
          </p>
          <p className="font-mono-grow text-[8px] mt-1" style={{ color: 'var(--muted)' }}>
            {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-display tabular-nums"
            style={{ fontSize: 18, color: 'var(--ember)', lineHeight: 1 }}
          >
            {beforeRange ? '—' : afterRange ? '0h 00m' : `${remH}h ${String(remM).padStart(2, '0')}m`}
          </p>
          <p className="font-mono-grow text-[8px] mt-1" style={{ color: 'var(--ember)' }}>
            day burning
          </p>
        </div>
      </div>

      {/* Scrollable hour rail */}
      <div
        ref={containerRef}
        className="relative overflow-y-auto rounded-2xl"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line-soft)',
          height: 320,
        }}
      >
        <div
          className="relative"
          style={{
            height: TOTAL_H,
            ['--spineX' as string]: `${SPINE_X}px`,
            ['--burnPct' as string]: `${burnY}px`,
          }}
        >
          {/* Hour labels + ticks */}
          <div className="absolute left-0 top-0" style={{ width: RAIL_WIDTH, height: TOTAL_H }}>
            {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i).map((h) => {
              const y = hourToY(h);
              const past = h < nowHours;
              return (
                <div key={h}>
                  <div
                    className="absolute font-mono-grow"
                    style={{
                      top: y - 6, right: 8,
                      fontSize: 9,
                      color: past ? 'rgba(122,116,104,0.4)' : 'var(--muted)',
                      textDecoration: past ? 'line-through rgba(168,158,138,0.5)' : 'none',
                    }}
                  >
                    {hourLabel(h)}
                  </div>
                  <div
                    className="absolute"
                    style={{
                      left: RAIL_WIDTH, top: y,
                      width: 6, height: 1, background: 'var(--line)',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Session blocks (only past completed sessions) */}
          {todaySessions.map((s) => (
            <SessionBlock key={s.id} session={s} now={now} />
          ))}

          {/* Spine + burnt + ember + sparks + ash */}
          <div className="timeline-spine" />
          <div className="timeline-burnt" />
          <div className="ash-fleck a1" />
          <div className="ash-fleck a2" />
          <div className="ash-fleck a3" />
          <div className="spark s1" />
          <div className="spark s2" />
          <div className="spark s3" />
          <div className="spark s4" />
          <div className="spark s5" />
          <div className="ember" />
        </div>
      </div>

      {todaySessions.length === 0 && (
        <p
          className="font-display italic text-center"
          style={{ fontSize: 14, color: 'var(--muted)' }}
        >
          The day is unfinished. Read for any amount of time and it lands here.
        </p>
      )}
    </div>
  );
}
