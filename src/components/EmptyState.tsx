interface Props {
  icon?: string;
  message: string;
  subtext?: string;
}

export function EmptyState({ icon = '○', message, subtext }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center select-none">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl"
        style={{ background: 'var(--paper-3)', border: '1px solid var(--line-soft)', color: 'var(--muted)' }}
      >
        {icon}
      </div>
      <p className="font-display italic text-xl leading-snug" style={{ color: 'var(--muted)', fontWeight: 300 }}>
        {message}
      </p>
      {subtext && (
        <p className="font-mono-grow text-[10px] mt-3 max-w-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.6 }}>
          {subtext}
        </p>
      )}
    </div>
  );
}
