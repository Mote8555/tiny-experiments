import { useExperiments } from '../context/ExperimentContext'
import { CATEGORY_COLORS, CATEGORIES, calculateStreak } from '../utils/helpers'

export default function Dashboard({ switchSection, setDetailId }) {
  const { state } = useExperiments()
  const { experiments } = state

  const active = experiments.filter(e => e.status === 'active')
  const completed = experiments.filter(e => e.status === 'completed')
  const totalLogs = experiments.reduce((s, e) => s + e.logs.length, 0)
  const allMoods = experiments.flatMap(e => e.logs.map(l => l.mood))
  const avgMood = allMoods.length ? (allMoods.reduce((a, b) => a + b, 0) / allMoods.length).toFixed(1) : '\u2014'
  const totalStreak = Math.max(...experiments.map(e => calculateStreak(e.logs)), 0)

  const rightColor = active.length > 0 && active[0].category
    ? CATEGORY_COLORS[active[0].category] || 'var(--accent-lime)'
    : 'var(--accent-lime)'

  return (
    <div className="hero-split">
      <div className="hero-left">
        <div>
          <div className="display-xl" style={{ marginBottom: 24 }}>
            Tiny<br />Experiments
          </div>
          <p className="body-text" style={{ marginBottom: 32 }}>
            Design small, time-boxed PACTs to learn about yourself through structured curiosity.
          </p>
          <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="stat-item">
              <div className="stat-number">{active.length}</div>
              <div className="stat-label">Active PACTs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{completed.length}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{totalLogs}</div>
              <div className="stat-label">Total Logs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{avgMood}</div>
              <div className="stat-label">Avg Mood</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{totalStreak}</div>
              <div className="stat-label">Best Streak</div>
            </div>
          </div>
          <button className="link-underline" onClick={() => switchSection('create')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            Design Your First PACT
          </button>
        </div>
      </div>
      <div className="hero-right" style={{ background: rightColor }}>
        <div>
          <div className="display-lg" style={{ marginBottom: 24, color: 'var(--bg-darker)' }}>
            Active PACTs
          </div>
          {active.length === 0 ? (
            <>
              <p className="body-text body-text-light" style={{ maxWidth: 320 }}>
                No active experiments yet. Start your first PACT and watch your dashboard come alive.
              </p>
              <button className="link-underline" onClick={() => switchSection('create')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bg-darker)', borderColor: 'var(--bg-darker)' }}>
                Design Your First PACT
              </button>
            </>
          ) : (
            active.slice(0, 3).map(exp => {
              const lastLog = exp.logs[exp.logs.length - 1]
              const catLabel = CATEGORIES.find(c => c.key === exp.category)?.label || ''
              const color = CATEGORY_COLORS[exp.category] || 'var(--accent-lime)'
              return (
                <div key={exp.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(26,26,46,0.15)', cursor: 'pointer' }} onClick={() => setDetailId(exp.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 11, color: 'rgba(26,26,46,0.6)', letterSpacing: 2, textTransform: 'uppercase' }}>{catLabel}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--bg-darker)', marginBottom: 6 }}>{exp.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(26,26,46,0.7)', marginBottom: 12 }}>{exp.logs.length} logs &middot; {exp.duration} days</div>
                  {lastLog && <div style={{ fontSize: 12, color: 'rgba(26,26,46,0.6)', marginBottom: 12 }}>Last: {lastLog.date} (Mood {lastLog.mood}/5)</div>}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
