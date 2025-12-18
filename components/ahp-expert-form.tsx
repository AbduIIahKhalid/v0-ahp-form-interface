"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2 } from "lucide-react"

const criteria = ["Coding_Hours", "Study_Hours", "Attendance"]
const alternatives = ["AI", "CS", "SE"]

const ahpScale = [
  { value: 9, label: "9 - Extremely More Important" },
  { value: 7, label: "7 - Very Strongly More Important" },
  { value: 5, label: "5 - Strongly More Important" },
  { value: 3, label: "3 - Moderately More Important" },
  { value: 1, label: "1 - Equally Important" },
  { value: 1 / 3, label: "1/3 - Moderately Less Important" },
  { value: 1 / 5, label: "1/5 - Strongly Less Important" },
  { value: 1 / 7, label: "1/7 - Very Strongly Less Important" },
  { value: 1 / 9, label: "1/9 - Extremely Less Important" },
]

export default function AHPExpertForm() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expertName, setExpertName] = useState("")
  const [expertEmail, setExpertEmail] = useState("")

  const [criteriaMatrix, setCriteriaMatrix] = useState({
    "0-1": 1,
    "0-2": 1,
    "1-2": 1,
  })

  const [codingHoursMatrix, setCodingHoursMatrix] = useState({
    "0-1": 1,
    "0-2": 1,
    "1-2": 1,
  })

  const [studyHoursMatrix, setStudyHoursMatrix] = useState({
    "0-1": 1,
    "0-2": 1,
    "1-2": 1,
  })

  const [attendanceMatrix, setAttendanceMatrix] = useState({
    "0-1": 1,
    "0-2": 1,
    "1-2": 1,
  })

  const buildFullMatrix = (upperTriangular: Record<string, number>, size: number) => {
    const matrix = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0))

    for (let i = 0; i < size; i++) {
      matrix[i][i] = 1
    }

    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        const key = `${i}-${j}`
        const value = upperTriangular[key] || 1
        matrix[i][j] = value
        matrix[j][i] = 1 / value
      }
    }

    return matrix
  }

  const calculatePriorityVector = (matrix: number[][]) => {
    const n = matrix.length
    const colSums = Array(n).fill(0)

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += matrix[i][j]
      }
    }

    const normalized = matrix.map((row) => row.map((val, j) => val / colSums[j]))
    const priorities = normalized.map((row) => row.reduce((sum, val) => sum + val, 0) / n)

    return { priorities, normalized, colSums }
  }

  const calculateConsistency = (matrix: number[][], priorities: number[]) => {
    const n = matrix.length
    const weightedSum = Array(n).fill(0)

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        weightedSum[i] += matrix[i][j] * priorities[j]
      }
    }

    const lambdaMax = weightedSum.reduce((sum, val, i) => sum + val / priorities[i], 0) / n
    const CI = (lambdaMax - n) / (n - 1)
    const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n]
    const CR = CI / RI

    return { lambdaMax, CI, CR, weightedSum }
  }

  const handleSubmit = async () => {
    if (!expertName.trim()) {
      alert("Please enter your name")
      return
    }

    setIsSubmitting(true)

    try {
      // Build full matrices
      const criteriaFull = buildFullMatrix(criteriaMatrix, 3)
      const codingFull = buildFullMatrix(codingHoursMatrix, 3)
      const studyFull = buildFullMatrix(studyHoursMatrix, 3)
      const attendanceFull = buildFullMatrix(attendanceMatrix, 3)

      // Calculate priority vectors
      const criteriaCalc = calculatePriorityVector(criteriaFull)
      const codingCalc = calculatePriorityVector(codingFull)
      const studyCalc = calculatePriorityVector(studyFull)
      const attendanceCalc = calculatePriorityVector(attendanceFull)

      // Calculate consistency
      const criteriaConsistency = calculateConsistency(criteriaFull, criteriaCalc.priorities)
      const codingConsistency = calculateConsistency(codingFull, codingCalc.priorities)
      const studyConsistency = calculateConsistency(studyFull, studyCalc.priorities)
      const attendanceConsistency = calculateConsistency(attendanceFull, attendanceCalc.priorities)

      // Calculate final scores
      const finalScores = alternatives.map((_, altIndex) => {
        return (
          criteriaCalc.priorities[0] * codingCalc.priorities[altIndex] +
          criteriaCalc.priorities[1] * studyCalc.priorities[altIndex] +
          criteriaCalc.priorities[2] * attendanceCalc.priorities[altIndex]
        )
      })

      const ranking = alternatives
        .map((alt, i) => ({ name: alt, score: finalScores[i] }))
        .sort((a, b) => b.score - a.score)

      // Save to database
      const response = await fetch("/api/submit-ahp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expertName,
          expertEmail,
          criteriaMatrix,
          codingHoursMatrix,
          studyHoursMatrix,
          attendanceMatrix,
          finalScores,
          ranking,
          consistencyRatios: {
            criteria: criteriaConsistency.CR,
            coding: codingConsistency.CR,
            study: studyConsistency.CR,
            attendance: attendanceConsistency.CR,
          },
          calculationDetails: {
            matrices: { criteriaFull, codingFull, studyFull, attendanceFull },
            calculations: { criteriaCalc, codingCalc, studyCalc, attendanceCalc },
            consistency: { criteriaConsistency, codingConsistency, studyConsistency, attendanceConsistency },
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit evaluation")
      }

      setSubmitted(true)
    } catch (error) {
      console.error("Submission error:", error)
      alert("Error submitting evaluation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderComparisonSlider = (
    i: number,
    j: number,
    labels: string[],
    matrix: Record<string, number>,
    setMatrix: (m: Record<string, number>) => void,
  ) => {
    const key = `${i}-${j}`
    const value = matrix[key]
    const reciprocal = (1 / value).toFixed(4)

    return (
      <Card key={key} className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg text-blue-700">{labels[i]}</span>
            <span className="text-muted-foreground font-semibold">compared to</span>
            <span className="font-bold text-lg text-green-700">{labels[j]}</span>
          </div>

          <Select
            value={value.toString()}
            onValueChange={(val) => setMatrix({ ...matrix, [key]: Number.parseFloat(val) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              {ahpScale.map((scale) => (
                <SelectItem key={scale.value} value={scale.value.toString()}>
                  {scale.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Automatic reciprocal:</span> {labels[j]} compared to {labels[i]} ={" "}
              <span className="font-bold text-purple-600">{reciprocal}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-green-700">Submission Successful!</CardTitle>
            <CardDescription className="text-lg">Thank you for your expert evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-center text-muted-foreground">
                Your AHP evaluation has been successfully saved to the database.
              </p>
              <p className="text-center text-muted-foreground mt-2">
                An administrator will review all expert submissions and generate aggregated results.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                Submit Another Evaluation
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex-1">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalSteps = 5
  const progress = ((step + 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Expert AHP Evaluation</CardTitle>
            <CardDescription>
              Step {step + 1} of {totalSteps}
            </CardDescription>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
        </Card>

        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expert Information</CardTitle>
              <CardDescription>Please provide your details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={expertEmail}
                  onChange={(e) => setExpertEmail(e.target.value)}
                />
              </div>
              <Button onClick={() => setStep(1)} disabled={!expertName.trim()} className="w-full">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Criteria Comparison</CardTitle>
                <CardDescription>Compare the importance of criteria against each other</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderComparisonSlider(0, 1, criteria, criteriaMatrix, setCriteriaMatrix)}
                {renderComparisonSlider(0, 2, criteria, criteriaMatrix, setCriteriaMatrix)}
                {renderComparisonSlider(1, 2, criteria, criteriaMatrix, setCriteriaMatrix)}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Alternatives for Coding Hours</CardTitle>
                <CardDescription>Compare alternatives based on Coding Hours criterion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderComparisonSlider(0, 1, alternatives, codingHoursMatrix, setCodingHoursMatrix)}
                {renderComparisonSlider(0, 2, alternatives, codingHoursMatrix, setCodingHoursMatrix)}
                {renderComparisonSlider(1, 2, alternatives, codingHoursMatrix, setCodingHoursMatrix)}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Alternatives for Study Hours</CardTitle>
                <CardDescription>Compare alternatives based on Study Hours criterion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderComparisonSlider(0, 1, alternatives, studyHoursMatrix, setStudyHoursMatrix)}
                {renderComparisonSlider(0, 2, alternatives, studyHoursMatrix, setStudyHoursMatrix)}
                {renderComparisonSlider(1, 2, alternatives, studyHoursMatrix, setStudyHoursMatrix)}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Alternatives for Attendance</CardTitle>
                <CardDescription>Compare alternatives based on Attendance criterion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderComparisonSlider(0, 1, alternatives, attendanceMatrix, setAttendanceMatrix)}
                {renderComparisonSlider(0, 2, alternatives, attendanceMatrix, setAttendanceMatrix)}
                {renderComparisonSlider(1, 2, alternatives, attendanceMatrix, setAttendanceMatrix)}
              </CardContent>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Evaluation"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
