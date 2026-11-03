import { SLOT_LABEL, type Kind, type Task } from '@/data/schedule'

/** Right-hand label of a task row: the exam time, or "Slot · duration". */
export function taskTime(t: Task): string {
  if (t.kind === 'exam') return t.time ?? SLOT_LABEL[t.slot]
  return [SLOT_LABEL[t.slot], t.time].filter(Boolean).join(' · ')
}

export const KIND_TAG: Record<Kind, { label: string; cls: string }> = {
  study: { label: '✍️ Study', cls: 'bg-accent-tint text-accent-ink' },
  revise: { label: '🔁 Revise', cls: 'bg-purple-tint text-purple-ink' },
  skim: { label: '🧠 Skim', cls: 'bg-teal-tint text-teal-ink' },
  exam: { label: '🎯 Exam', cls: 'bg-orange text-on-orange' },
}
