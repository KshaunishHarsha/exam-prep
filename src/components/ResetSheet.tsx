'use client'

import { useEffect, useRef } from 'react'

interface Props {
  count: number
  onCancel: () => void
  onConfirm: () => void
}

export function ResetSheet({ count, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab') {
        // Keep focus inside the two buttons while the sheet is open.
        const first = confirmRef.current
        const last = cancelRef.current
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [onCancel])

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-dim p-0 d:items-center d:p-6"
      style={{ animation: 'ept-fade .2s ease-out' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        aria-describedby="reset-body"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-[420px] flex-col items-center gap-2.5 rounded-t-[28px] bg-card px-[18px] pb-[max(24px,env(safe-area-inset-bottom))] pt-4 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)] d:rounded-[28px] d:px-6 d:pb-5 d:pt-[26px]"
        style={{ animation: 'ept-up .38s cubic-bezier(.22,1,.36,1)' }}
      >
        <div aria-hidden className="-mt-2 mb-2.5 h-[5px] w-10 rounded-full bg-ink3 d:hidden" />
        <div aria-hidden className="text-[32px] leading-none">
          🧹
        </div>
        <h2 id="reset-title" className="m-0 text-[19px] font-bold tracking-[-0.025em]">
          Reset all progress?
        </h2>
        <p id="reset-body" className="m-0 max-w-[300px] text-[13.5px] text-ink2 text-pretty">
          This unticks all {count} completed {count === 1 ? 'task' : 'tasks'}, on every device. It can&apos;t be undone.
        </p>
        <div className="mt-3.5 flex w-full flex-col gap-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="min-h-[46px] rounded-[13px] border-0 bg-red-solid text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
          >
            Reset progress
          </button>
          <button ref={cancelRef} type="button" onClick={onCancel} className="min-h-[46px] rounded-[13px] border-0 bg-card2 text-[15px] font-semibold text-ink">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
