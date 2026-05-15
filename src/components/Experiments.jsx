import { useExperiments } from '../context/ExperimentContext'
import { CATEGORIES, CATEGORY_COLORS, DECISION_LABELS, calculateProgress, currentDay, calculateStreak, isExperimentExpired } from '../utils/helpers'

function ProgressBar({ experiment }) {
  const pct = calculateProgress(experiment)
  const day = currentDay(experiment)
  const color = CATEGORY_COLORS[experiment.category] || 'var(--accent-lime)'
  return (
    <div className="progress-bar-container">
      <div className="progress-label">
        <span>Day {day} of {experiment.duration}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function ExperimentCard({ experiment, onLog, onReact, onDetail, onDelete, onUpdateStatus }) {
  const catLabel = CATEGORIES.find(c => c.key === experiment.category)?.label || ''
  const color = CATEGORY_COLORS[experiment.category] || 'var(--accent-lime)'
  const streak = calculateStreak(experiment.logs)
  const expired = isExperimentExpired(experiment)

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{catLabel}</span>
            {streak > 1 && (
              <span className="streak-badge">{streak} day streak</span>
            )}
            {expired && <span className="expired-badge">Duration ended</span>}
          </div>
          <div className="display-md" style={{ fontSize: 28, cursor: 'pointer' }} onClick={() => onDetail(experiment.id)}>
            {experiment.title}
          </div>
        </div>
        <span className={`tag ${experiment.status === 'active' ? 'filled' : ''}`}>{experiment.status.toUpperCase()}</span>
      </div>
      <ProgressBar experiment={experiment} />
      <p className="body-text" style={{ marginBottom: 16, maxWidth: '100%' }}>{experiment.hypothesis}</p>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
        Duration: {experiment.duration} days &middot; Started {new Date(experiment.createdAt).toLocaleDateString()}
      </div>

      {experiment.logs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="subtitle" style={{ marginBottom: 12 }}>Recent Logs</div>
          {experiment.logs.slice(-3).reverse().map((log, i) => (
            <div key={i} className="log-entry">
              <div className="log-date">{log.date}</div>
              <div className="log-meta">Mood: {log.mood}/5 &middot; Effort: {log.effort}</div>
              {log.internal && <div className="log-note">Internal: {log.internal}</div>}
              {log.external && <div className="log-note">External: {log.external}</div>}
              {log.note && <div className="log-note">{log.note}</div>}
            </div>
          ))}
        </div>
      )}

      {experiment.reflection && (
        <div className="reflection-block">
          <div className="reflection-title">Latest REACT</div>
          <div className="reflection-content">
            {experiment.reflection.plus && <p><strong style={{ color: 'var(--accent-mint)' }}>+ Plus:</strong> {experiment.reflection.plus}</p>}
            {experiment.reflection.minus && <p><strong style={{ color: 'var(--accent-coral)' }}>&minus; Minus:</strong> {experiment.reflection.minus}</p>}
            {experiment.reflection.next && <p><strong style={{ color: 'var(--accent-lime)' }}>&rarr; Next:</strong> {experiment.reflection.next}</p>}
            {experiment.reflection.impact && <p><strong>Impact:</strong> {experiment.reflection.impact}</p>}
          </div>
          <div className="reflection-decision">{DECISION_LABELS[experiment.reflection.decision] || experiment.reflection.decision}</div>
        </div>
      )}

      <div className="action-bar">
        <button className="btn-primary" onClick={() => onLog(experiment.id)}>Log</button>
        <button className="btn-secondary" onClick={() => onReact(experiment.id)}>REACT</button>
        {experiment.status === 'active' && (
          <>
            <button className="btn-text" onClick={() => onUpdateStatus(experiment.id, 'paused')}>Pause</button>
            <button className="btn-text" onClick={() => onUpdateStatus(experiment.id, 'completed')}>Complete</button>
          </>
        )}
        {experiment.status !== 'active' && (
          <button className="btn-text" onClick={() => onUpdateStatus(experiment.id, 'active')}>Resume</button>
        )}
        <button className="btn-text" style={{ color: 'var(--accent-coral)' }} onClick={() => onDelete(experiment.id)}>Delete</button>
      </div>
    </div>
  )
}

export default function Experiments({ switchSection, setDetailId, onOpenLog, onOpenReflection }) {
  const { state, dispatch, softDelete, updateStatus } = useExperiments()
  const { experiments } = state

  const active = experiments.filter(e => e.status === 'active')
  const paused = experiments.filter(e => e.status === 'paused')
  const completed = experiments.filter(e => e.status === 'completed')

  const expired = active.filter(e => isExperimentExpired(e))

  if (experiments.length === 0) {
    return (
      <div className="content-page">
        <div className="page-header">
          <div className="subtitle">Your Journey</div>
          <div className="display-lg">Experiments</div>
        </div>
        <div className="empty-state">
          <div className="display-md">No experiments yet</div>
          <p className="body-text" style={{ marginBottom: 24 }}>Start your journey by designing your first PACT.</p>
          <button className="btn-primary" onClick={() => switchSection('create')}>Design a PACT</button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="subtitle">Your Journey</div>
        <div className="display-lg">Experiments</div>
      </div>

      {expired.length > 0 && (
        <div className="end-of-experiment-banner">
          <h3>Experiments Ended</h3>
          {expired.map(exp => (
            <p key={exp.id}>
              {exp.title} &mdash; duration has passed. Consider completing a final REACT reflection.
              {' '}
              <button className="btn-text" style={{ color: 'var(--accent-lime)' }} onClick={() => onOpenReflection(exp.id)}>REACT now</button>
              {' or '}
              <button className="btn-text" style={{ color: 'var(--accent-coral)' }} onClick={() => updateStatus(exp.id, 'completed')}>mark complete</button>
            </p>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <>
          <div className="subtitle" style={{ marginBottom: 20 }}>Active</div>
          {active.map(exp => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              onLog={onOpenLog}
              onReact={onOpenReflection}
              onDetail={setDetailId}
              onDelete={softDelete}
              onUpdateStatus={updateStatus}
            />
          ))}
        </>
      )}
      {paused.length > 0 && (
        <>
          <div className="subtitle" style={{ margin: '40px 0 20px' }}>Paused</div>
          {paused.map(exp => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              onLog={onOpenLog}
              onReact={onOpenReflection}
              onDetail={setDetailId}
              onDelete={softDelete}
              onUpdateStatus={updateStatus}
            />
          ))}
        </>
      )}
      {completed.length > 0 && (
        <>
          <div className="subtitle" style={{ margin: '40px 0 20px' }}>Completed</div>
          {completed.map(exp => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              onLog={onOpenLog}
              onReact={onOpenReflection}
              onDetail={setDetailId}
              onDelete={softDelete}
              onUpdateStatus={updateStatus}
            />
          ))}
        </>
      )}
    </div>
  )
}
