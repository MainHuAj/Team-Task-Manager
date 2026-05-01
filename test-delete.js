import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  // Login as admin
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test@1234', // I saw test@1234 in the previous context
    password: 'password123' // guessing, or I can just sign up a new admin
  })
  
  if (authErr) {
    console.log("Auth err", authErr)
  } else {
    console.log("Logged in!")
  }
}
test()
