import { supabase } from '../lib/supabaseClient'
import { deleteResume } from './storage'

export async function saveInterviewResult({ profile, qa, score, summary, chats }) {
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
  // Include optional fields if available
  let payload = { ...base }
  if (profile?.resumePath) payload.resume_path = profile.resumePath
  if (Array.isArray(chats)) payload.chats = chats

  const tryInsert = async (row) => {
    const { error } = await supabase.from('interviews').insert(row)
    return { error }
  }

  let { error } = await tryInsert(payload)
  if (error && (error.code === '42703' || /column\s+.*does not exist/i.test(error.message || ''))) {
    // Fallback: strip unknown columns and insert minimal row
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

export async function deleteInterview({ id, resumePath }) {
  if (!id) throw new Error('Missing interview id')
  // Best-effort: try deleting resume first (ignore errors so row can still be removed)
  if (resumePath) {
    try { await deleteResume(resumePath) } catch (e) { /* ignore */ }
  }
  const { data, error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id)
    .select('id')

  if (error) throw error
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('Delete not permitted (RLS) or record not found')
  }
}
