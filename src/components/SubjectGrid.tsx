import { SUBJECTS, SUBJECT_ORDER, type Subject } from '@/data/schedule'

export function SubjectGrid({ stats }: { stats: Record<Subject, { done: number; total: number }> }) {
  return (
    <section aria-labelledby="subjects-h" className="flex flex-col gap-2.5">
      <h2 id="subjects-h" className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-ink2">
        Subjects
      </h2>
      <div className="grid grid-cols-2 gap-2 d:grid-cols-3 d:gap-2.5">
        {SUBJECT_ORDER.map((k) => {
          const { done, total } = stats[k]
          const full = done === total
          return (
            <div key={k} className="flex min-w-0 flex-col gap-2 rounded-card border border-line bg-card p-3 shadow-card d:px-4 d:py-[14px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex size-[30px] items-center justify-center rounded-[9px] bg-card2 text-[17px] leading-none d:text-lg" aria-hidden>
                  {SUBJECTS[k].emoji}
                </div>
                <div className={`text-xs font-semibold tabular-nums ${full ? 'text-green-ink' : 'text-ink2'}`}>
                  {done}/{total}
                </div>
              </div>
              <div className="min-h-[2.5em] text-[13px] font-semibold leading-tight tracking-[-0.01em] text-pretty d:text-sm">{SUBJECTS[k].name}</div>
              <div
                role="progressbar"
                aria-label={`${SUBJECTS[k].name} progress`}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={done}
                className="h-[3px] overflow-hidden rounded-full bg-ring-track"
              >
                <div
                  className={`h-full rounded-full ${full ? 'bg-green' : 'bg-accent'}`}
                  style={{ width: `${(done / total) * 100}%`, transition: 'width .7s cubic-bezier(.22,1,.36,1), background .3s' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
