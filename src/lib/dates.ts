import { FIRST_DATE, LAST_DATE, type Day, type Task } from '@/data/schedule'

const IST = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's calendar date in Asia/Kolkata as YYYY-MM-DD. */
export function istToday(now: Date | number = Date.now()): string {
  return IST.format(now)
}

const DAY_MS = 86_400_000

const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

export function diffDays(fromIso: string, toIso: string): number {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS)
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const weekdayLong = (iso: string) => WEEKDAYS[new Date(toUtc(iso)).getUTCDay()]
export const weekdayShort = (iso: string) => weekdayLong(iso).slice(0, 3)
export const dayOfMonth = (iso: string) => Number(iso.slice(8, 10))
export const longDate = (iso: string) => `${weekdayLong(iso)}, ${dayOfMonth(iso)} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`

export type Phase = 'before' | 'during' | 'after'

export function phase(todayIso: string): Phase {
  if (todayIso < FIRST_DATE) return 'before'
  if (todayIso > LAST_DATE) return 'after'
  return 'during'
}

/** The date the UI treats as "now": before the schedule starts, the first day is "next up". */
export function focusDate(todayIso: string): string {
  return todayIso < FIRST_DATE ? FIRST_DATE : todayIso
}

export type Checked = (taskId: string) => boolean

export type DayStatus = 'done' | 'today' | 'behind' | 'upcoming'

export interface DayInfo {
  status: DayStatus
  /** Is this the focus day (today, or the first day when the schedule hasn't started)? */
  isFocus: boolean
  doneCount: number
  total: number
  complete: boolean
  hasExam: boolean
}

export function dayInfo(day: Day, isChecked: Checked, todayIso: string): DayInfo {
  const total = day.tasks.length
  const doneCount = day.tasks.filter((t) => isChecked(t.id)).length
  const complete = doneCount === total
  const isFocus = day.date === focusDate(todayIso) && phase(todayIso) !== 'after'
  const past = day.date < todayIso
  let status: DayStatus = 'upcoming'
  if (complete) status = 'done'
  else if (past) status = 'behind'
  else if (isFocus && phase(todayIso) === 'during') status = 'today'
  return { status, isFocus, doneCount, total, complete, hasExam: day.tasks.some((t) => t.kind === 'exam') }
}

export interface NextExam {
  task: Task
  date: string
  /** Days from the focus date; negative when the exam date has passed but isn't ticked off. */
  inDays: number
}

/** The first unchecked exam task in schedule order, with its countdown. */
export function nextExam(schedule: Day[], isChecked: Checked, todayIso: string): NextExam | null {
  const from = focusDate(todayIso)
  for (const d of schedule) {
    for (const t of d.tasks) {
      if (t.kind === 'exam' && !isChecked(t.id)) return { task: t, date: d.date, inDays: diffDays(from, d.date) }
    }
  }
  return null
}
