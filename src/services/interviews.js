import { supabase } from '../lib/supabaseClient'

export async function saveInterviewResult({ profile, qa, score, summary }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const payload = {
    owner_user_id: user.id,
    name: profile?.name || null,
    email: profile?.email || null,
    phone: profile?.phone || null,
    score: score ?? null,
    summary: summary || null,
    qa: qa || [],
  }
  const { error } = await supabase.from('interviews').insert(payload)
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