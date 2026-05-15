import { useState, useCallback } from 'react'
import { useExperiments } from '../context/ExperimentContext'
import { CATEGORIES, CATEGORY_COLORS, TEMPLATES, getCategoryLabel } from '../utils/helpers'

function StepTrack({ step }) {
  return (
    <div className="step-track">
      {[1, 2, 3].map(i => (
        <div key={i} className={`step ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`} />
      ))}
    </div>
  )
}

function StepBasicInfo({ form, errors, onChange, onNext }) {
  return (
    <div>
      <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
        <label>Your PACT</label>
        <input
          type="text"
          placeholder="I will [action] for [duration]"
          value={form.title}
          onChange={e => onChange('title', e.target.value)}
          className={errors.title ? 'input-error' : ''}
        />
        {errors.title && <div className="validation-error">{errors.title}</div>}
      </div>
      <div className="form-group">
        <label>Hypothesis</label>
        <textarea
          placeholder="Maybe I will..."
          value={form.hypothesis}
          onChange={e => onChange('hypothesis', e.target.value)}
        />
      </div>
      <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
        <label>Category</label>
        <select
          value={form.category}
          onChange={e => onChange('category', e.target.value)}
          className={errors.category ? 'input-error' : ''}
        >
          <option value="">Select a category</option>
          {CATEGORIES.filter(c => c.key !== 'all').map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        {errors.category && <div className="validation-error">{errors.category}</div>}
      </div>
      <div className={`form-group ${errors.duration ? 'has-error' : ''}`}>
        <label>Duration (days)</label>
        <input
          type="number"
          value={form.duration}
          min="1"
          max="90"
          onChange={e => onChange('duration', e.target.value)}
          className={errors.duration ? 'input-error' : ''}
        />
        {errors.duration && <div className="validation-error">{errors.duration}</div>}
      </div>
      <div style={{ marginTop: 32 }}>
        <button className="btn-primary" onClick={onNext}>Next: Triple Check &rarr;</button>
      </div>
    </div>
  )
}

function StepTripleCheck({ checks, onCheck, onBack, onRun }) {
  const allChecked = checks.head && checks.heart && checks.hand
  const [result, setResult] = useState(null)

  const handleRun = () => {
    if (allChecked) {
      setResult({
        type: 'go',
        message: 'All checks pass. You are ready to commit.'
      })
      onRun()
    } else {
      const missing = []
      if (!checks.head) missing.push('Head: Make your PACT more specific')
      if (!checks.heart) missing.push('Heart: Find a PACT you are genuinely curious about')
      if (!checks.hand) missing.push('Hand: Adjust the scope so it fits your current life')
      setResult({
        type: 'pause',
        message: 'Not all checks pass. Adjust your PACT.',
        items: missing
      })
    }
  }

  return (
    <div>
      <p className="body-text" style={{ marginBottom: 24 }}>
        Before committing, check your Head, Heart, and Hand. This diagnoses procrastination before it starts.
      </p>
      <div className="triple-check">
        <h4>Head &mdash; Do you know WHAT to do?</h4>
        <label>
          <input type="checkbox" checked={checks.head} onChange={e => onCheck('head', e.target.checked)} />
          <span>I have a clear, specific action in mind (not vague like &ldquo;be healthier&rdquo;)</span>
        </label>
      </div>
      <div className="triple-check">
        <h4>Heart &mdash; Do you want to do it?</h4>
        <label>
          <input type="checkbox" checked={checks.heart} onChange={e => onCheck('heart', e.target.checked)} />
          <span>I feel genuinely curious about this experiment, not obligated or guilty</span>
        </label>
      </div>
      <div className="triple-check">
        <h4>Hand &mdash; Can you actually do it?</h4>
        <label>
          <input type="checkbox" checked={checks.hand} onChange={e => onCheck('hand', e.target.checked)} />
          <span>I have the time, tools, and environment to do this right now</span>
        </label>
      </div>
      {result && (
        <div className={`check-result show ${result.type === 'go' ? 'go' : 'pause'}`}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>{result.message}</div>
          {result.items && (
            <ul style={{ margin: '0 0 12px 20px', padding: 0, lineHeight: 1.8 }}>
              {result.items.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>
      )}
      <div className="action-bar" style={{ marginTop: 32 }}>
        <button className="btn-secondary" onClick={onBack}>&larr; Back</button>
        <button className="btn-primary" onClick={handleRun}>Run Check</button>
      </div>
    </div>
  )
}

function StepReview({ form, onBack, onCommit }) {
  return (
    <div>
      <div style={{ border: '1px solid var(--border-medium)', padding: 32, marginBottom: 32 }}>
        <div className="display-md" style={{ marginBottom: 16, color: 'var(--text-primary)' }}>{form.title}</div>
        {form.hypothesis && <p className="body-text" style={{ marginBottom: 16 }}>{form.hypothesis}</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="tag filled">{getCategoryLabel(form.category)}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{form.duration} days</span>
        </div>
      </div>
      <p className="body-text" style={{ marginBottom: 32 }}>
        Remember: this is an experiment, not a habit. You are committing to curiosity, not perfection.
      </p>
      <div className="action-bar">
        <button className="btn-secondary" onClick={onBack}>&larr; Back</button>
        <button className="btn-primary" onClick={onCommit}>Commit to PACT</button>
      </div>
    </div>
  )
}

function TemplatesPanel() {
  const { state, dispatch, addExperiment } = useExperiments()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === filter)
  const [selected, setSelected] = useState(null)

  const handleUseTemplate = async () => {
    if (!selected) return
    const t = TEMPLATES.find(t => t.id === selected)
    if (!t) return
    await addExperiment(
      {
        title: t.title,
        hypothesis: t.hypothesis,
        duration: t.duration,
        category: t.category,
      },
      crypto.randomUUID()
    )
    setSelected(null)
    dispatch({ type: 'SET_SECTION', payload: 'dashboard' })
  }

  return (
    <div>
      <p className="body-text" style={{ marginBottom: 32 }}>
        Choose a pre-built PACT from Anne-Laure Le Cunff&rsquo;s Tiny Experiments framework.
      </p>
      <div className="filter-pills">
        {CATEGORIES.map(c => (
          <button key={c.key} className={filter === c.key ? 'active-filter' : ''} onClick={() => setFilter(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      {selected ? (
        <div style={{ border: '1px solid var(--border-medium)', padding: 32, marginBottom: 24 }}>
          {(() => {
            const t = TEMPLATES.find(t => t.id === selected)
            if (!t) return null
            return (
              <>
                <div className="display-md" style={{ marginBottom: 16, color: 'var(--text-primary)' }}>{t.title}</div>
                <p className="body-text" style={{ marginBottom: 16 }}>{t.hypothesis}</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                  <span className="tag filled">{t.categoryLabel}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>{t.duration} days</span>
                </div>
                <p className="body-text" style={{ marginBottom: 24 }}>{t.description}</p>
                <div className="action-bar">
                  <button className="btn-primary" onClick={handleUseTemplate}>Use This Template</button>
                  <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                </div>
              </>
            )
          })()}
        </div>
      ) : (
        <div className="template-card-grid">
          {filtered.map((t, i) => (
            <div key={t.id} className="card" onClick={() => setSelected(t.id)}>
              <div className="card-number">{String(i + 1).padStart(2, '0')}</div>
              <div className="card-title">{t.title}</div>
              <div className="card-desc">{t.description}</div>
              <div className="card-meta">{t.categoryLabel} &middot; {t.duration} days</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CreatePACT({ switchSection }) {
  const { dispatch, addExperiment } = useExperiments()
  const [step, setStep] = useState(1)
  const [tab, setTab] = useState('scratch')
  const [form, setForm] = useState({ title: '', hypothesis: '', category: '', duration: '14' })
  const [checks, setChecks] = useState({ head: false, heart: false, hand: false })
  const [errors, setErrors] = useState({})
  const [triplePassed, setTriplePassed] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Enter your PACT'
    else if (form.title.trim().length < 3) errs.title = 'PACT must be at least 3 characters'
    if (!form.category) errs.category = 'Select a category'
    if (!form.duration || parseInt(form.duration) < 1) errs.duration = 'Duration must be at least 1 day'
    else if (parseInt(form.duration) > 90) errs.duration = 'Duration cannot exceed 90 days'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validate()) setStep(2)
  }

  const handleRun = () => {
    if (checks.head && checks.heart && checks.hand) {
      setTriplePassed(true)
      setStep(3)
    }
  }

  const handleCommit = async () => {
    await addExperiment(
      {
        title: form.title.trim(),
        hypothesis: form.hypothesis.trim(),
        category: form.category,
        duration: parseInt(form.duration) || 14,
      },
      crypto.randomUUID()
    )
    setForm({ title: '', hypothesis: '', category: '', duration: '14' })
    setChecks({ head: false, heart: false, hand: false })
    setTriplePassed(false)
    setStep(1)
    switchSection('dashboard')
  }

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="subtitle">Step by Step</div>
        <div className="display-lg">Design Your PACT</div>
      </div>
      <div className="tab-bar">
        <button className={tab === 'scratch' ? 'active-tab' : ''} onClick={() => { setTab('scratch'); setStep(1) }}>From Scratch</button>
        <button className={tab === 'templates' ? 'active-tab' : ''} onClick={() => setTab('templates')}>Templates</button>
      </div>
      {tab === 'scratch' ? (
        <div>
          <StepTrack step={step} />
          {step === 1 && (
            <StepBasicInfo
              form={form}
              errors={errors}
              onChange={(key, val) => setForm(f => ({ ...f, [key]: val }))}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <StepTripleCheck
              checks={checks}
              onCheck={(key, val) => setChecks(c => ({ ...c, [key]: val }))}
              onBack={() => setStep(1)}
              onRun={handleRun}
            />
          )}
          {step === 3 && (
            <StepReview form={form} onBack={() => setStep(2)} onCommit={handleCommit} />
          )}
        </div>
      ) : (
        <TemplatesPanel />
      )}
    </div>
  )
}
