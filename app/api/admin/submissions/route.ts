import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all experts with their submissions
    const { data: experts, error: expertsError } = await supabase
      .from("experts")
      .select("*")
      .order("submitted_at", { ascending: false })

    if (expertsError) {
      console.error("Experts fetch error:", expertsError)
      return NextResponse.json({ error: "Failed to fetch experts" }, { status: 500 })
    }

    // Fetch submissions for each expert
    const expertsWithSubmissions = await Promise.all(
      experts.map(async (expert) => {
        const { data: submission, error: submissionError } = await supabase
          .from("ahp_submissions")
          .select("*")
          .eq("expert_id", expert.id)
          .single()

        if (submissionError) {
          console.error("Submission fetch error:", submissionError)
          return null
        }

        return {
          ...expert,
          submission,
        }
      }),
    )

    // Filter out any nulls
    const validExperts = expertsWithSubmissions.filter((e) => e !== null)

    return NextResponse.json({ experts: validExperts })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
