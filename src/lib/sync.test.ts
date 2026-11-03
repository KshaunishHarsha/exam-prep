import { describe, expect, it } from 'vitest'
import { applyPatches, emptyDoc } from '@/lib/progress'
import { DOC_KEY, ProgressSync, QUEUE_KEY, type StorageLike } from '@/lib/sync'

const A = 'd03-mm-study1'
const B = 'd04-mm-study2'

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function setup(handler: (req: { method: string; body?: { patches: unknown[] } }) => Response | Promise<Response>, storage = memoryStorage()) {
  const state = { online: true, calls: [] as { method: string; body?: { patches: unknown[] } }[] }
  let t = 1000
  const sync = new ProgressSync({
    storage,
    now: () => t++,
    isOnline: () => state.online,
    fetch: (async (_url: string, init?: RequestInit) => {
      const req = { method: init?.method ?? 'GET', body: init?.body ? JSON.parse(init.body as string) : undefined }
      state.calls.push(req)
      return handler(req)
    }) as typeof fetch,
  })
  return { sync, state, storage }
}

describe('ProgressSync', () => {
  it('updates immediately and syncs a single-task patch in the background', async () => {
    const server = emptyDoc()
    const { sync, state } = setup((req) => {
      const doc = applyPatches(server, (req.body?.patches ?? []) as never)
      return json(doc)
    })
    sync.set(A, true)
    expect(sync.getSnapshot().doc.done[A]).toBeDefined() // optimistic, before the network resolves
    await sync.flush()
    expect(sync.getSnapshot().status).toBe('synced')
    expect(sync.pending).toBe(0)
    expect(state.calls).toHaveLength(1)
    expect(state.calls[0].body!.patches).toEqual([{ taskId: A, checked: true, at: expect.any(Number) }])
  })

  it('queues writes while offline, persists them, and retries when back online', async () => {
    const storage = memoryStorage()
    const { sync, state } = setup((req) => json(applyPatches(emptyDoc(), (req.body?.patches ?? []) as never)), storage)
    state.online = false
    sync.set(A, true)
    sync.set(B, true)
    await sync.flush()
    expect(sync.getSnapshot().status).toBe('offline')
    expect(sync.pending).toBe(2)
    expect(state.calls).toHaveLength(0)
    expect(JSON.parse(storage.data.get(QUEUE_KEY)!)).toHaveLength(2)

    state.online = true
    await sync.flush()
    expect(sync.getSnapshot().status).toBe('synced')
    expect(sync.pending).toBe(0)
    expect(state.calls[0].body!.patches).toHaveLength(2)
  })

  it('keeps the queue when the network fails and survives a reload', async () => {
    const storage = memoryStorage()
    const first = setup(() => {
      throw new TypeError('Failed to fetch')
    }, storage)
    first.sync.set(A, true)
    await first.sync.flush()
    expect(first.sync.getSnapshot().status).toBe('offline')

    const second = setup((req) => json(applyPatches(emptyDoc(), (req.body?.patches ?? []) as never)), storage)
    expect(second.sync.getSnapshot().doc.done[A]).toBeDefined() // restored from the local cache
    expect(second.sync.pending).toBe(1)
    await second.sync.flush()
    expect(second.sync.pending).toBe(0)
    expect(second.sync.getSnapshot().status).toBe('synced')
  })

  it('keeps the queue on a server error', async () => {
    const { sync } = setup(() => json({ error: 'store-unavailable' }, 502))
    sync.set(A, true)
    await sync.flush()
    expect(sync.getSnapshot().status).toBe('offline')
    expect(sync.pending).toBe(1)
  })

  it('reconcile merges server state with unsent local changes', async () => {
    const server = applyPatches(emptyDoc(), [{ taskId: B, checked: true, at: 5 }])
    const { sync, state } = setup((req) => (req.method === 'GET' ? json(server) : json(applyPatches(server, (req.body?.patches ?? []) as never))))
    state.online = false
    sync.set(A, true)
    state.online = true
    await sync.reconcile()
    const done = sync.getSnapshot().doc.done
    expect(Object.keys(done).sort()).toEqual([A, B])
    expect(sync.pending).toBe(0)
  })

  it('a local uncheck beats an older server check', async () => {
    const server = applyPatches(emptyDoc(), [{ taskId: A, checked: true, at: 1 }])
    const { sync, state } = setup((req) => (req.method === 'GET' ? json(server) : json(server)))
    state.online = false
    sync.set(A, false)
    state.online = true
    await sync.reconcile()
    expect(sync.getSnapshot().doc.done[A]).toBeUndefined()
  })

  it('falls back to local-only when the server has no database configured', async () => {
    const { sync, state } = setup(() => json({ configured: false }))
    sync.set(A, true)
    await sync.flush()
    expect(sync.getSnapshot().status).toBe('local')
    expect(sync.pending).toBe(0)
    sync.set(B, true)
    await sync.flush()
    expect(state.calls).toHaveLength(1) // stops calling once it knows there is no backend
    expect(Object.keys(sync.getSnapshot().doc.done)).toHaveLength(2)
  })

  it('reset unchecks everything and syncs it', async () => {
    const { sync, state } = setup((req) => json(applyPatches(emptyDoc(), (req.body?.patches ?? []) as never)))
    sync.set(A, true)
    sync.set(B, true)
    await sync.flush()
    sync.reset()
    expect(sync.getSnapshot().doc.done).toEqual({})
    await sync.flush()
    expect(state.calls.at(-1)!.body!.patches).toHaveLength(2)
  })

  it('persists the document locally', () => {
    const { sync, storage } = setup(() => json({ configured: false }))
    sync.set(A, true)
    expect(JSON.parse(storage.data.get(DOC_KEY)!).done[A]).toBeDefined()
  })
})
