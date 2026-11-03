import { applyPatches, emptyDoc, mergeDocs, sanitize, type Patch, type ProgressDoc } from '@/lib/progress'

export type SyncStatus = 'connecting' | 'synced' | 'saving' | 'offline' | 'local'

export interface Snapshot {
  doc: ProgressDoc
  status: SyncStatus
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface SyncDeps {
  fetch: typeof fetch
  storage: StorageLike | null
  now: () => number
  isOnline: () => boolean
  endpoint?: string
}

export const DOC_KEY = 'ept-progress-v2'
export const QUEUE_KEY = 'ept-queue-v1'

export const EMPTY_SNAPSHOT: Snapshot = { doc: emptyDoc(), status: 'connecting' }

function read<T>(storage: StorageLike | null, key: string): T | null {
  try {
    const s = storage?.getItem(key)
    return s ? (JSON.parse(s) as T) : null
  } catch {
    return null
  }
}

function write(storage: StorageLike | null, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // storage may be full or blocked; the in-memory state still works
  }
}

/**
 * Optimistic local state + background sync. Every change is applied locally first, persisted to
 * localStorage, and queued as a per-task patch that is sent to the server when it can be.
 */
export class ProgressSync {
  private doc: ProgressDoc
  private queue: Patch[]
  private status: SyncStatus = 'connecting'
  private snap: Snapshot
  private listeners = new Set<() => void>()
  private inflight: Promise<void> | null = null
  private lastAt = 0
  private configured = true

  constructor(private deps: SyncDeps) {
    this.doc = sanitize(read(deps.storage, DOC_KEY))
    this.queue = (read<Patch[]>(deps.storage, QUEUE_KEY) ?? []).filter((p) => typeof p?.taskId === 'string' && typeof p.at === 'number')
    this.doc = applyPatches(this.doc, this.queue)
    this.snap = { doc: this.doc, status: this.status }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }

  getSnapshot = () => this.snap

  get pending() {
    return this.queue.length
  }

  private emit() {
    this.snap = { doc: this.doc, status: this.status }
    write(this.deps.storage, DOC_KEY, this.doc)
    write(this.deps.storage, QUEUE_KEY, this.queue)
    this.listeners.forEach((l) => l())
  }

  private stamp() {
    this.lastAt = Math.max(this.deps.now(), this.lastAt + 1)
    return this.lastAt
  }

  set(taskId: string, checked: boolean) {
    this.change([{ taskId, checked, at: this.stamp() }])
  }

  /** Unchecks everything that is currently checked. */
  reset() {
    this.change(Object.keys(this.doc.done).map((taskId) => ({ taskId, checked: false, at: this.stamp() })))
  }

  private change(patches: Patch[]) {
    if (!patches.length) return
    this.doc = applyPatches(this.doc, patches)
    if (this.configured) this.queue.push(...patches)
    this.emit()
    void this.flush()
  }

  private url() {
    return this.deps.endpoint ?? '/api/progress'
  }

  /** Sends queued patches. Concurrent callers share the in-flight run, which also drains patches added meanwhile. */
  flush(): Promise<void> {
    if (this.inflight) return this.inflight
    if (!this.queue.length) return Promise.resolve()
    this.inflight = this.run().finally(() => {
      this.inflight = null
    })
    return this.inflight
  }

  private async run(): Promise<void> {
    if (!this.deps.isOnline()) return this.setStatus('offline')
    this.setStatus('saving')
    try {
      while (this.queue.length) {
        const sent = this.queue.slice()
        const res = await this.deps.fetch(this.url(), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patches: sent }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        if (body?.configured === false) return this.goLocal()
        this.queue = this.queue.filter((p) => !sent.includes(p))
        this.doc = mergeDocs(this.doc, sanitize(body))
      }
      this.setStatus('synced')
    } catch {
      this.setStatus('offline')
    }
  }

  /** Pulls the server document and merges it with local state, then pushes anything still queued. */
  async reconcile(): Promise<void> {
    if (!this.configured) return
    if (!this.deps.isOnline()) return this.setStatus('offline')
    try {
      const res = await this.deps.fetch(this.url(), { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      if (body?.configured === false) return this.goLocal()
      this.doc = mergeDocs(this.doc, sanitize(body))
      this.setStatus(this.queue.length ? 'saving' : 'synced')
      await this.flush()
    } catch {
      this.setStatus('offline')
    }
  }

  private goLocal() {
    this.configured = false
    this.queue = []
    this.setStatus('local')
  }

  private setStatus(status: SyncStatus) {
    this.status = status
    this.emit()
  }

  /** Wires up focus/online/visibility events and the 60s poll. Returns a cleanup function. */
  start(): () => void {
    const onFocus = () => void this.reconcile()
    const onOnline = () => void this.reconcile()
    const onOffline = () => this.queue.length && this.setStatus('offline')
    const onVisible = () => document.visibilityState === 'visible' && void this.reconcile()
    const timer = setInterval(() => document.visibilityState === 'visible' && void this.reconcile(), 60_000)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)
    void this.reconcile()
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }
}

let instance: ProgressSync | null = null

/** Browser singleton; null during SSR. */
export function getSync(): ProgressSync | null {
  if (typeof window === 'undefined') return null
  if (!instance) {
    let storage: StorageLike | null = null
    try {
      storage = window.localStorage
    } catch {
      storage = null
    }
    instance = new ProgressSync({
      fetch: (...a) => window.fetch(...a),
      storage,
      now: () => Date.now(),
      isOnline: () => navigator.onLine,
    })
  }
  return instance
}
