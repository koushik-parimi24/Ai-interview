import { createClient } from '@supabase/supabase-js'

// Ensure these are set in your .env.local (Vite)
// VITE_SUPABASE_URL=
// VITE_SUPABASE_ANON_KEY=
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)