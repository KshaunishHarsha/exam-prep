'use client'

import { useEffect, useState } from 'react'

const COLORS = { light: '#f5f5f7', dark: '#000000' }

function currentIsDark() {
  const t = document.documentElement.dataset.theme
  return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setDark(currentIsDark())
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  function toggle() {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('ept-theme', next)
    } catch {}
    // Keep the browser chrome in step with a manual choice.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', COLORS[next]))
    setDark(!dark)
  }

  const knob = 'flex size-7 items-center justify-center rounded-full transition-[background,opacity] duration-[250ms]'
  return (
    <div role="region" aria-label="Appearance">
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      className="hit fixed right-[14px] top-[14px] z-30 flex items-center gap-0.5 rounded-full border border-line bg-bar p-0.5 shadow-card backdrop-blur-[20px] backdrop-saturate-[1.8] d:right-5 d:top-5"
    >
      <span className={`${knob} text-sm ${dark ? 'bg-transparent opacity-45' : 'bg-seg-on opacity-100 shadow-[0_1px_3px_rgba(0,0,0,0.12)]'}`}>☀️</span>
      <span className={`${knob} text-[13px] ${dark ? 'bg-seg-on opacity-100 shadow-[0_1px_3px_rgba(0,0,0,0.3)]' : 'bg-transparent opacity-45'}`}>🌙</span>
    </button>
    </div>
  )
}
