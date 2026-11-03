import { describe, expect, it } from 'vitest'
import { applyPatches, emptyDoc, mergeDocs, overall, perSubject, sanitize } from '@/lib/progress'
import { ALL_TASKS } from '@/data/schedule'

const A = 'd03-mm-study1'
const B = 'd04-mm-study2'

describe('mergeDocs / applyPatches', () => {
  it('last write wins per task', () => {
    const checked = applyPatches(emptyDoc(), [{ taskId: A, checked: true, at: 100 }])
    const unchecked = applyPatches(checked, [{ taskId: A, checked: false, at: 200 }])
    expect(unchecked.done[A]).toBeUndefined()
    expect(unchecked.removed![A]).toBe(200)
    // a stale check from another device can't resurrect it
    expect(applyPatches(unchecked, [{ taskId: A, checked: true, at: 150 }]).done[A]).toBeUndefined()
    // a newer one does
    expect(applyPatches(unchecked, [{ taskId: A, checked: true, at: 300 }]).done[A]).toBe(300)
  })
  it('keeps independent tasks from two devices (single-task patches do not clobber)', () => {
    const phone = applyPatches(emptyDoc(), [{ taskId: A, checked: true, at: 100 }])
    const laptop = applyPatches(emptyDoc(), [{ taskId: B, checked: true, at: 110 }])
    const merged = mergeDocs(phone, laptop)
    expect(Object.keys(merged.done).sort()).toEqual([A, B])
    expect(mergeDocs(laptop, phone)).toEqual(merged)
  })
  it('is idempotent and order-independent', () => {
    const p = [
      { taskId: A, checked: true, at: 1 },
      { taskId: A, checked: false, at: 2 },
      { taskId: B, checked: true, at: 3 },
    ]
    const once = applyPatches(emptyDoc(), p)
    expect(applyPatches(once, p)).toEqual(once)
    expect(applyPatches(emptyDoc(), [...p].reverse())).toEqual(once)
  })
  it('lets an uncheck win a same-millisecond tie', () => {
    const d = applyPatches(emptyDoc(), [
      { taskId: A, checked: true, at: 5 },
      { taskId: A, checked: false, at: 5 },
    ])
    expect(d.done[A]).toBeUndefined()
  })
})

describe('sanitize', () => {
  it('drops unknown ids and junk', () => {
    const d = sanitize({ done: { [A]: 10, 'd99-zz-nope': 5, bad: 'x' }, updatedAt: 'nope' })
    expect(d.done).toEqual({ [A]: 10 })
    expect(d.updatedAt).toBe(0)
    expect(sanitize(null)).toEqual(emptyDoc())
  })
})

describe('progress totals', () => {
  it('derives overall and per-subject progress from the checked set', () => {
    const doc = applyPatches(emptyDoc(), [
      { taskId: A, checked: true, at: 1 },
      { taskId: 'd16-fa-exam', checked: true, at: 2 },
    ])
    expect(overall(doc)).toEqual({ done: 2, total: ALL_TASKS.length, pct: 4 })
    const subj = perSubject(doc)
    expect(subj.mm.done).toBe(1)
    expect(subj.fa.done).toBe(1)
    expect(Object.values(subj).reduce((n, s) => n + s.total, 0)).toBe(ALL_TASKS.length)
  })
})
