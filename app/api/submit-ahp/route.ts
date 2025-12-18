import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Starting AHP submission")
    const supabase = createServiceClient()
    const body = await request.json()

    const {
      expertName,
      expertEmail,
      criteriaMatrix,
      codingHoursMatrix,
      studyHoursMatrix,
      attendanceMatrix,
      finalScores,
      ranking,
      consistencyRatios,
      calculationDetails,
    } = body

    console.log("[v0] Inserting expert:", expertName)
    // Insert expert record
    const { data: expertData, error: expertError } = await supabase
      .from("experts")
      .insert({
        expert_name: expertName,
        expert_email: expertEmail || null,
      })
      .select()
      .single()

    if (expertError) {
      console.error("[v0] Expert insert error:", expertError)
      return NextResponse.json({ error: "Failed to save expert data", details: expertError.message }, { status: 500 })
    }

    console.log("[v0] Expert inserted successfully:", expertData.id)
    console.log("[v0] Inserting submission data")

    // Insert AHP submission
    const { error: submissionError } = await supabase.from("ahp_submissions").insert({
      expert_id: expertData.id,
      criteria_matrix: criteriaMatrix,
      coding_hours_matrix: codingHoursMatrix,
      study_hours_matrix: studyHoursMatrix,
      attendance_matrix: attendanceMatrix,
      final_scores: finalScores,
      ranking: ranking,
      consistency_ratios: consistencyRatios,
      calculation_details: calculationDetails,
    })

    if (submissionError) {
      console.error("[v0] Submission insert error:", submissionError)
      return NextResponse.json(
        { error: "Failed to save submission data", details: submissionError.message },
        { status: 500 },
      )
    }

    console.log("[v0] Submission saved successfully")
    return NextResponse.json({ success: true, expertId: expertData.id })
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
