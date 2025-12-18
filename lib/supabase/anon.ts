import { createClient } from "@supabase/supabase-js"

// Creates an anonymous client for public operations (like form submissions)
// This uses the anon key which respects RLS policies for anonymous users
export function createAnonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
