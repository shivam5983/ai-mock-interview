import { useEffect, useRef } from 'react'

const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function CircularTimer({ seconds, total = 60, onExpire }) {
  const prevRef = useRef(seconds)

  useEffect(() => {
    if (seconds === 0 && prevRef.current > 0) {
      onExpire?.()
    }
    prevRef.current = seconds
  }, [seconds, onExpire])

  const progress = seconds / total
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const color =
    seconds <= 10 ? '#ef4444' :
    seconds <= 20 ? '#f5a623' :
    '#4ade80'

  const bgColor =
    seconds <= 10 ? 'rgba(239,68,68,0.1)' :
    seconds <= 20 ? 'rgba(245,166,35,0.1)' :
    'rgba(74,222,128,0.1)'

  const isUrgent = seconds <= 10

  return (
    <div
      className="relative flex items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: 80, height: 80,
        background: bgColor,
        boxShadow: isUrgent ? `0 0 12px ${color}40` : 'none',
      }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90 absolute">
        {/* Background track */}
        <circle
          cx="40" cy="40" r={RADIUS}
          stroke="#21262d" strokeWidth="5"
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx="40" cy="40" r={RADIUS}
          stroke={color} strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="score-ring"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      {/* Number */}
      <span
        className="relative z-10 font-mono font-bold text-lg tabular-nums"
        style={{ color, transition: 'color 0.3s' }}
      >
        {seconds}
      </span>
    </div>
  )
}
