'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SCHEDULE, SUBJECTS, type Task } from '@/data/schedule'
import { dayInfo, diffDays, focusDate, longDate, nextExam, phase } from '@/lib/dates'
import { useProgress, useToday } from '@/lib/hooks'
import { overall, perSubject } from '@/lib/progress'
import type { SyncStatus } from '@/lib/sync'
import { Confetti } from '@/components/Confetti'
import { DayCard } from '@/components/DayCard'
import { Hero } from '@/components/Hero'
import { ResetSheet } from '@/components/ResetSheet'
import { SubjectGrid } from '@/components/SubjectGrid'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TodayBar } from '@/components/TodayBar'

type Filter = 'today' | 'upcoming' | 'all'
const FILTERS: [Filter, string][] = [
  ['today', 'Today'],
  ['upcoming', 'Upcoming'],
  ['all', 'All'],
]

const STATUS_LABEL: Record<SyncStatus, string> = {
  connecting: 'Syncing…',
  synced: 'Synced',
  saving: 'Saving…',
  offline: 'Offline, will sync',
  local: 'Saved on this device',
}

const EXAM_COUNT = SCHEDULE.flatMap((d) => d.tasks).filter((t) => t.kind === 'exam').length
const SUBJECT_COUNT = Object.keys(SUBJECTS).length

export function Tracker() {
  const today = useToday()
  const { doc, status, checked, set, reset } = useProgress()
  const [filter, setFilter] = useState<Filter>('all')
  const [hideFinished, setHideFinished] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [sheet, setSheet] = useState(false)
  const [burst, setBurst] = useState<string | null>(null)

  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(null), 1500)
    return () => clearTimeout(t)
  }, [burst])

  const ph = phase(today)
  const focus = focusDate(today)
  const totals = overall(doc)
  const subjects = useMemo(() => perSubject(doc), [doc])
  const allDone = totals.done === totals.total
  const exam = nextExam(SCHEDULE, checked, today)

  const infos = SCHEDULE.map((d) => ({ day: d, info: dayInfo(d, checked, today) }))
  const focusDay = infos.find((x) => x.info.isFocus)
  const todayDay = ph === 'during' ? focusDay : undefined
  const nextTask: Task | null = todayDay?.day.tasks.find((t) => !checked(t.id)) ?? null

  let chipEmoji = '🎯'
  let chipText: string
  if (!exam) {
    chipEmoji = '🎓'
    chipText = 'All exams done'
  } else {
    const name = SUBJECTS[exam.task.subject].name
    const n = exam.inDays
    chipText =
      n < 0
        ? `${name} exam: tick it off when done`
        : `Next exam: ${name} ${n === 0 ? `today, ${exam.task.time ?? ''}`.replace(/, $/, '') : n === 1 ? 'tomorrow' : `in ${n} days`}`
  }

  const eyebrow = ph === 'during' ? longDate(today) : ph === 'after' ? 'Exams complete' : `Starts ${longDate(focus)}`
  const todayDone = todayDay ? todayDay.info.doneCount : 0
  const todayTotal = todayDay ? todayDay.info.total : 0
  const todayText = todayDay ? `${todayDone} of ${todayTotal}${todayDay.info.complete ? ' ✅' : ''}` : ph === 'before' ? 'starts 3 Nov' : 'rest day'
  const daysLeft = ph === 'after' ? 0 : Math.min(SCHEDULE.length, diffDays(focus, SCHEDULE[SCHEDULE.length - 1].date) + 1)

  const visible = infos.filter(({ day, info }) => {
    if (filter === 'today' && !info.isFocus) return false
    if (filter === 'upcoming' && day.date < focus) return false
    if (hideFinished && info.complete && burst !== day.date) return false
    return true
  })

  const onCheck = useCallback(
    (day: (typeof SCHEDULE)[number], task: Task, value: boolean) => {
      const wasComplete = day.tasks.every((t) => checked(t.id))
      const nowComplete = day.tasks.every((t) => (t.id === task.id ? value : checked(t.id)))
      set(task.id, value)
      if (!wasComplete && nowComplete) {
        setExpanded((e) => ({ ...e, [day.date]: true }))
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setBurst(day.date)
      }
    },
    [checked, set],
  )

  const scrollTo = (id: string, smooth = true) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 16, behavior: smooth ? 'smooth' : 'auto' })
  }
  const jumpToday = () => {
    const id = focusDay ? `day-${focusDay.day.date}` : 'plan'
    if (filter === 'today' || (hideFinished && focusDay?.info.complete)) {
      setFilter('all')
      setHideFinished(false)
      setTimeout(() => scrollTo(id), 30)
    } else scrollTo(id)
  }

  const emptyTitle = hideFinished ? 'All caught up 🎉' : 'Nothing here'
  const emptyBody = hideFinished ? 'Every day in this view is finished. Take a breath — you earned it.' : 'No tasks scheduled for this view.'

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg text-ink">
      <ThemeToggle />
      <main className="mx-auto flex max-w-[920px] flex-col gap-[22px] px-4 pb-0 pt-5 d:gap-8 d:px-10 d:pt-12">
        <Hero
          eyebrow={eyebrow}
          chipEmoji={chipEmoji}
          chipText={chipText}
          pct={totals.pct}
          done={totals.done}
          total={totals.total}
          todayText={todayText}
          allDone={allDone}
        />

        {allDone && (
          <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-[20px] border border-line bg-green-tint px-5 py-7 text-center d:px-8 d:py-9">
            <Confetti className="left-1/2 top-[60px]" count={36} spread={1.8} />
            <div aria-hidden className="text-[44px] leading-none">
              🎓
            </div>
            <div role="status" className="text-[22px] font-bold leading-[1.1] tracking-[-0.03em] d:text-[28px]">
              You did it. Every single task.
            </div>
            <div className="max-w-[400px] text-sm text-ink2 text-pretty">
              {totals.total} tasks, {SUBJECT_COUNT} subjects, {SCHEDULE.length} days. Exams are done — close the laptop and go celebrate 🎉
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <div className="rounded-full bg-card px-3.5 py-2 text-sm font-semibold tabular-nums">
                ✅ {totals.total}/{totals.total} done
              </div>
              <div className="rounded-full bg-card px-3.5 py-2 text-sm font-semibold">🎯 {EXAM_COUNT} exams sat</div>
            </div>
          </div>
        )}

        <SubjectGrid stats={subjects} />

        <section id="plan" aria-labelledby="plan-h" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="plan-h" className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-ink2">
              Day by day
            </h2>
            <div className="text-xs tabular-nums text-ink2">{ph === 'after' ? 'All done' : `${daysLeft} days to go`}</div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Filter days" className="flex gap-0.5 rounded-full bg-seg p-0.5">
              {FILTERS.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={filter === k}
                  onClick={() => setFilter(k)}
                  className={`hit min-h-7 rounded-full border-0 px-3.5 py-[5px] text-[13px] font-semibold transition-[background,color] duration-200 ${filter === k ? 'bg-seg-on text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'bg-transparent text-ink2'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={hideFinished}
                onClick={() => setHideFinished((h) => !h)}
                className="hit flex items-center gap-2.5 border-0 bg-transparent px-0.5 py-1 text-[13px] font-medium text-ink2"
              >
                <span>Hide finished days</span>
                <span aria-hidden className={`relative h-[22px] w-9 rounded-full transition-colors duration-[250ms] ${hideFinished ? 'bg-green' : 'bg-seg'}`}>
                  <span
                    className="absolute left-0.5 top-0.5 size-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]"
                    style={{ transform: hideFinished ? 'translateX(14px)' : 'translateX(0)', transition: 'transform .35s cubic-bezier(.34,1.56,.64,1)' }}
                  />
                </span>
              </button>
              <button
                type="button"
                onClick={jumpToday}
                className="hit min-h-7 rounded-full border-0 bg-accent-tint px-3 py-[5px] text-[13px] font-semibold text-accent-ink transition-transform active:scale-[0.96]"
              >
                ↓ Jump to today
              </button>
            </div>
          </div>

          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-[18px] border border-line bg-card px-6 py-11 text-center">
              <div aria-hidden className="mb-1.5 text-4xl leading-none">
                🎉
              </div>
              <div className="text-xl font-bold tracking-[-0.025em]">{emptyTitle}</div>
              <div className="max-w-[300px] text-sm text-ink2 text-pretty">{emptyBody}</div>
              {hideFinished && (
                <button type="button" onClick={() => setHideFinished(false)} className="mt-3 min-h-11 rounded-full border-0 bg-accent-solid px-4 py-2 text-[13px] font-semibold text-white">
                  Show finished days
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {visible.map(({ day, info }) => (
              <DayCard
                key={day.date}
                day={day}
                info={info}
                beforeStart={ph === 'before'}
                expanded={expanded[day.date] ?? !info.complete}
                burst={burst === day.date}
                isChecked={checked}
                onToggleExpanded={() => setExpanded((e) => ({ ...e, [day.date]: !(e[day.date] ?? !info.complete) }))}
                onCheck={(task, value) => onCheck(day, task, value)}
              />
            ))}
          </div>
        </section>

        <footer className="flex flex-col items-center gap-2.5 pb-6 pt-2 d:pb-14">
          <button
            type="button"
            onClick={() => setSheet(true)}
            className="hit min-h-8 rounded-full border border-line bg-card px-3.5 py-1.5 text-[12.5px] font-semibold text-red-ink"
          >
            Reset progress
          </button>
          <div className="text-[11.5px] text-ink2">
            <span role="status" aria-live="polite">
              {STATUS_LABEL[status]}
            </span>{' '}
            · Good luck 🍀
          </div>
        </footer>
      </main>

      {todayDay && <TodayBar done={todayDone} total={todayTotal} next={nextTask} onTickNext={() => nextTask && onCheck(todayDay.day, nextTask, true)} />}

      {sheet && (
        <ResetSheet
          count={totals.done}
          onCancel={() => setSheet(false)}
          onConfirm={() => {
            reset()
            setExpanded({})
            setSheet(false)
          }}
        />
      )}
    </div>
  )
}
