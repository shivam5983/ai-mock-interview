function ScoreBar({ label, score, delay = 0 }) {
  const color =
    score >= 7 ? '#4ade80' :
    score >= 4 ? '#f5a623' :
    '#ef4444'

  const bg =
    score >= 7 ? 'rgba(74,222,128,0.1)' :
    score >= 4 ? 'rgba(245,166,35,0.1)' :
    'rgba(239,68,68,0.1)'

  return (
    <div className="space-y-1.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#8b949e]">{label}</span>
        <span className="font-mono text-sm font-bold" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${score * 10}%`,
            background: color,
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  )
}

// Simple SVG Radar Chart
function RadarChart({ scores }) {
  const categories = [
    { key: 'technical_knowledge', label: 'Technical' },
    { key: 'communication_clarity', label: 'Clarity' },
    { key: 'confidence_level', label: 'Confidence' },
    { key: 'overall_score', label: 'Overall' },
  ]

  const size = 180
  const center = size / 2
  const maxR = 70
  const levels = 5

  // Calculate polygon points for a score (0-10)
  function polarToXY(angle, r) {
    const rad = (angle - 90) * (Math.PI / 180)
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    }
  }

  const angleStep = 360 / categories.length

  // Grid polygons
  const gridPolygons = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1)
    const pts = categories.map((_, ci) => {
      const p = polarToXY(ci * angleStep, r)
      return `${p.x},${p.y}`
    })
    return pts.join(' ')
  })

  // Data polygon
  const dataPoints = categories.map((cat, i) => {
    const val = scores[cat.key] || 0
    const r = (val / 10) * maxR
    return polarToXY(i * angleStep, r)
  })
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Axis lines
  const axes = categories.map((_, i) => {
    const end = polarToXY(i * angleStep, maxR)
    return { x: center, y: center, x2: end.x, y2: end.y }
  })

  // Label positions
  const labels = categories.map((cat, i) => {
    const pos = polarToXY(i * angleStep, maxR + 18)
    return { ...pos, label: cat.label }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth="1" />
      ))}
      {/* Axes */}
      {axes.map((a, i) => (
        <line key={i} x1={a.x} y1={a.y} x2={a.x2} y2={a.y2} stroke="#30363d" strokeWidth="1" />
      ))}
      {/* Data */}
      <polygon
        points={dataPolygon}
        fill="rgba(245,166,35,0.2)"
        stroke="#f5a623"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#f5a623" stroke="#0d1117" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {labels.map((l, i) => (
        <text
          key={i} x={l.x} y={l.y}
          textAnchor="middle" dominantBaseline="middle"
          fill="#8b949e" fontSize="9" fontFamily="DM Sans"
        >
          {l.label}
        </text>
      ))}
    </svg>
  )
}

export default function ScoreBreakdown({ detailedScores, tips = [] }) {
  if (!detailedScores) return null

  const categories = [
    { key: 'technical_knowledge', label: 'Technical Knowledge' },
    { key: 'communication_clarity', label: 'Communication Clarity' },
    { key: 'confidence_level', label: 'Confidence Level' },
    { key: 'overall_score', label: 'Overall Score' },
  ]

  const weakAreas = categories
    .filter(c => (detailedScores[c.key] || 0) < 6)
    .map(c => c.label)

  return (
    <div className="space-y-4 mt-3">
      {/* Score bars */}
      <div className="space-y-3">
        {categories.map((cat, i) => (
          <ScoreBar
            key={cat.key}
            label={cat.label}
            score={detailedScores[cat.key] || 0}
            delay={i * 100}
          />
        ))}
      </div>

      {/* Radar chart */}
      <div className="flex justify-center pt-2">
        <RadarChart scores={detailedScores} />
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="bg-[#0d1117] rounded-xl p-3 border border-[#21262d] space-y-1.5">
          <p className="text-xs text-amber-400/70 uppercase tracking-wider font-medium mb-2">
            💡 Improvement Tips
          </p>
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2 text-xs text-[#8b949e]">
              <span className="text-amber-400 flex-shrink-0">→</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
