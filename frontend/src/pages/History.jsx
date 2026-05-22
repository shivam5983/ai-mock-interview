import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessionHistory } from '../api'

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function ScoreBadge({ score }) {
  const color =
    score >= 8 ? 'text-green-400 bg-green-400/10 border-green-400/20' :
    score >= 6 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
    'text-red-400 bg-red-400/10 border-red-400/20'
  return (
    <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg border ${color}`}>
      {score.toFixed(1)} / 10
    </span>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSessionHistory()
      .then((res) => setSessions(res.data.sessions))
      .catch(() => setError('Failed to load session history.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 border-b border-[#21262d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-400">◆</span>
          <span className="font-display font-bold text-white">InterviewAI</span>
        </div>
        <button className="btn-secondary text-sm py-2" onClick={() => navigate('/')}>
          ← Home
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8 animate-fade-up">
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Past Sessions
          </h1>
          <p className="text-[#8b949e]">Your interview history and performance</p>
        </div>

        {loading && (
          <div className="text-center py-20 text-[#484f58]">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading history...
          </div>
        )}

        {error && (
          <div className="card p-6 text-center text-red-400">{error}</div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-[#8b949e] text-lg mb-4">No sessions yet</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Start Your First Interview
            </button>
          </div>
        )}

        <div className="space-y-4">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className="card overflow-hidden animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Session header */}
              <button
                className="w-full p-5 flex items-center justify-between gap-4 hover:bg-[#1c2128] transition-colors text-left"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {s.total_score.toFixed(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-white truncate">{s.job_role}</div>
                    <div className="text-xs text-[#484f58]">{formatDate(s.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ScoreBadge score={s.total_score} />
                  <span className="text-[#484f58] text-xs">
                    {expanded === s.id ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === s.id && (
                <div className="border-t border-[#21262d] p-5 space-y-4">
                  {s.questions.map((q, qi) => (
                    <div key={qi} className="bg-[#0d1117] rounded-xl p-4 border border-[#21262d]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="tag text-xs">Q{qi + 1}</span>
                        <span className="font-mono text-xs text-amber-400">
                          {s.scores[qi]} / 10
                        </span>
                      </div>
                      <p className="text-[#e6edf3] text-sm font-medium mb-2">{q}</p>
                      <p className="text-[#8b949e] text-sm mb-2 leading-relaxed">
                        <span className="text-[#484f58]">Answer: </span>
                        {s.answers[qi]}
                      </p>
                      <p className="text-amber-400/80 text-sm leading-relaxed bg-amber-400/5 rounded-lg p-3 border border-amber-400/10">
                        <span className="text-amber-400/50">Feedback: </span>
                        {s.feedbacks[qi]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
