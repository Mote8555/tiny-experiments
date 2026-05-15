import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login({ onSwitch }) {
  const { signIn, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="display-lg" style={{ marginBottom: 8 }}>Welcome Back</div>
          <p className="body-text" style={{ margin: '0 auto', textAlign: 'center' }}>
            Sign in to continue your experiments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {error && <div className="validation-error" style={{ marginBottom: 16 }}>{error}</div>}

          <button className="btn-primary" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button className="btn-secondary" onClick={handleGoogle} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
          Continue with Google
        </button>

        <p className="auth-footer">
          No account?{' '}
          <button className="btn-text" onClick={onSwitch}>Create one</button>
        </p>
      </div>
    </div>
  )
}
