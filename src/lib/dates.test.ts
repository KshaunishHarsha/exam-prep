import { describe, expect, it } from 'vitest'
import { SCHEDULE } from '@/data/schedule'
import { dayInfo, diffDays, focusDate, istToday, nextExam, phase } from '@/lib/dates'

const day = (n: number) => SCHEDULE.find((d) => d.date === `2026-11-${String(n).padStart(2, '0')}`)!
const none = () => false
const all = () => true
const only = (ids: string[]) => (id: string) => ids.includes(id)

describe('istToday', () => {
  it('rolls over at midnight IST (18:30 UTC)', () => {
    expect(istToday(Date.UTC(2026, 10, 2, 18, 29, 59))).toBe('2026-11-02')
    expect(istToday(Date.UTC(2026, 10, 2, 18, 30, 0))).toBe('2026-11-03')
    expect(istToday(Date.UTC(2026, 10, 3, 18, 29, 59))).toBe('2026-11-03')
  })
  it('uses the IST date even when UTC is still the previous day', () => {
    expect(istToday(Date.UTC(2026, 10, 30, 20, 0, 0))).toBe('2026-12-01')
  })
})

describe('phase and focus date', () => {
  it('treats the first day as next up before the schedule starts', () => {
    expect(phase('2026-11-02')).toBe('before')
    expect(focusDate('2026-11-02')).toBe('2026-11-03')
    expect(focusDate('2026-10-01')).toBe('2026-11-03')
  })
  it('is during from Nov 3 to Nov 30 inclusive, finished after', () => {
    expect(phase('2026-11-03')).toBe('during')
    expect(phase('2026-11-30')).toBe('during')
    expect(phase('2026-12-01')).toBe('after')
  })
})

describe('dayInfo', () => {
  it('marks a past day with unchecked tasks as behind', () => {
    const info = dayInfo(day(5), none, '2026-11-06')
    expect(info.status).toBe('behind')
    expect(info.complete).toBe(false)
  })
  it('marks a fully checked day as done, even in the past or today', () => {
    expect(dayInfo(day(5), all, '2026-11-06').status).toBe('done')
    expect(dayInfo(day(5), all, '2026-11-05').status).toBe('done')
  })
  it('needs every task checked to be done', () => {
    const d = day(9)
    const partial = dayInfo(d, only([d.tasks[0].id]), '2026-11-12')
    expect(partial.status).toBe('behind')
    expect(partial.doneCount).toBe(1)
  })
  it('marks today and upcoming days', () => {
    expect(dayInfo(day(5), none, '2026-11-05')).toMatchObject({ status: 'today', isFocus: true })
    expect(dayInfo(day(6), none, '2026-11-05')).toMatchObject({ status: 'upcoming', isFocus: false })
  })
  it('makes Nov 3 the focus (but not "today") before the schedule starts', () => {
    expect(dayInfo(day(3), none, '2026-11-01')).toMatchObject({ status: 'upcoming', isFocus: true })
    expect(dayInfo(day(4), none, '2026-11-01').isFocus).toBe(false)
  })
  it('has no focus day after the schedule and calls unfinished days behind', () => {
    expect(dayInfo(day(30), none, '2026-12-01')).toMatchObject({ status: 'behind', isFocus: false })
  })
  it('flags exam days', () => {
    expect(dayInfo(day(16), none, '2026-11-16').hasExam).toBe(true)
    expect(dayInfo(day(15), none, '2026-11-16').hasExam).toBe(false)
  })
})

describe('nextExam', () => {
  it('counts down from the focus date to the first unchecked exam', () => {
    const n = nextExam(SCHEDULE, none, '2026-11-03')!
    expect(n.task.id).toBe('d16-fa-exam')
    expect(n.inDays).toBe(13)
  })
  it('counts from Nov 3 when the schedule has not started', () => {
    expect(nextExam(SCHEDULE, none, '2026-10-25')!.inDays).toBe(13)
  })
  it('moves on to the next exam once one is ticked off', () => {
    const n = nextExam(SCHEDULE, only(['d16-fa-exam']), '2026-11-10')!
    expect(n.task.id).toBe('d17-bs-exam')
    expect(n.inDays).toBe(7)
  })
  it('reports 0 on exam day and a negative value for an exam date that passed unticked', () => {
    expect(nextExam(SCHEDULE, none, '2026-11-16')!.inDays).toBe(0)
    expect(nextExam(SCHEDULE, none, '2026-11-18')!.inDays).toBe(-2)
  })
  it('is null once every exam is checked', () => {
    expect(nextExam(SCHEDULE, all, '2026-11-03')).toBeNull()
  })
})

describe('diffDays', () => {
  it('is calendar-day based', () => {
    expect(diffDays('2026-11-03', '2026-11-30')).toBe(27)
    expect(diffDays('2026-11-30', '2026-11-03')).toBe(-27)
  })
})
