import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function POST() {
  const supabase = await createClient()

  console.log("[v0] Signing out user")
  await supabase.auth.signOut()

  redirect("/auth/login")
}
