import { TASK_IDS } from '@/data/schedule'
import type { Patch } from '@/lib/progress'
import { getStore } from '@/lib/store'

const headers = { 'Cache-Control': 'no-store' }
const DAY_MS = 86_400_000

// 200 rather than an error status: running without a database is a supported mode, not a failure.
const notConfigured = () => Response.json({ configured: false }, { headers })

function parsePatches(body: unknown): Patch[] | null {
  const raw: unknown[] = Array.isArray((body as { patches?: unknown })?.patches) ? (body as { patches: unknown[] }).patches : [body]
  const now = Date.now()
  const out: Patch[] = []
  for (const p of raw) {
    const { taskId, checked, at } = (p ?? {}) as Partial<Patch>
    if (typeof taskId !== 'string' || !TASK_IDS.has(taskId) || typeof checked !== 'boolean') return null
    // Clients supply the timestamp so queued offline writes keep their order; don't trust clocks from the far future.
    const t = typeof at === 'number' && Number.isFinite(at) ? Math.min(at, now + DAY_MS) : now
    out.push({ taskId, checked, at: t })
  }
  return out.length && out.length <= 500 ? out : null
}

export async function GET() {
  const store = getStore()
  if (!store) return notConfigured()
  try {
    return Response.json(await store.get(), { headers })
  } catch {
    return Response.json({ error: 'store-unavailable' }, { status: 502, headers })
  }
}

export async function PUT(request: Request) {
  const store = getStore()
  if (!store) return notConfigured()
  const patches = parsePatches(await request.json().catch(() => null))
  if (!patches) return Response.json({ error: 'bad-request' }, { status: 400, headers })
  try {
    return Response.json(await store.patch(patches), { headers })
  } catch {
    return Response.json({ error: 'store-unavailable' }, { status: 502, headers })
  }
}
