interface Props {
  current: number;
  total: number;
  size?: 'sm' | 'md';
}

export function ProgressBar({ current, total, size = 'md' }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const h = size === 'sm' ? 'h-[3px]' : 'h-[5px]';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} rounded-full overflow-hidden`} style={{ background: 'var(--line-soft)' }}>
        <div
          className={`h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%`, background: 'var(--sun)' }}
        />
      </div>
      <span className="font-mono-grow text-[9px] w-8 text-right tabular-nums" style={{ color: 'var(--muted)' }}>
        {pct}%
      </span>
    </div>
  );
}
