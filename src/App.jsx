import { useState, useCallback, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ExperimentProvider, useExperiments } from './context/ExperimentContext'
import AuthGate from './components/AuthGate'
import UserNav from './components/UserNav'
import Dashboard from './components/Dashboard'
import CreatePACT from './components/CreatePACT'
import Experiments from './components/Experiments'
import Timeline from './components/Timeline'
import LogModal from './components/LogModal'
import ReflectionModal from './components/ReflectionModal'
import ExperimentDetailModal from './components/ExperimentDetailModal'
import Onboarding from './components/Onboarding'
import { exportData } from './utils/helpers'

const SECTIONS = ['dashboard', 'create', 'experiments', 'timeline']

function AppShell() {
  const { state, dispatch, restore } = useExperiments()
  const { currentSection, toast, showOnboarding } = state
  const [detailId, setDetailId] = useState(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showReflectionModal, setShowReflectionModal] = useState(false)

  const switchSection = useCallback((section) => {
    dispatch({ type: 'SET_SECTION', payload: section })
    window.scrollTo(0, 0)
  }, [dispatch])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        setDetailId(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const openLogModal = useCallback((id) => {
    dispatch({ type: 'SET_CURRENT_EXPERIMENT', payload: id })
    setShowLogModal(true)
  }, [dispatch])

  const openReflectionModal = useCallback((id) => {
    dispatch({ type: 'SET_CURRENT_EXPERIMENT', payload: id })
    setShowReflectionModal(true)
  }, [dispatch])

  const closeLogModal = useCallback(() => {
    setShowLogModal(false)
    dispatch({ type: 'SET_CURRENT_EXPERIMENT', payload: null })
  }, [dispatch])

  const closeReflectionModal = useCallback(() => {
    setShowReflectionModal(false)
    dispatch({ type: 'SET_CURRENT_EXPERIMENT', payload: null })
  }, [dispatch])

  const ctaLabel = currentSection === 'create' ? 'View All' : 'Design PACT'
  const ctaAction = currentSection === 'create'
    ? () => switchSection('experiments')
    : () => switchSection('create')

  return (
    <div>
      <nav className="nav-bar">
        <div className="nav-container">
          <button className="nav-brand" onClick={() => switchSection('dashboard')}>TINY</button>
          <div className="nav-links">
            {SECTIONS.map(s => (
              <button
                key={s}
                className={currentSection === s ? 'active' : ''}
                onClick={() => switchSection(s)}
              >
                {s === 'dashboard' ? 'Dashboard' : s === 'create' ? 'Design PACT' : s === 'experiments' ? 'Experiments' : 'Timeline'}
              </button>
            ))}
            <button className="btn-text" onClick={() => exportData(state.experiments)} style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              Export
            </button>
            <UserNav />
          </div>
        </div>
      </nav>

      <div className="circle-cta" onClick={ctaAction}>
        <span>{ctaLabel === 'Design PACT' ? <>Design<br />PACT</> : ctaLabel}</span>
      </div>

      <section id="section-dashboard" className={`section ${currentSection === 'dashboard' ? 'active' : ''}`}>
        <Dashboard switchSection={switchSection} setDetailId={setDetailId} />
      </section>
      <section id="section-create" className={`section ${currentSection === 'create' ? 'active' : ''}`}>
        <CreatePACT switchSection={switchSection} />
      </section>
      <section id="section-experiments" className={`section ${currentSection === 'experiments' ? 'active' : ''}`}>
        <Experiments switchSection={switchSection} setDetailId={setDetailId} onOpenLog={openLogModal} onOpenReflection={openReflectionModal} />
      </section>
      <section id="section-timeline" className={`section ${currentSection === 'timeline' ? 'active' : ''}`}>
        <Timeline />
      </section>

      {showLogModal && <LogModal onClose={closeLogModal} />}
      {showReflectionModal && <ReflectionModal onClose={closeReflectionModal} />}
      {detailId && (
        <ExperimentDetailModal
          experimentId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
      {showOnboarding && <Onboarding onDone={() => dispatch({ type: 'DISMISS_ONBOARDING' })} />}
      {toast && (
        <div className="toast undo-toast">
          <span>{toast.message}</span>
          <button className="btn-text" onClick={restore}>Undo</button>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <ExperimentProvider>
          <AppShell />
        </ExperimentProvider>
      </AuthGate>
    </AuthProvider>
  )
}
