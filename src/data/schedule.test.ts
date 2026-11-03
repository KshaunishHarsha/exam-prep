import { describe, expect, it } from 'vitest'
import { ALL_TASKS, SCHEDULE, SUBJECT_ORDER } from '@/data/schedule'

describe('schedule', () => {
  it('covers Nov 3-30 with one entry per day', () => {
    expect(SCHEDULE).toHaveLength(28)
    expect(SCHEDULE[0].date).toBe('2026-11-03')
    expect(SCHEDULE.at(-1)!.date).toBe('2026-11-30')
  })
  it('has unique, stable task ids', () => {
    const ids = ALL_TASKS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('d03-mm-study1')
  })
  it('has exactly one exam per subject', () => {
    for (const s of SUBJECT_ORDER) expect(ALL_TASKS.filter((t) => t.subject === s && t.kind === 'exam')).toHaveLength(1)
  })
  it('puts the exams on the datesheet days', () => {
    const date = (s: string) => ALL_TASKS.find((t) => t.subject === s && t.kind === 'exam')!.id.slice(1, 3)
    expect(Object.fromEntries(SUBJECT_ORDER.map((s) => [s, date(s)]))).toEqual({
      fa: '16', bs: '17', mm: '18', om: '19', qt: '20', ma: '21', eh: '23', cr: '26', cl: '30',
    })
  })
})
