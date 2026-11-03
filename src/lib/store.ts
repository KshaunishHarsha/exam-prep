import { Redis } from '@upstash/redis'
import { applyPatches, emptyDoc, sanitize, type Patch, type ProgressDoc } from '@/lib/progress'

/** Server-side persistence for the progress document. Swap the implementation to change backends. */
export interface ProgressStore {
  get(): Promise<ProgressDoc>
  /** Merges per-task patches into the stored document and returns the result. */
  patch(patches: Patch[]): Promise<ProgressDoc>
}

export const PROGRESS_KEY = 'exam-tracker:progress'

export class RedisProgressStore implements ProgressStore {
  constructor(private redis: Pick<Redis, 'get' | 'set'>) {}

  async get() {
    return sanitize(await this.redis.get<ProgressDoc>(PROGRESS_KEY))
  }

  // Read-merge-write on a single key. Patches are per task and merged by timestamp, so two
  // devices only conflict if they write within the same few milliseconds.
  async patch(patches: Patch[]) {
    const next = applyPatches(await this.get(), patches)
    await this.redis.set(PROGRESS_KEY, next)
    return next
  }
}

/** In-process store, used by tests. */
export class MemoryProgressStore implements ProgressStore {
  private doc = emptyDoc()
  async get() {
    return this.doc
  }
  async patch(patches: Patch[]) {
    this.doc = applyPatches(this.doc, patches)
    return this.doc
  }
}

/** Supports both the Vercel/Upstash (KV_REST_API_*) and plain Upstash (UPSTASH_REDIS_REST_*) env names. */
export function getStore(env: NodeJS.ProcessEnv = process.env): ProgressStore | null {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new RedisProgressStore(new Redis({ url, token }))
}
