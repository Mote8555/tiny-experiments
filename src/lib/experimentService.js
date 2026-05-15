import { supabase } from './supabase'

function toFrontend(exp, logs, reflection) {
  return {
    id: exp.id,
    title: exp.title,
    hypothesis: exp.hypothesis,
    duration: exp.duration,
    category: exp.category,
    status: exp.status,
    createdAt: exp.created_at,
    logs: (logs || []).map(l => ({
      date: l.date,
      effort: l.effort,
      mood: l.mood,
      internal: l.internal,
      external: l.external,
      note: l.note,
    })),
    reflection: reflection
      ? {
          plus: reflection.plus,
          minus: reflection.minus,
          next: reflection.next_,
          decision: reflection.decision,
          impact: reflection.impact,
          date: reflection.date,
        }
      : null,
  }
}

export async function fetchExperiments(userId) {
  const { data: experiments, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const results = await Promise.all(
    (experiments || []).map(async (exp) => {
      const [logsRes, reflRes] = await Promise.all([
        supabase
          .from('experiment_logs')
          .select('*')
          .eq('experiment_id', exp.id)
          .order('date', { ascending: true }),
        supabase
          .from('reflections')
          .select('*')
          .eq('experiment_id', exp.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])
      return toFrontend(exp, logsRes.data || [], reflRes.data?.[0] || null)
    })
  )

  return results
}

export async function createExperiment(data, userId, id) {
  const insertData = {
    user_id: userId,
    title: data.title,
    hypothesis: data.hypothesis || '',
    duration: data.duration,
    category: data.category || '',
    status: 'active',
  }
  if (id) insertData.id = id

  const { data: experiment, error } = await supabase
    .from('experiments')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  return toFrontend(experiment, [], null)
}

export async function addLog(experimentId, logData) {
  const { data, error } = await supabase
    .from('experiment_logs')
    .insert({
      experiment_id: experimentId,
      date: logData.date,
      effort: logData.effort,
      mood: logData.mood,
      internal: logData.internal || '',
      external: logData.external || '',
      note: logData.note || '',
    })
    .select()
    .single()

  if (error) throw error

  return {
    date: data.date,
    effort: data.effort,
    mood: data.mood,
    internal: data.internal,
    external: data.external,
    note: data.note,
  }
}

export async function addReflection(experimentId, reflectionData) {
  const { data, error } = await supabase
    .from('reflections')
    .insert({
      experiment_id: experimentId,
      plus: reflectionData.plus || '',
      minus: reflectionData.minus || '',
      next_: reflectionData.next || '',
      decision: reflectionData.decision,
      impact: reflectionData.impact || '',
      date: reflectionData.date,
    })
    .select()
    .single()

  if (error) throw error

  return {
    plus: data.plus,
    minus: data.minus,
    next: data.next_,
    decision: data.decision,
    impact: data.impact,
    date: data.date,
  }
}

export async function updateStatus(experimentId, status) {
  const { error } = await supabase
    .from('experiments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', experimentId)

  if (error) throw error
}

export async function deleteExperiment(experimentId) {
  const { error } = await supabase
    .from('experiments')
    .delete()
    .eq('id', experimentId)

  if (error) throw error
}

export async function restoreExperiment(experiment, userId) {
  return createExperiment(
    {
      title: experiment.title,
      hypothesis: experiment.hypothesis,
      duration: experiment.duration,
      category: experiment.category,
    },
    userId,
    experiment.id
  )
}
