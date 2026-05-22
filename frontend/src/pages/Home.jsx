import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startInterview } from '../api'

const ROLES = [
  { label: 'Software Engineer', icon: '⚙️' },
  { label: 'Data Analyst', icon: '📊' },
  { label: 'Product Manager', icon: '🧭' },
  { label: 'Frontend Developer', icon: '🎨' },
  { label: 'Backend Developer', icon: '🔧' },
  { label: 'ML Engineer', icon: '🤖' },
  { label: 'DevOps Engineer', icon: '🚀' },
  { label: 'Data Scientist', icon: '🔬' },
]

export default function Home() {
  const [jobRole, setJobRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleStart = async () => {
    if (!jobRole.trim()) {
      setError('Please enter or select a job role')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await startInterview(jobRole.trim())
      navigate('/interview', {
        state: {
          questions: res.data.questions,
          jobRole: res.data.job_role,
        },
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Nav */}
      <nav className="px-8 py-5 flex items-center justify-between border-b border-[#21262d]">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xl">◆</span>
          <span className="font-display font-bold text-lg text-white">InterviewAI</span>
        </div>
        <button
          onClick={() => navigate('/history')}
          className="btn-secondary text-sm py-2"
        >
          Past Sessions
        </button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          {/* Badge */}
          <div className="animate-fade-up flex justify-center mb-8">
            <span className="tag flex items-center gap-2 py-2 px-4">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
              Powered by Claude AI
            </span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-up-delay-1 font-display text-5xl sm:text-6xl text-center leading-tight mb-4">
            Ace Your Next
            <br />
            <span className="gradient-text italic">Interview</span>
          </h1>

          <p className="animate-fade-up-delay-2 text-center text-[#8b949e] text-lg mb-12 font-light">
            Practice with AI-powered mock interviews tailored to your role.
            <br />Get instant feedback and scores on every answer.
          </p>

          {/* Card */}
          <div className="animate-fade-up-delay-3 card p-8">
            <label className="block text-sm font-medium text-[#8b949e] mb-2 uppercase tracking-wider">
              Target Role
            </label>
            <input
              type="text"
              className="input-field text-lg mb-4"
              placeholder="e.g. Software Engineer, Data Analyst..."
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />

            {/* Quick Select */}
            <div className="flex flex-wrap gap-2 mb-6">
              {ROLES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setJobRole(r.label)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-all duration-150
                    ${jobRole === r.label
                      ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                      : 'border-[#30363d] text-[#8b949e] hover:border-[#484f58] hover:text-[#e6edf3]'
                    }`}
                >
                  <span>{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generating Questions...
                </>
              ) : (
                <>Start Interview <span className="text-lg">→</span></>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="animate-fade-up-delay-4 grid grid-cols-3 gap-4 mt-8">
            {[
              { val: '5', label: 'Questions' },
              { val: 'AI', label: 'Feedback' },
              { val: '10', label: 'Max Score' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl text-amber-400 font-bold">{s.val}</div>
                <div className="text-xs text-[#484f58] uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
