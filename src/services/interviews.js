import { supabase } from '../lib/supabaseClient'

export async function saveInterviewResult({ profile, qa, score, summary }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const base = {
    owner_user_id: user.id,
    name: profile?.name || null,
    email: profile?.email || null,
    phone: profile?.phone || null,
    score: score ?? null,
    summary: summary || null,
    qa: qa || [],
  }
  const withResume = profile?.resumePath ? { ...base, resume_path: profile.resumePath } : base

  // Try inserting with resume_path when available; if the column doesn't exist yet, retry without it
  const tryInsert = async (row) => {
    const { error } = await supabase.from('interviews').insert(row)
    return { error }
  }

  let { error } = await tryInsert(withResume)
  if (error && (error.code === '42703' || /column\s+.*resume_path.*\s+does not exist/i.test(error.message || ''))) {
    // Fallback: insert without resume_path column
    const { error: e2 } = await tryInsert(base)
    if (e2) throw e2
    return
  }
  if (error) throw error
}

export async function fetchAllInterviewsForInterviewer() {
  // Requires policy allowing interviewers to select all rows
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data || []
}