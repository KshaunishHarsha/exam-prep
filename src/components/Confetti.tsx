'use client'

import { useState } from 'react'

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FFCC00', '#AF52DE', '#FF2D55', '#5AC8FA']

interface Piece {
  w: number
  h: number
  color: string
  radius: number
  dx: number
  dy: number
  rot: number
  ms: number
}

function makePieces(count: number, spread: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random()
    const a = (i / count) * Math.PI * 2 + r * 0.5
    const dist = (50 + Math.random() * 80) * spread
    return {
      w: 6 + r * 4,
      h: 8 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      radius: i % 3 ? 2 : 99,
      dx: Math.cos(a) * dist,
      dy: Math.sin(a) * dist - 20,
      rot: r * 600 - 300,
      ms: 800 + Math.random() * 600,
    }
  })
}

interface Props {
  /** Positions the burst origin inside the nearest positioned ancestor. */
  className: string
  count?: number
  spread?: number
}

/** A one-shot burst of confetti. The pieces are fixed at mount so re-renders don't restart the animation. */
export function Confetti({ className, count = 22, spread = 1 }: Props) {
  const [pieces] = useState(() => makePieces(count, spread))
  return (
    <div aria-hidden className={`pointer-events-none absolute z-[5] size-0 ${className}`}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute left-0 top-0"
          style={
            {
              width: p.w,
              height: p.h,
              background: p.color,
              borderRadius: p.radius,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--r': `${p.rot}deg`,
              animation: `ept-burst ${p.ms}ms cubic-bezier(.15,.8,.3,1) forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
