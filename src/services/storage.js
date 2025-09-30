import { supabase } from '../lib/supabaseClient'

const BUCKET = 'resumes'

// Upload a resume file to Supabase Storage.
// Returns { path } where path is the object key inside the bucket.
export async function uploadResumeFile(file, userId, filenameHint = '') {
  if (!file) throw new Error('No file provided')
  if (!userId) throw new Error('Missing user id')
  const ext = (file.name?.split('.').pop() || '').toLowerCase()
  const safeName = (filenameHint || file.name || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_')
  const ts = Date.now()
  const objectPath = `${userId}/${ts}_${safeName}`
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
    upsert: false,
  })
  if (error) throw error
  return { path: objectPath }
}

// Create a time-limited signed URL for a stored resume file.
// ttlSecs defaults to 10 minutes.
export async function getResumeSignedUrl(path, ttlSecs = 600) {
  if (!path) throw new Error('Missing storage path')
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSecs)
  if (error) throw error
  return data?.signedUrl
}
