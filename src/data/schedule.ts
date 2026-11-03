export type Subject = 'fa' | 'bs' | 'mm' | 'om' | 'qt' | 'ma' | 'eh' | 'cr' | 'cl'
export type Kind = 'study' | 'revise' | 'skim' | 'exam'
export type Slot = 'morning' | 'daytime' | 'afternoon' | 'evening'

export interface Task {
  id: string
  subject: Subject
  kind: Kind
  title: string
  detail?: string
  slot: Slot
  time?: string
}

export interface Day {
  date: string // ISO, 2026-11-DD
  note?: string
  tasks: Task[]
}

export const SUBJECTS: Record<Subject, { emoji: string; name: string }> = {
  fa: { emoji: '💰', name: 'Financial Accounting' },
  bs: { emoji: '📈', name: 'Business Statistics' },
  mm: { emoji: '📣', name: 'Marketing Management' },
  om: { emoji: '⚙️', name: 'Operations Management' },
  qt: { emoji: '🧮', name: 'Quantitative Techniques' },
  ma: { emoji: '🌍', name: 'Macroeconomics' },
  eh: { emoji: '🕵️', name: 'Ethical Hacking' },
  cr: { emoji: '🔐', name: 'Cryptography & Network Security' },
  cl: { emoji: '☁️', name: 'Cloud Computing' },
}

export const SUBJECT_ORDER: Subject[] = ['fa', 'bs', 'mm', 'om', 'qt', 'ma', 'eh', 'cr', 'cl']

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  daytime: 'Daytime',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

// Topics covered on Study Day 1 / Study Day 2.
// Ethical Hacking has no "Day N" blocks; its evening sessions are listed individually below.
const TOPICS: Partial<Record<Subject, [string, string]>> = {
  mm: ['Concepts, STP, 4Ps', 'Consumer behaviour, branding, cases'],
  fa: ['Basics, journal/ledger/trial balance, final accounts', 'Ratios, cash flow, depreciation, practice sums'],
  om: ['Production systems, capacity/layout, forecasting', 'Inventory, quality (TQM, Six Sigma), scheduling'],
  bs: ['Central tendency, dispersion, probability', 'Distributions, correlation/regression, hypothesis testing'],
  ma: ['National income, consumption/investment, IS-LM', 'Money and banking, inflation, fiscal/monetary policy'],
  qt: ['Linear programming, transportation', 'Assignment, PERT/CPM, decision theory'],
  cr: [
    'Classical and symmetric ciphers (DES, AES, modes), modular arithmetic, number theory',
    'RSA, ECC, Diffie-Hellman, hashes/MACs/signatures, SSL/TLS, IPsec, firewalls',
  ],
  cl: [
    'Service/deployment models, virtualization, architecture',
    'Storage, security, AWS/Azure services, containers',
  ],
}

// "P" = exam time 2:00-4:00 PM
const P = '2:00 – 4:00 PM'

interface Opts {
  slot?: Slot
  time?: string
  detail?: string
  title?: string
  key?: string // disambiguates two tasks of the same subject and kind on one day
}

type Draft = Omit<Task, 'id'> & { key: string }

const name = (s: Subject) => SUBJECTS[s].name

const study = (subject: Subject, day: 1 | 2, o: Opts = {}): Draft => ({
  subject,
  kind: 'study',
  key: o.key ?? `study${day}`,
  title: o.title ?? `${name(subject)} — Day ${day}`,
  detail: o.detail ?? TOPICS[subject]?.[day - 1],
  slot: o.slot ?? 'daytime',
  time: o.time,
})

// Evening/extra study blocks that are not "Day N" (e.g. Ethical Hacking topics, recaps).
const extra = (subject: Subject, key: string, title: string, o: Opts = {}): Draft => ({
  subject,
  kind: 'study',
  key,
  title,
  detail: o.detail,
  slot: o.slot ?? 'evening',
  time: o.time,
})

const revise = (subject: Subject, o: Opts = {}): Draft => ({
  subject,
  kind: 'revise',
  key: o.key ?? 'revise',
  title: o.title ?? `Revise ${name(subject)}`,
  detail: o.detail,
  slot: o.slot ?? 'daytime',
  time: o.time,
})

const skim = (subject: Subject, o: Opts = {}): Draft => ({
  subject,
  kind: 'skim',
  key: o.key ?? 'skim',
  title: o.title ?? `Final skim: ${name(subject)}`,
  detail: o.detail,
  slot: o.slot ?? 'morning',
  time: o.time,
})

const exam = (subject: Subject, o: Opts = {}): Draft => ({
  subject,
  kind: 'exam',
  key: 'exam',
  title: `${name(subject)} exam`,
  slot: o.slot ?? 'afternoon',
  time: o.time ?? P,
})

const NO_TIME = 'Time not on the datesheet'
const EH_EVENING: Opts = { slot: 'evening', time: '90 min' }

function day(dd: number, note: string | undefined, ...drafts: Draft[]): Day {
  const n = String(dd).padStart(2, '0')
  return {
    date: `2026-11-${n}`,
    ...(note ? { note } : {}),
    tasks: drafts.map(({ key, ...t }) => ({ id: `d${n}-${t.subject}-${key}`, ...t })),
  }
}

export const SCHEDULE: Day[] = [
  day(3, undefined, study('mm', 1)),
  day(4, undefined, study('mm', 2)),
  day(5, undefined, study('fa', 1)),
  day(6, undefined, study('fa', 2)),
  day(7, undefined, study('om', 1)),
  day(8, 'Diwali: keep it to 3–4 hours', study('om', 2)),
  day(9, undefined, study('bs', 1), extra('eh', 'study1', 'Ethical Hacking — Footprinting and scanning', EH_EVENING)),
  day(10, undefined, study('bs', 2), extra('eh', 'study2', 'Ethical Hacking — Enumeration and system hacking', EH_EVENING)),
  day(11, 'Bhai Dooj: lighter day', study('ma', 1), extra('eh', 'study3', 'Ethical Hacking — Malware and sniffing', EH_EVENING)),
  day(12, undefined, study('ma', 2), extra('eh', 'study4', 'Ethical Hacking — Web and network attacks', EH_EVENING)),
  day(
    13,
    undefined,
    study('qt', 1),
    extra('eh', 'study5', 'Ethical Hacking — Wireless and cryptography', {
      ...EH_EVENING,
      detail: 'With the Cryptography exam in mind',
    }),
  ),
  day(14, undefined, study('qt', 2), extra('eh', 'study6', 'Ethical Hacking — Mock paper', EH_EVENING)),
  day(
    15,
    undefined,
    revise('fa', { detail: 'Full day: formulas and solved problems' }),
    skim('bs', { slot: 'evening', title: 'Skim Business Statistics formulas' }),
  ),
  day(16, undefined, skim('fa'), exam('fa'), revise('bs', { slot: 'evening' })),
  day(17, undefined, skim('bs'), exam('bs'), revise('mm', { slot: 'evening' })),
  day(18, undefined, skim('mm'), exam('mm'), revise('om', { slot: 'evening' })),
  day(
    19,
    undefined,
    skim('om'),
    exam('om'),
    revise('qt', { slot: 'evening', detail: 'Re-solve LP and PERT problems' }),
  ),
  day(20, undefined, skim('qt'), exam('qt'), revise('ma', { slot: 'evening' })),
  day(
    21,
    undefined,
    skim('ma'),
    exam('ma'),
    skim('eh', { slot: 'evening', title: 'Light Ethical Hacking skim' }),
  ),
  day(22, undefined, revise('eh', { detail: 'Full day: tools, attack phases, labs' })),
  day(23, undefined, skim('eh'), exam('eh', { slot: 'daytime', time: NO_TIME })),
  day(
    24,
    'Guru Nanak Jayanti',
    study('cr', 1),
    extra('cr', 'recap', 'Cryptography recap', { detail: 'Quick pass over Day 1' }),
  ),
  day(25, undefined, study('cr', 2), revise('cr', { slot: 'evening' })),
  day(26, undefined, skim('cr'), exam('cr', { slot: 'daytime', time: NO_TIME })),
  day(27, undefined, study('cl', 1)),
  day(
    28,
    undefined,
    study('cl', 2),
    extra('cl', 'papers', 'Cloud Computing past papers'),
  ),
  day(29, undefined, revise('cl', { detail: 'Full day' })),
  day(30, undefined, exam('cl', { slot: 'morning', time: '10:00 AM – 1:00 PM' })),
]

export const ALL_TASKS: Task[] = SCHEDULE.flatMap((d) => d.tasks)
export const TASK_IDS: ReadonlySet<string> = new Set(ALL_TASKS.map((t) => t.id))
export const FIRST_DATE = SCHEDULE[0].date
export const LAST_DATE = SCHEDULE[SCHEDULE.length - 1].date
