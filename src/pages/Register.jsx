import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Register({ onSwitch }) {
  const { signUp, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signUp(email, password)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div className="display-lg" style={{ marginBottom: 16 }}>Check Your Email</div>
          <p className="body-text" style={{ margin: '0 auto 32px', textAlign: 'center', maxWidth: 400 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <button className="btn-primary" onClick={onSwitch}>Go to Sign In</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="display-lg" style={{ marginBottom: 8 }}>Join Tiny Experiments</div>
          <p className="body-text" style={{ margin: '0 auto', textAlign: 'center' }}>
            Create an account to design, track, and share PACTs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} required />
          </div>

          {error && <div className="validation-error" style={{ marginBottom: 16 }}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn-secondary" onClick={handleGoogle} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
          Continue with Google
        </button>

        <p className="auth-footer">
          Already have an account?{' '}
          <button className="btn-text" onClick={onSwitch}>Sign in</button>
        </p>
      </div>
    </div>
  )
}
