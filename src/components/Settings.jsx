import { useRef, useState } from 'react'
import { useExperiments } from '../context/ExperimentContext'
import {
  exportJSON,
  exportCSVExperiments,
  exportCSVLogs,
  exportCSVReflections,
  exportMarkdownReport,
  parseImportFile,
} from '../services/exportService'

export default function Settings({ switchSection }) {
  const { state, dispatch } = useExperiments()
  const { experiments } = state
  const fileRef = useRef(null)
  const [importStatus, setImportStatus] = useState('')
  const [selectedReport, setSelectedReport] = useState('')

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    try {
      const data = await parseImportFile(file)
      dispatch({ type: 'SET_EXPERIMENTS', payload: data })
      setImportStatus(`Imported ${data.length} experiment(s) successfully`)
      fileRef.current.value = ''
    } catch (e) {
      setImportStatus(`Error: ${e.message}`)
    }
  }

  const activeCount = experiments.filter(e => e.status === 'active').length
  const completedCount = experiments.filter(e => e.status === 'completed').length
  const totalLogs = experiments.reduce((s, e) => s + e.logs.length, 0)
  const reflectionsCount = experiments.filter(e => e.reflection).length

  const reportExperiments = selectedReport
    ? experiments.filter(e => e.id === selectedReport)
    : experiments

  return (
    <div className="content-page">
      <div className="page-header">
        <div className="subtitle">Data Management</div>
        <div className="display-lg">Settings</div>
      </div>

      <div className="settings-grid">
        <div className="card settings-card">
          <div className="card-number" style={{ fontSize: 24, marginBottom: 8 }}>01</div>
          <div className="card-title" style={{ fontSize: 20, marginBottom: 16 }}>Export All as JSON</div>
          <p className="body-text" style={{ marginBottom: 20 }}>Full data export including experiments, logs, and reflections.</p>
          <button className="btn-primary" onClick={() => exportJSON(experiments)}>Download JSON</button>
        </div>

        <div className="card settings-card">
          <div className="card-number" style={{ fontSize: 24, marginBottom: 8 }}>02</div>
          <div className="card-title" style={{ fontSize: 20, marginBottom: 16 }}>Export as CSV</div>
          <p className="body-text" style={{ marginBottom: 20 }}>Download data as spreadsheets.</p>
          <div className="action-bar" style={{ flexDirection: 'column', gap: 8 }}>
            <button className="btn-primary" onClick={() => exportCSVExperiments(experiments)}>Experiments CSV</button>
            <button className="btn-secondary" onClick={() => exportCSVLogs(experiments)}>Logs CSV</button>
            <button className="btn-secondary" onClick={() => exportCSVReflections(experiments)}>Reflections CSV</button>
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-number" style={{ fontSize: 24, marginBottom: 8 }}>03</div>
          <div className="card-title" style={{ fontSize: 20, marginBottom: 16 }}>Markdown Reports</div>
          <p className="body-text" style={{ marginBottom: 20 }}>Generate a human-readable report for any experiment.</p>
          <div style={{ marginBottom: 16 }}>
            <select
              value={selectedReport}
              onChange={e => setSelectedReport(e.target.value)}
              style={{ marginBottom: 12 }}
            >
              <option value="">All experiments (one per file)</option>
              {experiments.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={() => {
                const targets = selectedReport
                  ? experiments.filter(e => e.id === selectedReport)
                  : experiments
                targets.forEach(exportMarkdownReport)
              }}
            >
              Download Reports
            </button>
          </div>
        </div>

        <div className="card settings-card">
          <div className="card-number" style={{ fontSize: 24, marginBottom: 8 }}>04</div>
          <div className="card-title" style={{ fontSize: 20, marginBottom: 16 }}>Import Data</div>
          <p className="body-text" style={{ marginBottom: 20 }}>
            Restore from a previous JSON export. This will replace all current data.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ marginBottom: 12, border: 'none', padding: 0, fontSize: 13 }}
          />
          <button className="btn-primary" onClick={handleImport}>Import & Replace</button>
          {importStatus && (
            <div className={importStatus.startsWith('Error') ? 'validation-error' : ''}
                 style={{ marginTop: 12, fontSize: 13, color: importStatus.startsWith('Error') ? 'var(--accent-coral)' : 'var(--accent-mint)' }}>
              {importStatus}
            </div>
          )}
        </div>

        <div className="card settings-card">
          <div className="card-number" style={{ fontSize: 24, marginBottom: 8 }}>05</div>
          <div className="card-title" style={{ fontSize: 20, marginBottom: 16 }}>Account Stats</div>
          <div className="stats-row" style={{ gridTemplateColumns: '1fr 1fr', gap: 8, margin: 0, padding: 0, border: 'none' }}>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: 36 }}>{experiments.length}</div>
              <div className="stat-label">Total PACTs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: 36 }}>{activeCount}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: 36 }}>{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: 36 }}>{totalLogs}</div>
              <div className="stat-label">Total Logs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" style={{ fontSize: 36 }}>{reflectionsCount}</div>
              <div className="stat-label">Reflections</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
