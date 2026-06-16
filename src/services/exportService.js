function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCSV(val) {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function toCSV(rows, columns) {
  const header = columns.map(c => escapeCSV(c.label)).join(',')
  const lines = rows.map(row =>
    columns.map(c => escapeCSV(row[c.key])).join(',')
  )
  return [header, ...lines].join('\n')
}

export function exportJSON(experiments) {
  download(
    `tiny-experiments-${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(experiments, null, 2)
  )
}

export function exportCSVExperiments(experiments) {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'hypothesis', label: 'Hypothesis' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
    { key: 'visibility', label: 'Visibility' },
    { key: 'duration', label: 'Duration (days)' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'createdAt', label: 'Created At' },
  ]
  const rows = experiments.map(e => ({
    id: e.id,
    title: e.title,
    hypothesis: e.hypothesis,
    category: e.category,
    status: e.status,
    visibility: e.visibility || 'private',
    duration: e.duration,
    startDate: e.startDate || '',
    endDate: e.endDate || '',
    createdAt: e.createdAt,
  }))
  download(
    `experiments-${new Date().toISOString().split('T')[0]}.csv`,
    toCSV(rows, columns),
    'text/csv'
  )
}

export function exportCSVLogs(experiments) {
  const columns = [
    { key: 'experimentId', label: 'Experiment ID' },
    { key: 'experiment', label: 'Experiment' },
    { key: 'date', label: 'Date' },
    { key: 'mood', label: 'Mood' },
    { key: 'effort', label: 'Effort' },
    { key: 'internal', label: 'Internal Signals' },
    { key: 'external', label: 'External Signals' },
    { key: 'note', label: 'Note' },
  ]
  const rows = experiments.flatMap(e =>
    (e.logs || []).map(l => ({
      experimentId: e.id,
      experiment: e.title,
      date: l.date,
      mood: l.mood,
      effort: l.effort,
      internal: l.internal,
      external: l.external,
      note: l.note,
    }))
  )
  download(
    `logs-${new Date().toISOString().split('T')[0]}.csv`,
    toCSV(rows, columns),
    'text/csv'
  )
}

export function exportCSVReflections(experiments) {
  const columns = [
    { key: 'experimentId', label: 'Experiment ID' },
    { key: 'experiment', label: 'Experiment' },
    { key: 'decision', label: 'Decision' },
    { key: 'plus', label: 'Plus' },
    { key: 'minus', label: 'Minus' },
    { key: 'next', label: 'Next' },
    { key: 'impact', label: 'Impact' },
    { key: 'date', label: 'Date' },
  ]
  const rows = experiments
    .filter(e => e.reflection)
    .map(e => ({
      experimentId: e.id,
      experiment: e.title,
      decision: e.reflection.decision,
      plus: e.reflection.plus,
      minus: e.reflection.minus,
      next: e.reflection.next,
      impact: e.reflection.impact,
      date: e.reflection.date,
    }))
  download(
    `reflections-${new Date().toISOString().split('T')[0]}.csv`,
    toCSV(rows, columns),
    'text/csv'
  )
}

export function generateMarkdownReport(experiment) {
  const lines = []
  lines.push(`# ${experiment.title}`)
  lines.push('')
  if (experiment.hypothesis) lines.push(`**Hypothesis:** ${experiment.hypothesis}`)
  lines.push('')
  lines.push(`- **Category:** ${experiment.category || 'Uncategorized'}`)
  lines.push(`- **Status:** ${experiment.status}`)
  lines.push(`- **Duration:** ${experiment.duration} days`)
  lines.push(`- **Visibility:** ${experiment.visibility || 'private'}`)
  if (experiment.startDate) lines.push(`- **Start:** ${experiment.startDate}`)
  if (experiment.endDate) lines.push(`- **End:** ${experiment.endDate}`)
  lines.push('')

  if (experiment.logs && experiment.logs.length > 0) {
    lines.push('## Logs')
    lines.push('')
    lines.push('| Date | Mood | Effort | Internal | External | Notes |')
    lines.push('|------|------|--------|----------|----------|-------|')
    experiment.logs.forEach(l => {
      lines.push(`| ${l.date} | ${l.mood}/5 | ${l.effort} | ${(l.internal || '').replace(/\n/g, ' ')} | ${(l.external || '').replace(/\n/g, ' ')} | ${(l.note || '').replace(/\n/g, ' ')} |`)
    })
    lines.push('')
  }

  if (experiment.reflection) {
    const r = experiment.reflection
    lines.push('## Reflection')
    lines.push('')
    if (r.plus) lines.push(`**Plus — What worked?**  \n${r.plus}`)
    if (r.minus) lines.push(`\n**Minus — What didn't?**  \n${r.minus}`)
    if (r.next) lines.push(`\n**Next — What will change?**  \n${r.next}`)
    lines.push('')
    lines.push(`**Decision:** ${r.decision}`)
    if (r.impact) lines.push(`\n**Impact:** ${r.impact}`)
    lines.push('')
  }

  return lines.join('\n')
}

export function exportMarkdownReport(experiment) {
  const md = generateMarkdownReport(experiment)
  const slug = experiment.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  download(
    `${slug}-report-${new Date().toISOString().split('T')[0]}.md`,
    md,
    'text/markdown'
  )
}

export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!Array.isArray(data)) {
          reject(new Error('Invalid format: expected an array of experiments'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
