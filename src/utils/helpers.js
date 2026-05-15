export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'health', label: 'Health & Energy' },
  { key: 'creativity', label: 'Creativity' },
  { key: 'social', label: 'Social' },
  { key: 'learning', label: 'Learning' },
  { key: 'work', label: 'Work & Career' },
  { key: 'relationships', label: 'Relationships' },
  { key: 'mindfulness', label: 'Mindfulness' },
  { key: 'digital', label: 'Digital Wellness' },
]

export const CATEGORY_COLORS = {
  health: 'var(--accent-mint)',
  creativity: 'var(--accent-purple)',
  social: 'var(--accent-coral)',
  learning: 'var(--accent-blue)',
  work: 'var(--accent-gold)',
  relationships: 'var(--accent-pink)',
  mindfulness: '#8b5cf6',
  digital: 'var(--accent-orange)',
}

export const DECISION_LABELS = {
  persist: 'Persist',
  pause: 'Pause',
  pivot: 'Pivot',
}

export const TEMPLATES = [
  { id: 't1', title: 'I will go to bed at the same time every night for 2 weeks', hypothesis: 'Maybe I will wake up more rested and have more energy during the day.', duration: 14, category: 'health', categoryLabel: 'Health & Energy', description: 'Fix your sleep schedule by choosing a consistent bedtime and sticking to it.' },
  { id: 't2', title: 'I will write for 30 minutes every morning for 14 days', hypothesis: 'Maybe I will feel more creative and less anxious about my writing.', duration: 14, category: 'creativity', categoryLabel: 'Creativity', description: 'Morning pages or journaling to unlock creative flow and reduce mental clutter.' },
  { id: 't3', title: 'I will send one appreciation message per day for 10 days', hypothesis: 'Maybe I will feel more connected to people and less isolated.', duration: 10, category: 'social', categoryLabel: 'Social', description: 'Build social bonds by expressing gratitude to one person each day.' },
  { id: 't4', title: 'I will read one article about AI every week for 1 month', hypothesis: 'Maybe I will feel more informed and confident about technology trends.', duration: 30, category: 'learning', categoryLabel: 'Learning', description: 'Stay current with AI developments through weekly deep reading.' },
  { id: 't5', title: 'I will block 2 hours of deep work every morning for 3 weeks', hypothesis: 'Maybe I will get more meaningful work done and feel less overwhelmed.', duration: 21, category: 'work', categoryLabel: 'Work & Career', description: 'Protect your most productive hours by scheduling uninterrupted deep work.' },
  { id: 't6', title: 'I will organize a weekly date with my partner for 4 weeks', hypothesis: 'Maybe our relationship will feel more intentional and joyful.', duration: 28, category: 'relationships', categoryLabel: 'Relationships', description: 'Prioritize quality time with your partner through scheduled weekly dates.' },
  { id: 't7', title: 'I will meditate for 10 minutes every day for 15 days', hypothesis: 'Maybe I will feel calmer and more present in my daily life.', duration: 15, category: 'mindfulness', categoryLabel: 'Mindfulness', description: 'Build a meditation practice with a short, achievable daily commitment.' },
  { id: 't8', title: 'I will check social media only after 12pm for 7 days', hypothesis: 'Maybe my mornings will feel more focused and less scattered.', duration: 7, category: 'digital', categoryLabel: 'Digital Wellness', description: 'Reclaim your mornings by delaying social media until noon.' },
  { id: 't9', title: 'I will take a 20-minute walk after lunch for 2 weeks', hypothesis: 'Maybe I will have more energy in the afternoon and sleep better at night.', duration: 14, category: 'health', categoryLabel: 'Health & Energy', description: 'Add gentle movement to your day with a post-lunch walking habit.' },
  { id: 't10', title: 'I will sketch one idea every day for 10 days', hypothesis: 'Maybe visual thinking will help me solve problems more creatively.', duration: 10, category: 'creativity', categoryLabel: 'Creativity', description: 'Develop visual thinking skills by sketching one idea daily.' },
  { id: 't11', title: 'I will have one conversation with a stranger per week for 1 month', hypothesis: 'Maybe I will feel more socially confident and discover unexpected opportunities.', duration: 30, category: 'social', categoryLabel: 'Social', description: 'Expand your social comfort zone through intentional stranger conversations.' },
  { id: 't12', title: 'I will learn one new word in a foreign language every day for 3 weeks', hypothesis: 'Maybe I will feel more capable of learning languages and want to continue.', duration: 21, category: 'learning', categoryLabel: 'Learning', description: 'Build language confidence through micro-learning with just one word per day.' },
]

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function calculateStreak(logs) {
  if (!logs || !logs.length) return 0
  const unique = [...new Set(logs.map(l => l.date))].sort().reverse()
  if (unique.length === 0) return 0
  let streak = 1
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1])
    const curr = new Date(unique[i])
    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

export function calculateProgress(experiment) {
  const start = new Date(experiment.createdAt)
  const now = new Date()
  const elapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)))
  return Math.min(100, Math.round((elapsed / experiment.duration) * 100))
}

export function currentDay(experiment) {
  const start = new Date(experiment.createdAt)
  const now = new Date()
  const elapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24))) + 1
  return Math.min(elapsed, experiment.duration)
}

export function isExperimentExpired(experiment) {
  if (experiment.status !== 'active') return false
  const start = new Date(experiment.createdAt)
  const end = new Date(start)
  end.setDate(end.getDate() + experiment.duration)
  return new Date() > end
}

export function getCategoryLabel(key) {
  return CATEGORIES.find(c => c.key === key)?.label || key
}

export function exportData(experiments) {
  const blob = new Blob([JSON.stringify(experiments, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tiny-experiments-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}
