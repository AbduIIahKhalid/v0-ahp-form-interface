import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
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

export async function DELETE(request: Request) {
  try {
    console.log("[DELETE /api/admin/submissions] Starting deletion process");

    // Check if user is authenticated first using the regular client
    const supabaseUserCheck = await createClient()
    const {
      data: { user },
    } = await supabaseUserCheck.auth.getUser()
    if (!user) {
      console.error("Unauthorized deletion attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.log("[DELETE] User authenticated:", user.email);

    // Get expert ID from request body
    const { expertId } = await request.json()

    if (!expertId) {
      console.error("Expert ID is required for deletion")
      return NextResponse.json({ error: "Expert ID is required" }, { status: 400 })
    }

    console.log(`[DELETE] Attempting to delete expert with ID: ${expertId}`);

    // Use service role client for the actual deletion to bypass RLS
    const supabaseService = createServiceClient();

    // First, try to delete from ahp_submissions explicitly (in case CASCADE isn't working as expected)
    const { error: submissionError, count: subCount } = await supabaseService
      .from("ahp_submissions")
      .delete()
      .eq("expert_id", expertId)

    if (submissionError) {
      console.error("[DELETE] Submission deletion error:", submissionError)
      // Don't return error here as the record might not exist, continue with expert deletion
    } else {
      console.log(`[DELETE] Successfully deleted ${subCount || 0} submission records`);
    }

    // Then delete from experts table
    const { error: expertError, count: expCount } = await supabaseService
      .from("experts")
      .delete()
      .eq("id", expertId)

    if (expertError) {
      console.error("[DELETE] Expert deletion error:", expertError)
      return NextResponse.json({ error: "Failed to delete expert" }, { status: 500 })
    }

    console.log(`[DELETE] Successfully deleted expert. Experts table records affected: ${expCount || 0}`);

    return NextResponse.json({
      message: "Expert submission deleted successfully",
      deletedRecords: { experts: expCount, submissions: subCount }
    }, { status: 200 })
  } catch (error) {
    console.error("[DELETE] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
