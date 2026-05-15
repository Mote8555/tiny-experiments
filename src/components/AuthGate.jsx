import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'
import Register from '../pages/Register'

export default function AuthGate({ children }) {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('login')

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ textAlign: 'center' }}>
          <div className="display-md" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    if (page === 'login') {
      return <Login onSwitch={() => setPage('register')} />
    }
    return <Register onSwitch={() => setPage('login')} />
  }

  return children
}
