import { useExperiments } from '../context/ExperimentContext'
import { CATEGORY_COLORS, CATEGORIES, DECISION_LABELS, calculateProgress, currentDay } from '../utils/helpers'

export default function ExperimentDetailModal({ experimentId, onClose }) {
  const { state } = useExperiments()
  const exp = state.experiments.find(e => e.id === experimentId)
  if (!exp) return null

  const color = CATEGORY_COLORS[exp.category] || 'var(--accent-lime)'
  const catLabel = CATEGORIES.find(c => c.key === exp.category)?.label || ''

  const events = []
  events.push({
    date: exp.createdAt,
    type: 'created',
    content: `Designed PACT`,
  })
  exp.logs.forEach(log => {
    events.push({
      date: log.date + 'T00:00:00',
      type: 'log',
      content: `ACT \u2014 Mood ${log.mood}/5, Effort: ${log.effort}${log.note ? ' \u2014 ' + log.note : ''}`,
    })
  })
  if (exp.reflection) {
    events.push({
      date: exp.reflection.date + 'T00:00:00',
      type: 'reflection',
      content: `REACT \u2014 Decision to ${DECISION_LABELS[exp.reflection.decision] || exp.reflection.decision}`,
    })
  }
  events.sort((a, b) => new Date(b.date) - new Date(a.date))

  const typeMap = { log: 'ACT', created: 'PACT', reflection: 'REACT' }

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{catLabel}</span>
          <span className={`tag ${exp.status === 'active' ? 'filled' : ''}`}>{exp.status.toUpperCase()}</span>
        </div>
        <div className="modal-header">{exp.title}</div>
        <div className="modal-subtitle">{exp.hypothesis}</div>

        <div className="progress-bar-container" style={{ marginBottom: 24 }}>
          <div className="progress-label">
            <span>Day {currentDay(exp)} of {exp.duration}</span>
            <span>{calculateProgress(exp)}%</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${calculateProgress(exp)}%`, background: color }} />
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
          Started {new Date(exp.createdAt).toLocaleDateString()} &middot; {exp.logs.length} logs
          {exp.logs.length > 0 && ` &middot; Last log: ${exp.logs[exp.logs.length - 1].date}`}
        </div>

        {exp.logs.length === 0 && !exp.reflection ? (
          <div className="empty-state">
            <div className="display-md" style={{ fontSize: 24 }}>No activity yet</div>
            <p className="body-text">Start logging to build your experiment timeline.</p>
          </div>
        ) : (
          <div className="detail-timeline">
            <div className="timeline">
              {events.map((event, i) => {
                const date = new Date(event.date)
                return (
                  <div key={i} className="timeline-entry" style={{ '--timeline-color': color }}>
                    <div className="timeline-date">{date.toLocaleDateString()}</div>
                    <div className="timeline-type">{typeMap[event.type] || event.type.toUpperCase()}</div>
                    <div className="timeline-content">{event.content}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {exp.reflection && (
          <div className="reflection-block" style={{ marginTop: 24 }}>
            <div className="reflection-title">REACT Summary</div>
            <div className="reflection-content">
              {exp.reflection.plus && <p><strong style={{ color: 'var(--accent-mint)' }}>+ Plus:</strong> {exp.reflection.plus}</p>}
              {exp.reflection.minus && <p><strong style={{ color: 'var(--accent-coral)' }}>&minus; Minus:</strong> {exp.reflection.minus}</p>}
              {exp.reflection.next && <p><strong style={{ color: 'var(--accent-lime)' }}>&rarr; Next:</strong> {exp.reflection.next}</p>}
            </div>
            <div className="reflection-decision">{DECISION_LABELS[exp.reflection.decision] || exp.reflection.decision}</div>
          </div>
        )}
      </div>
    </div>
  )
}
