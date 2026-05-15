import { useState, useEffect } from 'react'
import { useExperiments } from '../context/ExperimentContext'

export default function LogModal({ onClose }) {
  const { state, addLog } = useExperiments()
  const { currentExperimentId, experiments } = state
  const exp = experiments.find(e => e.id === currentExperimentId)
  const [effort, setEffort] = useState('')
  const [mood, setMood] = useState(3)
  const [internal, setInternal] = useState('')
  const [external, setExternal] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const close = onClose

  const submit = () => {
    if (!effort) { setError('Please select effort level'); return }
    if (!currentExperimentId) return
    addLog(currentExperimentId, {
      date: new Date().toISOString().split('T')[0],
      effort,
      mood,
      internal: internal.trim(),
      external: external.trim(),
      note: note.trim(),
    })
    setEffort('')
    setMood(3)
    setInternal('')
    setExternal('')
    setNote('')
    setError('')
    close()
  }

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <button className="modal-close" onClick={close}>&times;</button>
        <div className="modal-header">Daily Log</div>
        <div className="modal-subtitle">ACT Phase &mdash; Withhold Judgment</div>
        {exp && <div className="modal-subtitle" style={{ marginTop: -24, color: 'var(--text-secondary)' }}>{exp.title}</div>}
        <div className="form-group">
          <label>Effort Level</label>
          <select value={effort} onChange={e => { setEffort(e.target.value); setError('') }}>
            <option value="">Select</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {error && <div className="validation-error">{error}</div>}
        </div>
        <div className="form-group">
          <label>Mood (1&ndash;5)</label>
          <input type="number" min="1" max="5" value={mood} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) setMood(Math.max(1, Math.min(5, v))) }} />
        </div>
        <div className="form-group">
          <label>Internal Signals</label>
          <textarea value={internal} onChange={e => setInternal(e.target.value)} placeholder="How do you feel? Energy, motivation, resistance..." />
        </div>
        <div className="form-group">
          <label>External Signals</label>
          <textarea value={external} onChange={e => setExternal(e.target.value)} placeholder="What happened? Results, feedback, observable outcomes..." />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Anything else worth noting today?" />
        </div>
        <div className="action-bar">
          <button className="btn-primary" onClick={submit}>Save Log</button>
          <button className="btn-secondary" onClick={close}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
