'use client'

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { istToday } from '@/lib/dates'
import { isChecked } from '@/lib/progress'
import { EMPTY_SNAPSHOT, getSync } from '@/lib/sync'

const noop = () => () => {}

/**
 * Progress + sync status. On the server (and during hydration) this is the empty snapshot;
 * on the client it is read synchronously from the localStorage cache, then reconciled.
 */
export function useProgress() {
  const sync = getSync()
  const snap = useSyncExternalStore(sync?.subscribe ?? noop, sync?.getSnapshot ?? (() => EMPTY_SNAPSHOT), () => EMPTY_SNAPSHOT)

  useEffect(() => sync?.start(), [sync])

  const set = useCallback((id: string, checked: boolean) => sync?.set(id, checked), [sync])
  const reset = useCallback(() => sync?.reset(), [sync])
  const checked = useMemo(() => isChecked(snap.doc), [snap.doc])
  return { doc: snap.doc, status: snap.status, checked, set, reset }
}

/**
 * Today's date in IST. Empty string on the server so the prerendered HTML doesn't bake in the
 * build date; it re-evaluates every minute so the day rolls over while the app stays open.
 */
export function useToday(): string {
  const subscribe = useCallback((cb: () => void) => {
    const t = setInterval(cb, 60_000)
    return () => clearInterval(t)
  }, [])
  return useSyncExternalStore(subscribe, () => istToday(), () => '')
}
