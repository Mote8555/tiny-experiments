import { useState } from 'react'

const STEPS = [
  {
    title: 'Welcome to Tiny Experiments',
    body: 'A framework for structured curiosity. Design small, time-boxed experiments to learn about yourself through action, not overthinking.',
    action: 'Let\'s Go',
  },
  {
    title: 'PACT &mdash; Design',
    body: 'A PACT is a Personal, Actionable, Consistent, Time-boxed commitment. Choose what to try, for how long, and why. Start from scratch or use a template.',
    action: 'Next',
  },
  {
    title: 'ACT &mdash; Log Daily',
    body: 'Each day, log effort, mood, and signals (internal feelings &amp; external results). No judgment. Just observation.',
    action: 'Next',
  },
  {
    title: 'REACT &mdash; Reflect',
    body: 'At the end, reflect with Plus / Minus / Next. Decide to Persist, Pause, or Pivot. Every result is data for your next experiment.',
    action: 'Get Started',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-content">
        <div className="phase-highlight" style={{ marginBottom: 40 }}>
          {['Design', 'ACT', 'REACT'].map((phase, i) => (
            <div key={phase} className={`phase-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
              {phase}
            </div>
          ))}
        </div>

        <div className="onboarding-step">
          {step === 0 ? (
            <div className="display-xl" style={{ marginBottom: 16, fontSize: 'clamp(40px, 10vw, 80px)' }}>
              Tiny<br />Experiments
            </div>
          ) : (
            <div className="display-lg" dangerouslySetInnerHTML={{ __html: s.title }} style={{ marginBottom: 16 }} />
          )}
          <p className="body-text" style={{ margin: '0 auto 32px', maxWidth: 480, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: s.body }} />
        </div>

        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} onClick={() => setStep(i)} />
          ))}
        </div>

        <button className="btn-primary" onClick={() => {
          if (step < STEPS.length - 1) setStep(s => s + 1)
          else onDone()
        }}>
          {s.action}
        </button>
      </div>
    </div>
  )
}
