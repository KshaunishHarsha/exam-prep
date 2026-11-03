import { SCHEDULE, SUBJECT_ORDER, TASK_IDS, type Day, type Subject } from '@/data/schedule'

/**
 * Progress document. `done[id]` is the epoch ms at which the task was last checked.
 * `removed[id]` is the epoch ms at which it was last unchecked (a tombstone, so an uncheck on
 * one device isn't resurrected by a stale check from another). For each id the later of the
 * two timestamps wins.
 */
export interface ProgressDoc {
  done: Record<string, number>
  removed?: Record<string, number>
  updatedAt: number
}

export interface Patch {
  taskId: string
  checked: boolean
  at: number
}

export const emptyDoc = (): ProgressDoc => ({ done: {}, removed: {}, updatedAt: 0 })

export function mergeDocs(a: ProgressDoc, b: ProgressDoc): ProgressDoc {
  const done: Record<string, number> = {}
  const removed: Record<string, number> = {}
  const ids = new Set([...Object.keys(a.done), ...Object.keys(b.done), ...Object.keys(a.removed ?? {}), ...Object.keys(b.removed ?? {})])
  for (const id of ids) {
    const checkedAt = Math.max(a.done[id] ?? 0, b.done[id] ?? 0)
    const uncheckedAt = Math.max(a.removed?.[id] ?? 0, b.removed?.[id] ?? 0)
    if (checkedAt > uncheckedAt) done[id] = checkedAt
    else if (uncheckedAt > 0) removed[id] = uncheckedAt
  }
  return { done, removed, updatedAt: Math.max(a.updatedAt, b.updatedAt) }
}

export function applyPatches(doc: ProgressDoc, patches: Patch[]): ProgressDoc {
  let out = doc
  for (const p of patches) {
    const part: ProgressDoc = p.checked
      ? { done: { [p.taskId]: p.at }, updatedAt: p.at }
      : { done: {}, removed: { [p.taskId]: p.at }, updatedAt: p.at }
    out = mergeDocs(out, part)
  }
  return out
}

export const isChecked = (doc: ProgressDoc) => (id: string) => id in doc.done

/** Drops ids that are no longer in the schedule. */
export function sanitize(raw: unknown): ProgressDoc {
  const out = emptyDoc()
  if (!raw || typeof raw !== 'object') return out
  const r = raw as Partial<ProgressDoc>
  for (const [k, v] of Object.entries(r.done ?? {})) if (TASK_IDS.has(k) && Number.isFinite(v)) out.done[k] = v
  for (const [k, v] of Object.entries(r.removed ?? {})) if (TASK_IDS.has(k) && Number.isFinite(v)) out.removed![k] = v
  out.updatedAt = Number.isFinite(r.updatedAt) ? (r.updatedAt as number) : 0
  return mergeDocs(out, emptyDoc())
}

export interface Totals {
  done: number
  total: number
  pct: number
}

export function overall(doc: ProgressDoc, schedule: Day[] = SCHEDULE): Totals {
  const tasks = schedule.flatMap((d) => d.tasks)
  const done = tasks.filter((t) => t.id in doc.done).length
  return { done, total: tasks.length, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
}

export function perSubject(doc: ProgressDoc, schedule: Day[] = SCHEDULE): Record<Subject, { done: number; total: number }> {
  const out = Object.fromEntries(SUBJECT_ORDER.map((s) => [s, { done: 0, total: 0 }])) as Record<Subject, { done: number; total: number }>
  for (const t of schedule.flatMap((d) => d.tasks)) {
    out[t.subject].total++
    if (t.id in doc.done) out[t.subject].done++
  }
  return out
}
