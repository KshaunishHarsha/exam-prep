import { describe, expect, it } from 'vitest'
import { MemoryProgressStore, PROGRESS_KEY, RedisProgressStore, getStore } from '@/lib/store'

describe('stores', () => {
  it('memory store merges patches', async () => {
    const s = new MemoryProgressStore()
    await s.patch([{ taskId: 'd03-mm-study1', checked: true, at: 10 }])
    const doc = await s.patch([{ taskId: 'd04-mm-study2', checked: true, at: 20 }])
    expect(Object.keys(doc.done)).toHaveLength(2)
  })
  it('redis store reads and writes one key', async () => {
    const data = new Map<string, unknown>()
    const s = new RedisProgressStore({
      get: (async (k: string) => data.get(k) ?? null) as never,
      set: (async (k: string, v: unknown) => void data.set(k, v)) as never,
    })
    await s.patch([{ taskId: 'd03-mm-study1', checked: true, at: 10 }])
    expect([...data.keys()]).toEqual([PROGRESS_KEY])
    expect((await s.get()).done).toEqual({ 'd03-mm-study1': 10 })
  })
  it('reads either set of Upstash env vars, or none', () => {
    expect(getStore({} as NodeJS.ProcessEnv)).toBeNull()
    expect(getStore({ KV_REST_API_URL: 'https://x.upstash.io', KV_REST_API_TOKEN: 't' } as unknown as NodeJS.ProcessEnv)).not.toBeNull()
    expect(getStore({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' } as unknown as NodeJS.ProcessEnv)).not.toBeNull()
    expect(getStore({ KV_REST_API_URL: 'https://x.upstash.io' } as unknown as NodeJS.ProcessEnv)).toBeNull()
  })
})
