import { SUBJECTS, type Day, type Task } from '@/data/schedule'
import { dayOfMonth, weekdayLong, weekdayShort, type DayInfo } from '@/lib/dates'
import { KIND_TAG, taskTime } from '@/lib/format'
import { Confetti } from '@/components/Confetti'

interface Pill {
  text: string
  cls: string
}

function pillFor(info: DayInfo, beforeStart: boolean): Pill | null {
  if (info.complete) return { text: 'Done ✅', cls: 'bg-green-tint text-green-ink' }
  if (info.isFocus) return beforeStart ? { text: 'Next up', cls: 'bg-accent-solid text-white' } : { text: 'Today', cls: 'bg-accent-solid text-white' }
  if (info.status === 'behind') return { text: 'Behind ⚠️', cls: 'bg-amber-tint text-amber-ink' }
  if (info.hasExam) return { text: 'Exam day', cls: 'bg-orange-tint text-orange-ink' }
  return null
}

function TaskRow({ task, checked, onChange }: { task: Task; checked: boolean; onChange: (checked: boolean) => void }) {
  const exam = task.kind === 'exam'
  const tag = KIND_TAG[task.kind]
  const ring = exam ? 'var(--orange)' : 'var(--green)'
  return (
    <label
      className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[11px] py-2 pl-1.5 pr-2.5 transition-colors duration-200 ${exam ? 'bg-orange-tint' : 'hover:bg-hover'}`}
    >
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className="relative box-border flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background,border-color,transform] duration-[250ms,250ms,450ms] ease-[var(--ease-spring)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
        style={{
          borderColor: checked ? ring : exam ? 'var(--orange)' : 'var(--ink3)',
          background: checked ? ring : 'transparent',
          transform: checked ? 'scale(1)' : 'scale(0.94)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          style={{ transform: checked ? 'scale(1)' : 'scale(0.2)', opacity: checked ? 1 : 0, transition: 'transform .45s cubic-bezier(.34,1.8,.64,1), opacity .15s' }}
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex flex-wrap items-center gap-[7px]">
          <span className={`whitespace-nowrap rounded-[5px] px-1.5 py-px text-[10.5px] font-semibold tracking-[0.01em] ${tag.cls}`}>{tag.label}</span>
          <span
            className={`text-sm font-medium tracking-[-0.01em] transition-colors duration-[250ms] ${checked ? 'text-ink2 line-through decoration-ink3b' : 'text-ink'}`}
          >
            <span aria-hidden>{SUBJECTS[task.subject].emoji} </span>
            {task.title}
          </span>
        </span>
        {task.detail && <span className="truncate text-[12.5px] text-ink2">{task.detail}</span>}
      </span>
      <span className={`shrink-0 whitespace-nowrap text-right text-xs tabular-nums ${exam ? 'font-bold text-orange-ink' : 'font-medium text-ink2'}`}>{taskTime(task)}</span>
    </label>
  )
}

interface Props {
  day: Day
  info: DayInfo
  beforeStart: boolean
  expanded: boolean
  burst: boolean
  isChecked: (id: string) => boolean
  onToggleExpanded: () => void
  onCheck: (task: Task, checked: boolean) => void
}

export function DayCard({ day, info, beforeStart, expanded, burst, isChecked, onToggleExpanded, onCheck }: Props) {
  const pill = pillFor(info, beforeStart)
  const num = dayOfMonth(day.date)
  const interactive = info.complete || !expanded
  const numColor = info.complete ? 'text-ink3b' : info.isFocus ? 'text-accent' : 'text-ink'
  const pillEl = pill && (
    <div
      className={`whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold ${pill.cls}`}
      style={{ animation: burst ? 'ept-pop .5s cubic-bezier(.34,1.56,.64,1)' : undefined }}
    >
      {pill.text}
    </div>
  )
  const head = (
    <>
      <div className="flex items-center gap-3 d:hidden">
        <div className={`min-w-8 text-2xl font-bold leading-none tracking-[-0.035em] tabular-nums ${numColor}`}>{num}</div>
        <div className="flex min-w-0 flex-1 flex-col gap-px text-left">
          <div className="text-sm font-semibold tracking-[-0.01em]">{info.isFocus && !beforeStart ? `Today · ${weekdayShort(day.date)}` : weekdayLong(day.date)}</div>
          <div className="text-xs tabular-nums text-ink2">
            Nov · {info.doneCount}/{info.total} done
          </div>
        </div>
        {pillEl}
      </div>
      <div className="hidden w-[88px] shrink-0 flex-col items-start gap-1 pt-1 text-left d:flex">
        <div className={`text-[32px] font-bold leading-none tracking-[-0.04em] tabular-nums ${numColor}`}>{num}</div>
        <div className="text-xs font-medium text-ink2">{weekdayShort(day.date)} · Nov</div>
        {pillEl && <div className="mt-1.5">{pillEl}</div>}
      </div>
    </>
  )

  const summary = [...new Set(day.tasks.map((t) => SUBJECTS[t.subject].emoji))].join(' ')
  return (
    <section
      id={`day-${day.date}`}
      aria-label={`${weekdayLong(day.date)} ${num} November`}
      className={`relative flex scroll-mt-4 flex-col gap-1.5 rounded-day border border-line py-3 pl-3 pr-2 transition-[box-shadow,background] duration-300 d:flex-row d:gap-4 d:pb-3 d:pl-5 d:pr-3.5 d:pt-4 ${info.complete && !info.isFocus ? 'bg-done-bg shadow-none' : 'bg-card'} ${info.isFocus ? 'shadow-[0_0_0_1.5px_var(--accent),0_6px_20px_var(--accent-glow)]' : info.complete ? '' : 'shadow-card'}`}
    >
      {burst && <Confetti className="left-9 top-[30px] d:left-[60px] d:top-11" />}
      {interactive ? (
        <button type="button" onClick={onToggleExpanded} aria-expanded={expanded} className="flex cursor-pointer flex-col border-0 bg-transparent p-0 text-left text-inherit d:flex-row">
          {head}
        </button>
      ) : (
        <div className="flex flex-col d:flex-row">{head}</div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {!expanded ? (
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex min-h-[38px] w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] border-0 bg-card2 px-3 py-2 text-left text-[13px] font-medium text-ink2"
          >
            <span>
              {day.tasks.length === 1 ? 'Done · 1 task' : `All ${day.tasks.length} tasks done`} · <span aria-hidden>{summary}</span>
            </span>
            <span className="text-xs font-semibold text-accent-ink">Show</span>
          </button>
        ) : (
          <>
            {day.tasks.map((t) => (
              <TaskRow key={t.id} task={t} checked={isChecked(t.id)} onChange={(c) => onCheck(t, c)} />
            ))}
            {day.note && <div className="mt-1 rounded-[10px] bg-card2 px-3 py-2 text-[12.5px] text-ink2 text-pretty">{day.note}</div>}
          </>
        )}
      </div>
    </section>
  )
}
