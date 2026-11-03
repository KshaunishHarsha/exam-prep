import { SUBJECTS, type Task } from '@/data/schedule'

interface Props {
  done: number
  total: number
  next: Task | null
  onTickNext: () => void
}

export function TodayBar({ done, total, next, onTickNext }: Props) {
  const complete = total > 0 && done === total
  const label = next ? `${SUBJECTS[next.subject].emoji} ${next.kind === 'exam' ? 'Exam' : (next.title.split(/ [—:] /).pop() ?? next.title)}` : ''
  return (
    <aside aria-label="Today's progress" className="pointer-events-none sticky bottom-0 z-20 px-3 pb-3 d:hidden">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-[18px] border border-line bg-bar py-2 pl-3.5 pr-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-[20px] backdrop-saturate-[1.8]">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="text-[13px] font-semibold tabular-nums">
            {done} of {total} done today
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-ring-track">
            <div
              className={`h-full rounded-full ${complete ? 'bg-green' : 'bg-accent'}`}
              style={{ width: `${total ? (done / total) * 100 : 0}%`, transition: 'width .6s cubic-bezier(.22,1,.36,1)' }}
            />
          </div>
        </div>
        {next && (
          <button
            type="button"
            onClick={onTickNext}
            aria-label={`Mark done: ${next.title}`}
            className="flex min-h-11 max-w-[56%] items-center gap-2 rounded-xl border-0 bg-accent-solid py-1.5 pl-[9px] pr-3 text-[13px] font-semibold text-white transition-transform active:scale-95"
          >
            <span aria-hidden className="box-border size-[17px] shrink-0 rounded-full border-[1.5px] border-white/90" />
            <span className="truncate whitespace-nowrap">{label}</span>
          </button>
        )}
        {complete && <div className="rounded-xl bg-green-tint px-3 py-[9px] text-[13px] font-semibold text-green-ink">Day done ✅</div>}
      </div>
    </aside>
  )
}
