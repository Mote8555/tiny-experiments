import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserNav() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const email = user.email || 'User'
  const initial = email[0].toUpperCase()

  return (
    <div className="user-nav" onClick={() => setOpen(!open)} onBlur={() => setTimeout(() => setOpen(false), 200)} tabIndex={0}>
      <div className="user-avatar">{initial}</div>
      <div className="user-email">{email}</div>
      {open && (
        <div className="user-dropdown">
          <button className="btn-text" onClick={signOut} style={{ width: '100%', textAlign: 'left', padding: '10px 16px' }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
