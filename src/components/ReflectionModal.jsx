import { useState, useEffect } from 'react'
import { useExperiments } from '../context/ExperimentContext'

export default function ReflectionModal({ onClose }) {
  const { state, addReflection } = useExperiments()
  const { currentExperimentId } = state
  const [plus, setPlus] = useState('')
  const [minus, setMinus] = useState('')
  const [next, setNext] = useState('')
  const [decision, setDecision] = useState('')
  const [impact, setImpact] = useState('')
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
    if (!decision) { setError('Please select a decision'); return }
    if (!currentExperimentId) return
    addReflection(currentExperimentId, {
      plus: plus.trim(),
      minus: minus.trim(),
      next: next.trim(),
      decision,
      impact: impact.trim(),
      date: new Date().toISOString().split('T')[0],
    })
    close()
  }

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <button className="modal-close" onClick={close}>&times;</button>
        <div className="modal-header">REACT</div>
        <div className="modal-subtitle">Plus / Minus / Next</div>
        {exp && <div className="modal-subtitle" style={{ marginTop: -24, color: 'var(--text-secondary)' }}>{exp.title}</div>}
        <div className="pmn-grid" style={{ marginBottom: 24 }}>
          <div className="pmn-item plus">
            <div className="pmn-label"><span className="pmn-icon">+</span> Plus &mdash; What worked?</div>
            <textarea value={plus} onChange={e => setPlus(e.target.value)} placeholder="What gave you energy? What felt effortless?" />
          </div>
          <div className="pmn-item minus">
            <div className="pmn-label"><span className="pmn-icon">&minus;</span> Minus &mdash; What didn't work?</div>
            <textarea value={minus} onChange={e => setMinus(e.target.value)} placeholder="What was challenging? What drained you?" />
          </div>
          <div className="pmn-item next">
            <div className="pmn-label"><span className="pmn-icon">&rarr;</span> Next &mdash; What will you change?</div>
            <textarea value={next} onChange={e => setNext(e.target.value)} placeholder="What is one thing you will try differently?" />
          </div>
        </div>
        <div className="form-group">
          <label>Decision</label>
          <select value={decision} onChange={e => { setDecision(e.target.value); setError('') }}>
            <option value="">Select your decision</option>
            <option value="persist">Persist &mdash; Keep going as-is</option>
            <option value="pause">Pause &mdash; Stop for now</option>
            <option value="pivot">Pivot &mdash; Modify and try again</option>
          </select>
          {error && <div className="validation-error">{error}</div>}
        </div>
        <div style={{ border: '1px solid var(--border-subtle)', padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            IMPACT &mdash; Share (Optional)
          </div>
          <p className="body-text" style={{ marginBottom: 12 }}>
            Sharing your experiment creates accountability and may help others.
          </p>
          <textarea value={impact} onChange={e => setImpact(e.target.value)} placeholder="How would you describe your experiment to a friend?" />
        </div>
        <div className="action-bar">
          <button className="btn-primary" onClick={submit}>Save Reflection</button>
          <button className="btn-secondary" onClick={close}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
