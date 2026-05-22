import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { saveSession } from '../api'
import ScoreBreakdown from '../components/ScoreBreakdown'

function ScoreRing({ score, size = 80 }) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 10) * circumference
  const color = score >= 8 ? '#4ade80' : score >= 6 ? '#f5a623' : score >= 4 ? '#fb923c' : '#f87171'

  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={radius} stroke="#21262d" strokeWidth="5" fill="none" />
      <circle cx="35" cy="35" r={radius} stroke={color} strokeWidth="5" fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 35 35)" className="score-ring" />
      <text x="35" y="35" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="13" fontWeight="700" fontFamily="'JetBrains Mono',monospace">
        {score}
      </text>
    </svg>
  )
}

function OverallRadarChart({ results }) {
  const categories = [
    { key: 'technical_knowledge', label: 'Technical' },
    { key: 'communication_clarity', label: 'Clarity' },
    { key: 'confidence_level', label: 'Confidence' },
    { key: 'overall_score', label: 'Overall' },
  ]

  // Average each category across all questions
  const avgScores = {}
  categories.forEach(cat => {
    const vals = results
      .map(r => r.detailedScores?.[cat.key])
      .filter(v => v !== undefined)
    avgScores[cat.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  })

  const size = 220, center = 110, maxR = 85, levels = 5
  const angleStep = 360 / categories.length

  function polar(angle, r) {
    const rad = (angle - 90) * Math.PI / 180
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) }
  }

  const grids = Array.from({ length: levels }, (_, i) => {
    const r = (maxR / levels) * (i + 1)
    return categories.map((_, ci) => {
      const p = polar(ci * angleStep, r)
      return `${p.x},${p.y}`
    }).join(' ')
  })

  const dataPts = categories.map((cat, i) => polar(i * angleStep, (avgScores[cat.key] / 10) * maxR))
  const dataPolygon = dataPts.map(p => `${p.x},${p.y}`).join(' ')
  const labelPts = categories.map((cat, i) => ({ ...polar(i * angleStep, maxR + 20), label: cat.label }))

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-[#8b949e] uppercase tracking-wider mb-3">Overall Performance</p>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {grids.map((pts, i) => <polygon key={i} points={pts} fill="none" stroke="#30363d" strokeWidth="1" />)}
        {categories.map((_, i) => {
          const end = polar(i * angleStep, maxR)
          return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#30363d" strokeWidth="1" />
        })}
        <polygon points={dataPolygon} fill="rgba(245,166,35,0.2)" stroke="#f5a623" strokeWidth="2.5" strokeLinejoin="round" />
        {dataPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="5" fill="#f5a623" stroke="#0d1117" strokeWidth="2" />)}
        {labelPts.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
            fill="#8b949e" fontSize="10" fontFamily="DM Sans">{l.label}</text>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
        {categories.map(cat => (
          <div key={cat.key} className="flex items-center gap-2 text-xs">
            <span className="text-[#484f58]">{cat.label}:</span>
            <span className="font-mono font-bold text-amber-400">{avgScores[cat.key].toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getGrade(avg) {
  if (avg >= 9) return { label: 'Exceptional', color: 'text-green-400' }
  if (avg >= 7.5) return { label: 'Strong', color: 'text-amber-400' }
  if (avg >= 6) return { label: 'Good', color: 'text-orange-400' }
  if (avg >= 4) return { label: 'Needs Work', color: 'text-red-400' }
  return { label: 'Keep Practicing', color: 'text-red-500' }
}

export default function Results() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { results = [], jobRole = '' } = state || {}
  const saved = useRef(false)
  const [saveError, setSaveError] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!results.length) navigate('/')
  }, [results, navigate])

  useEffect(() => {
    if (results.length && !saved.current) {
      saved.current = true
      saveSession({
        job_role: jobRole,
        questions: results.map(r => r.question),
        answers: results.map(r => r.answer),
        feedbacks: results.map(r => r.feedback),
        scores: results.map(r => r.score),
        detailed_scores: results.map(r => r.detailedScores || {}),
      }).catch(() => setSaveError('Could not save session to history.'))
    }
  }, [results, jobRole])

  if (!results.length) return null

  const avg = results.reduce((a, r) => a + r.score, 0) / results.length
  const grade = getGrade(avg)
  const hasDetailedScores = results.some(r => r.detailedScores)

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 border-b border-[#21262d] flex items-center justify-between sticky top-0 bg-[#0d1117] z-10">
        <div className="flex items-center gap-2">
          <span className="text-amber-400">◆</span>
          <span className="font-display font-bold text-white">InterviewAI</span>
        </div>
        <span className="tag">{jobRole}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <div className="animate-fade-up card p-8 text-center">
          <p className="text-[#8b949e] text-xs uppercase tracking-widest mb-3">Interview Complete</p>
          <h2 className="font-display text-4xl font-bold text-white mb-1">
            You scored <span className="gradient-text">{avg.toFixed(1)}</span>
            <span className="text-[#484f58] text-2xl"> / 10</span>
          </h2>
          <p className={`text-lg font-medium mt-2 ${grade.color}`}>{grade.label}</p>

          <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-[#21262d]">
            {[
              { val: results.length, label: 'Questions' },
              { val: results.reduce((a, r) => a + r.score, 0).toFixed(1), label: 'Total Points', color: 'text-amber-400' },
              { val: results.filter(r => r.score >= 7).length, label: 'Strong Answers' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`font-display text-2xl font-bold ${s.color || 'text-white'}`}>{s.val}</div>
                <div className="text-xs text-[#484f58] uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Radar */}
        {hasDetailedScores && (
          <div className="animate-fade-up-1 card p-6">
            <OverallRadarChart results={results} />
          </div>
        )}

        {saveError && (
          <div className="text-yellow-400 text-sm bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-4 py-3">
            ⚠️ {saveError}
          </div>
        )}

        {/* Per-question */}
        <div className="space-y-4">
          {results.map((r, i) => (
            <div key={i} className="card p-6 animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex items-start gap-4">
                <ScoreRing score={r.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="tag">Q{i + 1}</span>
                    <span className="text-xs text-[#484f58]">
                      {r.score >= 8 ? '🌟 Excellent' : r.score >= 6 ? '✅ Good' : '⚡ Room to grow'}
                    </span>
                  </div>
                  <p className="text-[#e6edf3] font-medium mb-3 leading-snug">{r.question}</p>

                  <div className="bg-[#0d1117] rounded-xl p-3 mb-3 border border-[#21262d]">
                    <p className="text-xs text-[#484f58] uppercase tracking-wider mb-1">Your Answer</p>
                    <p className="text-[#8b949e] text-sm leading-relaxed">{r.answer}</p>
                  </div>

                  <div className="bg-amber-400/5 rounded-xl p-3 border border-amber-400/10 mb-3">
                    <p className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">AI Feedback</p>
                    <p className="text-[#c9d1d9] text-sm leading-relaxed">{r.feedback}</p>
                  </div>

                  {/* Detailed scores toggle */}
                  {r.detailedScores && (
                    <>
                      <button
                        onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                        className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors flex items-center gap-1"
                      >
                        {expanded[i] ? '▲ Hide breakdown' : '▼ Score breakdown'}
                      </button>
                      {expanded[i] && (
                        <div className="mt-3 animate-fade-in">
                          <ScoreBreakdown detailedScores={r.detailedScores} tips={r.tips} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => navigate('/')}>
            Try Again ↺
          </button>
          <button className="btn-secondary flex-1 text-center" onClick={() => navigate('/history')}>
            View History
          </button>
        </div>
      </main>
    </div>
  )
}
