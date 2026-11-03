interface Props {
  eyebrow: string
  chipEmoji: string
  chipText: string
  pct: number
  done: number
  total: number
  todayText: string
  allDone: boolean
}

export function Hero({ eyebrow, chipEmoji, chipText, pct, done, total, todayText, allDone }: Props) {
  return (
    <header className="flex flex-col items-stretch justify-between gap-6 d:flex-row d:items-end">
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink2">{eyebrow}</div>
        <h1 className="m-0 text-[28px] font-bold leading-[1.05] tracking-[-0.035em] text-balance d:text-[40px]">Exam Prep Tracker 📚</h1>
        <div className="text-sm tracking-[-0.01em] text-ink2 d:text-[15px]">Computer Engineering · 3–30 Nov 2026</div>
        <div className="mt-2 flex">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-tint py-[5px] pl-[9px] pr-[11px] text-[12.5px] font-semibold tracking-[-0.005em] text-orange-ink tabular-nums">
            <span aria-hidden>{chipEmoji}</span>
            <span>{chipText}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 rounded-[18px] border border-line bg-card px-4 py-[14px] shadow-card d:py-4 d:pl-4 d:pr-[22px]">
        <div className="relative size-16 shrink-0 d:size-[76px]" role="img" aria-label={`${pct} percent complete`}>
          <svg viewBox="0 0 120 120" width="100%" height="100%" className="block -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ring-track)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={allDone ? 'var(--green)' : 'var(--accent)'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="326.73"
              strokeDashoffset={326.73 * (1 - done / total)}
              style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,1,.36,1), stroke .4s' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[17px] font-bold tracking-[-0.03em] tabular-nums d:text-[19px]">
            {pct}
            <span className="ml-px text-[0.5em] font-bold text-ink2">%</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-xl font-bold leading-[1.1] tracking-[-0.025em] tabular-nums d:text-[22px]">
            {done} <span className="font-bold text-ink2">of {total}</span>
          </div>
          <div className="text-xs text-ink2">tasks done</div>
          <div className="mb-1 mt-1.5 h-px bg-line" />
          <div className="text-xs font-semibold tabular-nums">
            Today <span className="font-medium text-ink2">{todayText}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
