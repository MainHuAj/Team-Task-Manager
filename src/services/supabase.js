import { createClient } from '@supabase/supabase-js'

// Supabase client requires a valid URL format. Using a dummy https:// URL as a fallback
// so that the app doesn't crash to a blank page if .env is missing.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
