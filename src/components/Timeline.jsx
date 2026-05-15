import { useExperiments } from '../context/ExperimentContext'
import { CATEGORY_COLORS, DECISION_LABELS } from '../utils/helpers'

export default function Timeline() {
  const { state } = useExperiments()
  const { experiments } = state

  const events = []
  experiments.forEach(exp => {
    const color = CATEGORY_COLORS[exp.category] || 'var(--accent-lime)'
    events.push({
      date: exp.createdAt,
      type: 'created',
      experiment: exp.title,
      content: `Designed PACT: ${exp.title}`,
      color,
    })
    exp.logs.forEach(log => {
      events.push({
        date: log.date + 'T00:00:00',
        type: 'log',
        experiment: exp.title,
        content: `ACT \u2014 Mood ${log.mood}/5, Effort: ${log.effort}${log.note ? ' \u2014 ' + log.note : ''}`,
        color,
      })
    })
    if (exp.reflection) {
      events.push({
        date: exp.reflection.date + 'T00:00:00',
        type: 'reflection',
        experiment: exp.title,
        content: `REACT \u2014 Decision to ${DECISION_LABELS[exp.reflection.decision] || exp.reflection.decision}`,
        color,
      })
    }
  })

  events.sort((a, b) => new Date(b.date) - new Date(a.date))

  if (events.length === 0) {
    return (
      <div className="content-page">
        <div className="page-header">
          <div className="subtitle">Chronicle</div>
          <div className="display-lg">Timeline</div>
        </div>
        <div className="empty-state">
          <div className="display-md">No activity yet</div>
          <p className="body-text" style={{ marginBottom: 24 }}>Start logging to see your timeline come alive.</p>
        </div>
      </div>
    )
  }

  const typeMap = { log: 'ACT', created: 'PACT', reflection: 'REACT' }

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="subtitle">Chronicle</div>
        <div className="display-lg">Timeline</div>
      </div>
      <div className="timeline">
        {events.map((event, i) => {
          const date = new Date(event.date)
          const typeStr = typeMap[event.type] || event.type.toUpperCase()
          return (
            <div key={i} className="timeline-entry" style={{ '--timeline-color': event.color }}>
              <div className="timeline-date">{date.toLocaleDateString()}</div>
              <div className="timeline-type">{typeStr}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{event.experiment}</div>
              <div className="timeline-content">{event.content}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
