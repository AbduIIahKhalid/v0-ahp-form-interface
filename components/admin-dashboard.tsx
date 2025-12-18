"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, CheckCircle2, TrendingUp, Users, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.53, 1.56, 1.58, 1.59]

type Expert = {
  id: string
  expert_name: string
  expert_email: string | null
  submitted_at: string
}

type Submission = {
  id: string
  expert_id: string
  criteria_matrix: Record<string, number>
  coding_hours_matrix: Record<string, number>
  study_hours_matrix: Record<string, number>
  attendance_matrix: Record<string, number>
  final_scores: number[]
  ranking: { name: string; score: number }[]
  consistency_ratios: {
    criteria: number
    coding: number
    study: number
    attendance: number
  }
  calculation_details: any
  created_at: string
}

type ExpertWithSubmission = Expert & {
  submission: Submission
}

type AggregatedResults =
  | {
      matrices: {
        criteria: number[][]
        coding: number[][]
        study: number[][]
        attendance: number[][]
      }
      priorities: {
        criteria: number[]
        coding: number[]
        study: number[]
        attendance: number[]
      }
      consistency: {
        criteria: any
        coding: any
        study: any
        attendance: any
      }
      avgConsistency: {
        criteria: number
        coding: number
        study: number
        attendance: number
      }
      finalScores: number[]
      ranking: { name: string; score: number }[]
      stepAcceptance: {
        criteria: { accepted: number; needsReview: number }
        coding: { accepted: number; needsReview: number }
        study: { accepted: number; needsReview: number }
        attendance: { accepted: number; needsReview: number }
      }
      totalCount: number
    }
  | {
      acceptedCount: 0
      totalCount: number
      needsReviewCount: number
      ranking: { name: string; score: number }[]
    }

// Helper function to build a full matrix from an upper triangular representation
const buildFullMatrix = (upperTriangular: Record<string, number>, size: number): number[][] => {
  const m = Array(size)
    .fill(0)
    .map(() => Array(size).fill(0))
  for (let i = 0; i < size; i++) m[i][i] = 1
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const key = `${i}-${j}`
      const value = upperTriangular[key] || 1
      m[i][j] = value
      m[j][i] = 1 / value
    }
  }
  return m
}

// Helper function to calculate the priority vector from a matrix
const calculatePriorityVector = (matrix: number[][]): number[] => {
  const n = matrix.length
  const geometricMeans = matrix.map((row) => {
    const product = row.reduce((acc, val) => acc * val, 1)
    return Math.pow(product, 1 / n)
  })
  const sum = geometricMeans.reduce((a, b) => a + b, 0)
  const priorities = geometricMeans.map((gm) => gm / sum)
  return priorities
}

export default function AdminDashboard() {
  const [experts, setExperts] = useState<ExpertWithSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResults | null>(null)

  useEffect(() => {
    fetchData()
  }, [])
  // </CHANGE>

  const fetchData = async () => {
    console.log("[v0] AdminDashboard: Fetching data")
    // </CHANGE>
    try {
      const response = await fetch("/api/admin/submissions")
      if (!response.ok) throw new Error("Failed to fetch data")
      const data = await response.json()
      console.log("[v0] AdminDashboard: Data fetched successfully", { expertCount: data.experts.length })
      // </CHANGE>
      setExperts(data.experts)
      calculateAggregation(data.experts)
    } catch (error) {
      console.error("[v0] AdminDashboard: Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAggregation = (expertsData: ExpertWithSubmission[]) => {
    if (expertsData.length === 0) {
      setAggregatedResults(null)
      return
    }

    const stepAcceptance = {
      criteria: {
        accepted: expertsData.filter((e) => e.submission.consistency_ratios.criteria <= 0.1000).length,
        needsReview: expertsData.filter((e) => e.submission.consistency_ratios.criteria > 0.1000).length,
      },
      coding: {
        accepted: expertsData.filter((e) => e.submission.consistency_ratios.coding <= 0.1000).length,
        needsReview: expertsData.filter((e) => e.submission.consistency_ratios.coding > 0.10).length,
      },
      study: {
        accepted: expertsData.filter((e) => e.submission.consistency_ratios.study <= 0.1000).length,
        needsReview: expertsData.filter((e) => e.submission.consistency_ratios.study > 0.1000).length,
      },
      attendance: {
        accepted: expertsData.filter((e) => e.submission.consistency_ratios.attendance <= 0.1000).length,
        needsReview: expertsData.filter((e) => e.submission.consistency_ratios.attendance > 0.1000).length,
      },
    }

    // Filter experts per step - only include those with CR <= 0.10 for each specific step
    const acceptedForCriteria = expertsData.filter((e) => e.submission.consistency_ratios.criteria <= 0.1000)
    const acceptedForCoding = expertsData.filter((e) => e.submission.consistency_ratios.coding <= 0.1000)
    const acceptedForStudy = expertsData.filter((e) => e.submission.consistency_ratios.study <= 0.1000)
    const acceptedForAttendance = expertsData.filter((e) => e.submission.consistency_ratios.attendance <= 0.1000)

    // If no experts are accepted for any step, return early
    if (
      acceptedForCriteria.length === 0 &&
      acceptedForCoding.length === 0 &&
      acceptedForStudy.length === 0 &&
      acceptedForAttendance.length === 0
    ) {
      setAggregatedResults({
        acceptedCount: 0,
        totalCount: expertsData.length,
        needsReviewCount: expertsData.length,
        ranking: [],
      })
      return
    }
    // </CHANGE>

    const numExperts = acceptedForCriteria.length // This will be used for calculating avgConsistency later

    // </CHANGE>
    const alternatives = ["AI", "CS", "SE"]
    const criteria = ["Coding_Hours", "Study_Hours", "Attendance"]

    // Helper function to calculate geometric mean
    const geometricMean = (values: number[]) => {
      const product = values.reduce((acc, val) => acc * val, 1)
      return Math.pow(product, 1 / values.length)
    }

    const aggregatePairwiseMatrix = (
      matrixKey: string,
      size: number,
      acceptedExpertsForStep: ExpertWithSubmission[],
    ) => {
      if (acceptedExpertsForStep.length === 0) {
        // Return identity-like matrix if no accepted experts
        const defaultMatrix: Record<string, number> = {}
        for (let i = 0; i < size; i++) {
          for (let j = i + 1; j < size; j++) {
            defaultMatrix[`${i}-${j}`] = 1
          }
        }
        return defaultMatrix
      }

      const aggregatedMatrix: Record<string, number> = {}

      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const key = `${i}-${j}`
          const values = acceptedExpertsForStep.map((expert) => {
            const matrix = (expert.submission as any)[matrixKey]
            return matrix[key] || 1
          })
          aggregatedMatrix[key] = geometricMean(values)
        }
      }

      return aggregatedMatrix
    }
    // </CHANGE>

    // Build full matrix from upper triangular
    const buildFullMatrixForAggregation = (upperTriangular: Record<string, number>, size: number) => {
      const m = Array(size)
        .fill(0)
        .map(() => Array(size).fill(0))
      for (let i = 0; i < size; i++) m[i][i] = 1
      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const key = `${i}-${j}`
          const value = upperTriangular[key] || 1
          m[i][j] = value
          m[j][i] = 1 / value
        }
      }
      return m
    }

    const calculatePriorityVectorForAggregation = (matrix: number[][]) => {
      const n = matrix.length
      const geometricMeans = matrix.map((row) => {
        const product = row.reduce((acc, val) => acc * val, 1)
        return Math.pow(product, 1 / n)
      })
      const sum = geometricMeans.reduce((a, b) => a + b, 0)
      const priorities = geometricMeans.map((gm) => gm / sum)
      return priorities
    }

    const calculateConsistency = (matrix: number[][], priorities: number[]) => {
      const n = matrix.length
      const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
      const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
      const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n
      const CI = (lambdaMax - n) / (n - 1)
      const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
      const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
      const CR = CI / RI
      return { lambdaMax, CI, CR, RI }
    }

    const aggCriteriaMatrix = aggregatePairwiseMatrix("criteria_matrix", 3, acceptedForCriteria)
    const aggCodingMatrix = aggregatePairwiseMatrix("coding_hours_matrix", 3, acceptedForCoding)
    const aggStudyMatrix = aggregatePairwiseMatrix("study_hours_matrix", 3, acceptedForStudy)
    const aggAttendanceMatrix = aggregatePairwiseMatrix("attendance_matrix", 3, acceptedForAttendance)
    // </CHANGE>

    // Build full matrices
    const criteriaFull = buildFullMatrixForAggregation(aggCriteriaMatrix, 3)
    const codingFull = buildFullMatrixForAggregation(aggCodingMatrix, 3)
    const studyFull = buildFullMatrixForAggregation(aggStudyMatrix, 3)
    const attendanceFull = buildFullMatrixForAggregation(aggAttendanceMatrix, 3)

    // Calculate priority vectors
    const criteriaPriorities = calculatePriorityVectorForAggregation(criteriaFull)
    const codingPriorities = calculatePriorityVectorForAggregation(codingFull)
    const studyPriorities = calculatePriorityVectorForAggregation(studyFull)
    const attendancePriorities = calculatePriorityVectorForAggregation(attendanceFull)

    const criteriaConsistency = calculateConsistency(criteriaFull, criteriaPriorities)
    const codingConsistency = calculateConsistency(codingFull, codingPriorities)
    const studyConsistency = calculateConsistency(studyFull, studyPriorities)
    const attendanceConsistency = calculateConsistency(attendanceFull, attendancePriorities)

    // Calculate final scores
    const finalScores = alternatives.map((_, i) => {
      return (
        criteriaPriorities[0] * codingPriorities[i] +
        criteriaPriorities[1] * studyPriorities[i] +
        criteriaPriorities[2] * attendancePriorities[i]
      )
    })

    // Create ranking
    const aggregatedRanking = alternatives
      .map((alt, i) => ({ name: alt, score: finalScores[i] }))
      .sort((a, b) => b.score - a.score)

    const avgConsistency = {
      criteria:
        acceptedForCriteria.length > 0
          ? acceptedForCriteria.reduce((sum, e) => sum + e.submission.consistency_ratios.criteria, 0) /
            acceptedForCriteria.length
          : 0,
      coding:
        acceptedForCoding.length > 0
          ? acceptedForCoding.reduce((sum, e) => sum + e.submission.consistency_ratios.coding, 0) /
            acceptedForCoding.length
          : 0,
      study:
        acceptedForStudy.length > 0
          ? acceptedForStudy.reduce((sum, e) => sum + e.submission.consistency_ratios.study, 0) /
            acceptedForStudy.length
          : 0,
      attendance:
        acceptedForAttendance.length > 0
          ? acceptedForAttendance.reduce((sum, e) => sum + e.submission.consistency_ratios.attendance, 0) /
            acceptedForAttendance.length
          : 0,
    }
    // </CHANGE>

    setAggregatedResults({
      matrices: {
        criteria: criteriaFull,
        coding: codingFull,
        study: studyFull,
        attendance: attendanceFull,
      },
      priorities: {
        criteria: criteriaPriorities,
        coding: codingPriorities,
        study: studyPriorities,
        attendance: attendancePriorities,
      },
      consistency: {
        criteria: criteriaConsistency,
        coding: codingConsistency,
        study: studyConsistency,
        attendance: attendanceConsistency,
      },
      avgConsistency,
      finalScores,
      ranking: aggregatedRanking,
      stepAcceptance, // Add the missing stepAcceptance property
      totalCount: expertsData.length,
      // </CHANGE>
    })
  }

  const renderMatrix = (matrix: Record<string, number>, labels: string[], title: string) => {
    const buildFullMatrix = (upperTriangular: Record<string, number>, size: number) => {
      const m = Array(size)
        .fill(0)
        .map(() => Array(size).fill(0))

      for (let i = 0; i < size; i++) {
        m[i][i] = 1
      }

      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const key = `${i}-${j}`
          const value = upperTriangular[key] || 1
          m[i][j] = value
          m[j][i] = 1 / value
        }
      }

      return m
    }

    const fullMatrix = buildFullMatrix(matrix, labels.length)

    return (
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h5>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24"></TableHead>
                {labels.map((label) => (
                  <TableHead key={label} className="text-center">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fullMatrix.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{labels[i]}</TableCell>
                  {row.map((val, j) => (
                    <TableCell key={j} className={`text-center ${i === j ? "bg-muted font-bold" : ""}`}>
                      {val.toFixed(2)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  const reconstructCalculations = (submission: Submission) => {
    const criteria = ["Coding_Hours", "Study_Hours", "Attendance"]
    const alternatives = ["AI", "CS", "SE"]

    // Build full matrices from upper triangular
    const buildFullMatrix = (upperTriangular: Record<string, number>, size: number) => {
      const m = Array(size)
        .fill(0)
        .map(() => Array(size).fill(0))

      for (let i = 0; i < size; i++) {
        m[i][i] = 1
      }

      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const key = `${i}-${j}`
          const value = upperTriangular[key] || 1
          m[i][j] = value
          m[j][i] = 1 / value
        }
      }

      return m
    }

    const calculatePriorityVector = (matrix: number[][]) => {
      const n = matrix.length

      const geometricMeans = matrix.map((row) => {
        const product = row.reduce((acc, val) => acc * val, 1)
        return Math.pow(product, 1 / n)
      })

      const sum = geometricMeans.reduce((a, b) => a + b, 0)
      const priorities = geometricMeans.map((gm) => gm / sum)

      // Also calculate normalized matrix for display
      const colSums = Array(n).fill(0)
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          colSums[j] += matrix[i][j]
        }
      }
      const normalized = matrix.map((row) => row.map((val, j) => val / colSums[j]))

      return { priorities, normalized, colSums, geometricMeans }
    }

    const calculateConsistency = (matrix: number[][], priorities: number[]) => {
      const n = matrix.length
      const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
      const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
      const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n

      const CI = (lambdaMax - n) / (n - 1)
      const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
      const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
      const CR = CI / RI

      return { lambdaMax, CI, CR, RI, weightedSum, lambdaValues }
    }

    // Build full matrices
    const criteriaFull = buildFullMatrix(submission.criteria_matrix, 3)
    const codingFull = buildFullMatrix(submission.coding_hours_matrix, 3)
    const studyFull = buildFullMatrix(submission.study_hours_matrix, 3)
    const attendanceFull = buildFullMatrix(submission.attendance_matrix, 3)

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

    return {
      matrices: {
        criteria: criteriaFull,
        coding: codingFull,
        study: studyFull,
        attendance: attendanceFull,
      },
      calculations: {
        criteria: criteriaCalc,
        coding: codingCalc,
        study: studyCalc,
        attendance: attendanceCalc,
      },
      consistency: {
        criteria: criteriaConsistency,
        coding: codingConsistency,
        study: studyConsistency,
        attendance: attendanceConsistency,
      },
      criteria,
      alternatives,
    }
  }

  const renderDetailedCalculations = (expert: ExpertWithSubmission) => {
    const calc = reconstructCalculations(expert.submission)

    const renderFullMatrix = (matrix: number[][], labels: string[], title: string) => (
      <div className="mb-6">
        <h4 className="font-semibold text-lg mb-3 text-blue-700">{title}</h4>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="font-bold"></TableHead>
                {labels.map((label) => (
                  <TableHead key={label} className="text-center font-bold">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold bg-gray-50">{labels[i]}</TableCell>
                  {row.map((val, j) => (
                    <TableCell
                      key={j}
                      className={`text-center ${i === j ? "bg-blue-50 font-bold" : i < j ? "bg-yellow-50" : ""}`}
                    >
                      {val.toFixed(4)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )

    const renderNormalizedMatrix = (normalized: number[][], labels: string[], colSums: number[]) => (
      <div className="mb-6">
        <h4 className="font-semibold text-lg mb-3 text-green-700">Normalized Matrix</h4>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-50">
                <TableHead className="font-bold"></TableHead>
                {labels.map((label) => (
                  <TableHead key={label} className="text-center font-bold">
                    {label}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold bg-green-100">Row Avg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-gray-100 font-semibold text-xs">
                <TableCell>Column Sum</TableCell>
                {colSums.map((sum, i) => (
                  <TableCell key={i} className="text-center">
                    {sum.toFixed(4)}
                  </TableCell>
                ))}
                <TableCell></TableCell>
              </TableRow>
              {normalized.map((row, i) => {
                const rowAvg = row.reduce((a, b) => a + b, 0) / row.length
                return (
                  <TableRow key={i}>
                    <TableCell className="font-semibold bg-gray-50">{labels[i]}</TableCell>
                    {row.map((val, j) => (
                      <TableCell key={j} className="text-center">
                        {val.toFixed(4)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold bg-green-50">{rowAvg.toFixed(4)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )

    const renderPriorityVector = (priorities: number[], labels: string[], color: string) => (
      <div className={`bg-${color}-50 p-4 rounded-lg mb-6 border border-${color}-200`}>
        <h4 className={`font-bold text-${color}-800 mb-3`}>Priority Vector (Weights)</h4>
        <div className="grid grid-cols-3 gap-4">
          {labels.map((label, i) => (
            <div key={i} className="bg-white p-3 rounded-lg shadow-sm border">
              <p className="text-sm text-gray-600 font-medium">{label}</p>
              <p className={`text-2xl font-bold text-${color}-600`}>{priorities[i].toFixed(4)}</p>
              <p className="text-xs text-gray-500">{(priorities[i] * 100).toFixed(2)}%</p>
            </div>
          ))}
        </div>
      </div>
    )

    const renderConsistencyCheck = (consistency: any, color: string) => (
      <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
        <h4 className="font-bold text-yellow-800 mb-3">Consistency Check</h4>

        <div className="mb-4 p-3 bg-white rounded border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Random Index (RI) Reference Values:</p>
          <div className="grid grid-cols-5 gap-2 text-xs">
            {Object.entries(RI_VALUES)
              .slice(0, 10)
              .map(([n, ri]) => (
                <div key={n} className="flex justify-between">
                  <span className="font-medium">n={n}:</span>
                  <span>{ri.toFixed(2)}</span>
                </div>
              ))}
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs mt-1">
            {Object.entries(RI_VALUES)
              .slice(10)
              .map(([n, ri]) => (
                <div key={n} className="flex justify-between">
                  <span className="font-medium">n={n}:</span>
                  <span>{ri.toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">λmax (Lambda Max)</p>
            <p className="text-lg font-bold">{consistency.lambdaMax.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CI (Consistency Index)</p>
            <p className="text-lg font-bold">{consistency.CI.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">RI (Random Index)</p>
            <p className="text-lg font-bold">{consistency.RI.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CR (Consistency Ratio)</p>
            <p className={`text-lg font-bold ${consistency.CR <= 0.10 ? "text-green-600" : "text-red-600"}`}>
              {consistency.CR.toFixed(4)}
            </p>
            <Badge variant={consistency.CR <= 0.1000 ? "default" : "destructive"} className="mt-1">
              {consistency.CR <= 0.1000 ? "✓ Acceptable" : "✗ Needs Review"}
            </Badge>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
          <p className="font-semibold text-gray-700 mb-1">Calculation Formulas:</p>
          <p className="font-mono text-xs text-gray-600">
            CI = (λmax - n) / (n - 1) = ({consistency.lambdaMax.toFixed(4)} - {calc.matrices.criteria.length}) / (
            {calc.matrices.criteria.length} - 1) = {consistency.CI.toFixed(4)}
          </p>
          <p className="font-mono text-xs text-gray-600 mt-1">
            CR = CI / RI = {consistency.CI.toFixed(4)} / {consistency.RI.toFixed(4)} = {consistency.CR.toFixed(4)}
          </p>
          <p className="text-xs text-gray-600 mt-2">✔️ CR {"<="} 0.10 → Judgments are consistent</p>
        </div>
      </div>
    )

    const renderSynthesisMatrix = () => (
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-300">
        <h4 className="font-bold text-gray-800 mb-3 text-xl">Synthesis Matrix</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="font-bold">Alternative</TableHead>
                <TableHead className="text-center">
                  Coding_Hours
                  <br />
                  <span className="text-xs">({(calc.calculations.criteria.priorities[0] * 100).toFixed(2)}%)</span>
                </TableHead>
                <TableHead className="text-center">
                  Study_Hours
                  <br />
                  <span className="text-xs">({(calc.calculations.criteria.priorities[1] * 100).toFixed(2)}%)</span>
                </TableHead>
                <TableHead className="text-center">
                  Attendance
                  <br />
                  <span className="text-xs">({(calc.calculations.criteria.priorities[2] * 100).toFixed(2)}%)</span>
                </TableHead>
                <TableHead className="text-center bg-green-100 font-bold">Final Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calc.alternatives.map((alt, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{alt}</TableCell>
                  <TableCell className="text-center">{calc.calculations.coding.priorities[i].toFixed(4)}</TableCell>
                  <TableCell className="text-center">{calc.calculations.study.priorities[i].toFixed(4)}</TableCell>
                  <TableCell className="text-center">{calc.calculations.attendance.priorities[i].toFixed(4)}</TableCell>
                  <TableCell className="text-center bg-green-50 font-bold text-lg">
                    {expert.submission.final_scores[i].toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Calculation Breakdown:</p>
          {calc.alternatives.map((alt, i) => (
            <p key={i} className="font-mono text-sm text-gray-600">
              {alt} = ({calc.calculations.coding.priorities[i].toFixed(4)} ×{" "}
              {calc.calculations.criteria.priorities[0].toFixed(4)}) + (
              {calc.calculations.study.priorities[i].toFixed(4)} × {calc.calculations.criteria.priorities[1].toFixed(4)}
              ) + ({calc.calculations.attendance.priorities[i].toFixed(4)} ×{" "}
              {calc.calculations.criteria.priorities[2].toFixed(4)}) ={" "}
              <strong className="text-green-700">{expert.submission.final_scores[i].toFixed(4)}</strong>
            </p>
          ))}
        </div>
      </div>
    )

    return (
      <div className="space-y-8">
        {/* Step 1: Criteria Comparison */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-xl text-blue-800">Step 1: Criteria Pairwise Comparison</CardTitle>
            <CardDescription>Determining the relative importance of criteria</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderFullMatrix(calc.matrices.criteria, calc.criteria, "Original Pairwise Comparison Matrix")}
            {renderNormalizedMatrix(
              calc.calculations.criteria.normalized,
              calc.criteria,
              calc.calculations.criteria.colSums,
            )}
            {renderPriorityVector(calc.calculations.criteria.priorities, calc.criteria, "blue")}
            {renderConsistencyCheck(calc.consistency.criteria, "blue")}
          </CardContent>
        </Card>

        {/* Step 2: Coding Hours Alternatives */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-xl text-purple-800">Step 2: Alternatives Comparison - Coding Hours</CardTitle>
            <CardDescription>Comparing alternatives with respect to Coding Hours criterion</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderFullMatrix(calc.matrices.coding, calc.alternatives, "Pairwise Comparison Matrix - Coding Hours")}
            {renderNormalizedMatrix(
              calc.calculations.coding.normalized,
              calc.alternatives,
              calc.calculations.coding.colSums,
            )}
            {renderPriorityVector(calc.calculations.coding.priorities, calc.alternatives, "purple")}
            {renderConsistencyCheck(calc.consistency.coding, "purple")}
          </CardContent>
        </Card>

        {/* Step 3: Study Hours Alternatives */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-xl text-orange-800">Step 3: Alternatives Comparison - Study Hours</CardTitle>
            <CardDescription>Comparing alternatives with respect to Study Hours criterion</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderFullMatrix(calc.matrices.study, calc.alternatives, "Pairwise Comparison Matrix - Study Hours")}
            {renderNormalizedMatrix(
              calc.calculations.study.normalized,
              calc.alternatives,
              calc.calculations.study.colSums,
            )}
            {renderPriorityVector(calc.calculations.study.priorities, calc.alternatives, "orange")}
            {renderConsistencyCheck(calc.consistency.study, "orange")}
          </CardContent>
        </Card>

        {/* Step 4: Attendance Alternatives */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="bg-teal-50">
            <CardTitle className="text-xl text-teal-800">Step 4: Alternatives Comparison - Attendance</CardTitle>
            <CardDescription>Comparing alternatives with respect to Attendance criterion</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderFullMatrix(calc.matrices.attendance, calc.alternatives, "Pairwise Comparison Matrix - Attendance")}
            {renderNormalizedMatrix(
              calc.calculations.attendance.normalized,
              calc.alternatives,
              calc.calculations.attendance.colSums,
            )}
            {renderPriorityVector(calc.calculations.attendance.priorities, calc.alternatives, "teal")}
            {renderConsistencyCheck(calc.consistency.attendance, "teal")}
          </CardContent>
        </Card>

        {/* Step 5: Synthesis & Final Ranking */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl text-green-800">Step 5: Synthesis & Final Ranking</CardTitle>
            <CardDescription>Combining all criteria to determine final alternative rankings</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderSynthesisMatrix()}

            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg border border-green-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">🏆 Final Ranking</h3>
              <div className="space-y-3">
                {expert.submission.ranking.map((item, i) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      i === 0
                        ? "bg-yellow-200 border-2 border-yellow-400"
                        : i === 1
                          ? "bg-gray-200 border-2 border-gray-400"
                          : "bg-orange-200 border-2 border-orange-400"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-3xl font-bold ${
                          i === 0 ? "text-yellow-700" : i === 1 ? "text-gray-700" : "text-orange-700"
                        }`}
                      >
                        #{i + 1}
                      </div>
                      <div>
                        <div className="text-xl font-bold">{item.name}</div>
                        <div className="text-sm text-gray-600">Score: {item.score.toFixed(4)}</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {(item.score * 100).toFixed(2)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderSimplifiedExpertCalculations = (expert: ExpertWithSubmission) => {
    const criteria = ["Coding_Hours", "Study_Hours", "Attendance"]
    const alternatives = ["AI", "CS", "SE"]

    const buildFullMatrix = (upperTriangular: Record<string, number>, size: number) => {
      const m = Array(size)
        .fill(0)
        .map(() => Array(size).fill(0))
      for (let i = 0; i < size; i++) m[i][i] = 1
      for (let i = 0; i < size; i++) {
        for (let j = i + 1; j < size; j++) {
          const key = `${i}-${j}`
          const value = upperTriangular[key] || 1
          m[i][j] = value
          m[j][i] = 1 / value
        }
      }
      return m
    }

    const calculateGeometricMean = (matrix: number[][]) => {
      return matrix.map((row) => {
        const product = row.reduce((acc, val) => acc * val, 1)
        return Math.pow(product, 1 / row.length)
      })
    }

    const calculatePriorityVector = (geometricMeans: number[]) => {
      const sum = geometricMeans.reduce((a, b) => a + b, 0)
      return geometricMeans.map((gm) => gm / sum)
    }

    const calculateConsistency = (matrix: number[][], priorities: number[]) => {
      const n = matrix.length
      const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
      const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
      const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n
      const CI = (lambdaMax - n) / (n - 1)
      const RI_VALUES = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]
      const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
      const CR = CI / RI
      return { lambdaMax, CI, RI, CR }
    }

    const renderMatrixWithGeometricMeanAndPV = (matrix: number[][], labels: string[], title: string, cr: number) => {
      const geometricMeans = calculateGeometricMean(matrix)
      const priorities = calculatePriorityVector(geometricMeans)
      const consistency = calculateConsistency(matrix, priorities)

      return (
        <div className="space-y-4">
          <h5 className="text-sm font-semibold">{title}</h5>

          {/* Pairwise Comparison Matrix */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold"></TableHead>
                  {labels.map((label) => (
                    <TableHead key={label} className="text-center font-bold text-xs">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold bg-gray-50 text-xs">{labels[i]}</TableCell>
                    {row.map((val, j) => (
                      <TableCell key={j} className={`text-center text-xs ${i === j ? "bg-blue-50 font-bold" : ""}`}>
                        {val.toFixed(2)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Geometric Mean Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50">
                  <TableHead className="font-bold text-xs">Criteria/Alternative</TableHead>
                  <TableHead className="text-center font-bold text-xs">Geometric Mean</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labels.map((label, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-xs">{label}</TableCell>
                    <TableCell className="text-center text-xs">{geometricMeans[i].toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Priority Vector Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="font-bold text-xs">Criteria/Alternative</TableHead>
                  <TableHead className="text-center font-bold text-xs">Priority Vector (Weight)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labels.map((label, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-xs">{label}</TableCell>
                    <TableCell className="text-center font-bold text-xs">{priorities[i].toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Consistency Values */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-yellow-50 rounded-lg border">
            <div>
              <p className="text-xs text-gray-600 font-medium">λmax</p>
              <p className="text-sm font-bold">{consistency.lambdaMax.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">CI</p>
              <p className="text-sm font-bold">{consistency.CI.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">RI</p>
              <p className="text-sm font-bold">{consistency.RI.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">CR</p>
              <p className={`text-sm font-bold ${consistency.CR <= 0.1000 ? "text-green-600" : "text-red-600"}`}>
                {consistency.CR.toFixed(4)}
              </p>
              <Badge variant={consistency.CR <= 0.1000 ? "default" : "destructive"} className="mt-1 text-xs">
                {consistency.CR <= 0.1000 ? "Accepted" : "Not Accepted"}
              </Badge>
            </div>
          </div>
        </div>
      )
    }

    const criteriaFull = buildFullMatrix(expert.submission.criteria_matrix, 3)
    const codingFull = buildFullMatrix(expert.submission.coding_hours_matrix, 3)
    const studyFull = buildFullMatrix(expert.submission.study_hours_matrix, 3)
    const attendanceFull = buildFullMatrix(expert.submission.attendance_matrix, 3)

    return (
      <div className="space-y-6">
        {/* Step 1 */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg">Step 1: Criteria Pairwise Comparison</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {renderMatrixWithGeometricMeanAndPV(
              criteriaFull,
              criteria,
              "Pairwise Comparison Matrix",
              expert.submission.consistency_ratios.criteria,
            )}
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg">Step 2: Alternatives - Coding Hours</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {renderMatrixWithGeometricMeanAndPV(
              codingFull,
              alternatives,
              "Pairwise Comparison Matrix",
              expert.submission.consistency_ratios.coding,
            )}
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-lg">Step 3: Alternatives - Study Hours</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {renderMatrixWithGeometricMeanAndPV(
              studyFull,
              alternatives,
              "Pairwise Comparison Matrix",
              expert.submission.consistency_ratios.study,
            )}
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="bg-teal-50">
            <CardTitle className="text-lg">Step 4: Alternatives - Attendance</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {renderMatrixWithGeometricMeanAndPV(
              attendanceFull,
              alternatives,
              "Pairwise Comparison Matrix",
              expert.submission.consistency_ratios.attendance,
            )}
          </CardContent>
        </Card>

        {/* </CHANGE> */}
      </div>
    )
  }

  const downloadExpertCSV = (expert: any) => {
    const crs = expert.submission.consistency_ratios

    // Prepare CSV data
    const csvRows = []

    // Header
    csvRows.push(["AHP Expert Evaluation Report"])
    csvRows.push([])
    csvRows.push(["Expert Information"])
    csvRows.push(["Name", expert.expert_name])
    csvRows.push(["Email", expert.expert_email])
    csvRows.push(["Submitted At", new Date(expert.submitted_at).toLocaleString()])
    csvRows.push([])

    // Consistency Summary
    csvRows.push(["Consistency Summary"])
    csvRows.push(["Step", "Consistency Ratio (CR)", "Status"])
    csvRows.push(["Step 1: Criteria", crs.criteria.toFixed(4), crs.criteria <= 0.1000 ? "Accepted" : "Needs Review"])
    csvRows.push(["Step 2: Coding Hours", crs.coding.toFixed(4), crs.coding <= 0.1000 ? "Accepted" : "Needs Review"])
    csvRows.push(["Step 3: Study Hours", crs.study.toFixed(4), crs.study <= 0.1000 ? "Accepted" : "Needs Review"])
    csvRows.push(["Step 4: Attendance", crs.attendance.toFixed(4), crs.attendance <= 0.1000 ? "Accepted" : "Needs Review"])
    csvRows.push([])

    // Function to calculate consistency details for a matrix
    const calculateConsistencyDetails = (matrix: number[][], priorities: number[]) => {
      const n = matrix.length
      const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
      const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
      const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n
      const CI = (lambdaMax - n) / (n - 1)
      const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
      const CR = CI / RI
      return { lambdaMax, CI, RI, CR, weightedSum, lambdaValues }
    }

    // Process each step with detailed calculations
    const steps = [
      { name: "Criteria", matrix: expert.submission.criteria_matrix, labels: ["Coding Hours", "Study Hours", "Attendance"] },
      { name: "Coding Hours", matrix: expert.submission.coding_hours_matrix, labels: ["AI", "CS", "SE"] },
      { name: "Study Hours", matrix: expert.submission.study_hours_matrix, labels: ["AI", "CS", "SE"] },
      { name: "Attendance", matrix: expert.submission.attendance_matrix, labels: ["AI", "CS", "SE"] }
    ]

    steps.forEach((step, index) => {
      const fullMatrix = buildFullMatrix(step.matrix, 3)
      const priorities = calculatePriorityVector(fullMatrix)

      // Calculate geometric means
      const geometricMeans = fullMatrix.map((row) => {
        const product = row.reduce((acc, val) => acc * val, 1)
        return Math.pow(product, 1 / row.length)
      })

      const consistency = calculateConsistencyDetails(fullMatrix, priorities)

      // Add step header
      csvRows.push([`Step ${index + 1}: ${step.name} Comparison`])
      csvRows.push([])

      // Combined format with Pairwise Comparison Matrix, Geometric Means, and Priority Vectors
      csvRows.push([`${step.name} Pairwise Comparison Matrix`])
      const headerRow = [...step.labels, "Geometric Means", "Priority Vectors (Weights)"]
      csvRows.push(["", ...headerRow])

      step.labels.forEach((name, i) => {
        csvRows.push([name, ...fullMatrix[i].map(val => val.toFixed(4)), geometricMeans[i].toFixed(4), priorities[i].toFixed(4)])
      })
      csvRows.push([])

      // Consistency Calculation Details in beautiful format
      csvRows.push(["Lambda Max (λmax)", consistency.lambdaMax.toFixed(4)])
      csvRows.push(["Consistency Index (CI)", consistency.CI.toFixed(4)])
      csvRows.push(["Random Index (RI)", consistency.RI.toFixed(2)])
      csvRows.push(["Consistency Ratio (CR)", consistency.CR.toFixed(4)])
      csvRows.push(["Status", consistency.CR <= 0.1000 ? "Accepted" : "Needs Review"])
      csvRows.push([])
    })

    // Convert to CSV string
    const csvContent = csvRows.map((row) => {
      // Properly escape commas and quotes in values
      return row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',');
    }).join('\n')

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `expert_${expert.expert_name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  // </CHANGE>

  const downloadAllExpertsCSV = () => {
    if (experts.length === 0) {
      alert("No expert submissions available to download.");
      return;
    }

    // Prepare CSV data
    const csvRows = [];

    // Add header information
    csvRows.push(["AHP All Expert Evaluations Report"]);
    csvRows.push(["Generated on:", new Date().toLocaleString()]);
    csvRows.push(["Total Experts:", experts.length]);
    csvRows.push([]);

    // Function to calculate consistency details for a matrix
    const calculateConsistencyDetails = (matrix: number[][], priorities: number[]) => {
      const n = matrix.length
      const weightedSum = matrix.map((row) => row.reduce((sum, val, j) => sum + val * priorities[j], 0))
      const lambdaValues = weightedSum.map((ws, i) => ws / priorities[i])
      const lambdaMax = lambdaValues.reduce((a, b) => a + b, 0) / n
      const CI = (lambdaMax - n) / (n - 1)
      const RI = n < RI_VALUES.length ? RI_VALUES[n] : 1.59
      const CR = CI / RI
      return { lambdaMax, CI, RI, CR, weightedSum, lambdaValues }
    }

    // Process each expert with their detailed calculations
    experts.forEach((expert, index) => {
      // Add expert header
      csvRows.push([`--- Expert ${index + 1}: ${expert.expert_name} ---`]);
      csvRows.push([]);

      // Expert information
      csvRows.push(["Expert Information"]);
      csvRows.push(["Expert ID", expert.id]);
      csvRows.push(["Expert Name", expert.expert_name]);
      csvRows.push(["Expert Email", expert.expert_email || ""]);
      csvRows.push(["Submitted At", new Date(expert.submitted_at).toLocaleString()]);
      csvRows.push([]);

      // Consistency Summary
      const crs = expert.submission.consistency_ratios;
      csvRows.push(["Consistency Summary"]);
      csvRows.push(["Step", "Consistency Ratio (CR)", "Status"]);
      csvRows.push(["Step 1: Criteria", crs.criteria.toFixed(4), crs.criteria <= 0.1000 ? "Accepted" : "Needs Review"]);
      csvRows.push(["Step 2: Coding Hours", crs.coding.toFixed(4), crs.coding <= 0.1000 ? "Accepted" : "Needs Review"]);
      csvRows.push(["Step 3: Study Hours", crs.study.toFixed(4), crs.study <= 0.1000 ? "Accepted" : "Needs Review"]);
      csvRows.push(["Step 4: Attendance", crs.attendance.toFixed(4), crs.attendance <= 0.1000 ? "Accepted" : "Needs Review"]);
      csvRows.push([]);

      // Process each step with detailed calculations
      const steps = [
        { name: "Criteria", matrix: expert.submission.criteria_matrix, labels: ["Coding Hours", "Study Hours", "Attendance"] },
        { name: "Coding Hours", matrix: expert.submission.coding_hours_matrix, labels: ["AI", "CS", "SE"] },
        { name: "Study Hours", matrix: expert.submission.study_hours_matrix, labels: ["AI", "CS", "SE"] },
        { name: "Attendance", matrix: expert.submission.attendance_matrix, labels: ["AI", "CS", "SE"] }
      ];

      steps.forEach((step, stepIndex) => {
        const fullMatrix = buildFullMatrix(step.matrix, 3);
        const priorities = calculatePriorityVector(fullMatrix);

        // Calculate geometric means
        const geometricMeans = fullMatrix.map((row) => {
          const product = row.reduce((acc, val) => acc * val, 1)
          return Math.pow(product, 1 / row.length)
        });

        const consistency = calculateConsistencyDetails(fullMatrix, priorities);

        // Add step header
        csvRows.push([`Step ${stepIndex + 1}: ${step.name} Comparison`]);
        csvRows.push([]);

        // Combined format with Pairwise Comparison Matrix, Geometric Means, and Priority Vectors
        csvRows.push([`${step.name} Pairwise Comparison Matrix`]);
        const headerRow = [...step.labels, "Geometric Means", "Priority Vectors (Weights)"];
        csvRows.push(["", ...headerRow]);

        step.labels.forEach((name, i) => {
          csvRows.push([name, ...fullMatrix[i].map(val => val.toFixed(4)), geometricMeans[i].toFixed(4), priorities[i].toFixed(4)]);
        });
        csvRows.push([]);

        // Consistency Calculation Details in beautiful format
        csvRows.push(["Lambda Max (λmax)", consistency.lambdaMax.toFixed(4)]);
        csvRows.push(["Consistency Index (CI)", consistency.CI.toFixed(4)]);
        csvRows.push(["Random Index (RI)", consistency.RI.toFixed(2)]);
        csvRows.push(["Consistency Ratio (CR)", consistency.CR.toFixed(4)]);
        csvRows.push(["Status", consistency.CR <= 0.1000 ? "Accepted" : "Needs Review"]);
        csvRows.push([]);
      });

      csvRows.push([]); // Extra space between experts
    });

    // Convert to CSV string
    const csvContent = csvRows.map((row) => {
      // Properly escape commas and quotes in values
      return row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',');
    }).join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `all_experts_ahp_submissions_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderAggregatedResults = () => {
    if (!aggregatedResults) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Aggregated Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No expert evaluations submitted yet.</p>
          </CardContent>
        </Card>
      )
    }

    if ("acceptedCount" in aggregatedResults && aggregatedResults.acceptedCount === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Aggregated Results</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No accepted expert evaluations available for aggregation. All {aggregatedResults.needsReviewCount}{" "}
              submission(s) need consistency review.
            </p>
          </CardContent>
        </Card>
      )
    }

    const { matrices, priorities, consistency, ranking, stepAcceptance, finalScores } = aggregatedResults as Exclude<
      AggregatedResults,
      { acceptedCount: 0 }
    >

    const alternatives = ["AI", "CS", "SE"]
    const criteriaNames = ["Coding Hours", "Study Hours", "Attendance"]

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Step 1: Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stepAcceptance.criteria.accepted}</div>
              <p className="text-xs text-muted-foreground">
                Accepted / {stepAcceptance.criteria.needsReview} Needs Review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Step 2: Coding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stepAcceptance.coding.accepted}</div>
              <p className="text-xs text-muted-foreground">
                Accepted / {stepAcceptance.coding.needsReview} Needs Review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Step 3: Study</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stepAcceptance.study.accepted}</div>
              <p className="text-xs text-muted-foreground">
                Accepted / {stepAcceptance.study.needsReview} Needs Review
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Step 4: Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stepAcceptance.attendance.accepted}</div>
              <p className="text-xs text-muted-foreground">
                Accepted / {stepAcceptance.attendance.needsReview} Needs Review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Step 1: Criteria Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Criteria Pairwise Comparison (Aggregated)</CardTitle>
            <p className="text-sm text-muted-foreground">Using {stepAcceptance.criteria.accepted} accepted expert(s)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pairwise Comparison Matrix */}
            <div>
              <h4 className="font-semibold mb-3">Pairwise Comparison Matrix</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32"></TableHead>
                      {criteriaNames.map((c) => (
                        <TableHead key={c} className="text-center">
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrices?.criteria?.map((row: number[], i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold">{criteriaNames[i]}</TableCell>
                        {row.map((val: number, j: number) => (
                          <TableCell key={j} className={`text-center ${i === j ? "bg-blue-100 font-bold" : ""}`}>
                            {val.toFixed(3)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Geometric Mean & Priority Vector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3">Geometric Mean</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterion</TableHead>
                      <TableHead className="text-right">GM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteriaNames.map((c, i) => {
                      const product = matrices?.criteria[i]?.reduce((acc: number, val: number) => acc * val, 1) || 1
                      const gm = Math.pow(product, 1 / 3)
                      return (
                        <TableRow key={i}>
                          <TableCell>{c}</TableCell>
                          <TableCell className="text-right">{gm.toFixed(4)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Priority Vector (PV)</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterion</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteriaNames.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c}</TableCell>
                        <TableCell className="text-right">{priorities?.criteria[i]?.toFixed(4) || "0.0000"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Consistency */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Consistency Check</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">λmax:</span>{" "}
                  <span className="font-mono">{consistency?.criteria?.lambdaMax?.toFixed(4) || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CI:</span>{" "}
                  <span className="font-mono">{consistency?.criteria?.CI?.toFixed(4) || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">RI:</span>{" "}
                  <span className="font-mono">{consistency?.criteria?.RI?.toFixed(2) || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CR:</span>{" "}
                  <span className="font-mono font-bold">{consistency?.criteria?.CR?.toFixed(4) || "N/A"}</span>
                  {consistency?.criteria?.CR !== undefined && (
                    <Badge variant={consistency.criteria.CR <= 0.1000 ? "default" : "destructive"} className="ml-2">
                      {consistency.criteria.CR <= 0.1000 ? "Accepted" : "Not Accepted"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps 2-4: Alternative Comparisons */}
        {[
          {
            key: "coding",
            label: "Coding_Hours",
            matrix: matrices?.coding,
            priority: priorities?.coding,
            cons: consistency?.coding,
          },
          {
            key: "study",
            label: "Study_Hours",
            matrix: matrices?.study,
            priority: priorities?.study,
            cons: consistency?.study,
          },
          {
            key: "attendance",
            label: "Attendance",
            matrix: matrices?.attendance,
            priority: priorities?.attendance,
            cons: consistency?.attendance,
          },
        ].map((item, stepIndex) => (
          <Card key={item.key} className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle>
                Step {stepIndex + 2}: Alternatives with respect to {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Pairwise Comparison Matrix */}
                <div>
                  <h4 className="font-semibold mb-3">Pairwise Comparison Matrix</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32"></TableHead>
                          {alternatives.map((alt) => (
                            <TableHead key={alt} className="text-center">
                              {alt}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {item.matrix?.map((row: number[], i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-semibold">{alternatives[i]}</TableCell>
                            {row.map((val: number, j: number) => (
                              <TableCell key={j} className={`text-center ${i === j ? "bg-purple-100 font-bold" : ""}`}>
                                {val.toFixed(3)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Geometric Mean & Priority Vector */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-3">Geometric Mean</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alternative</TableHead>
                          <TableHead className="text-right">GM</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alternatives.map((alt, i) => {
                          const product = item.matrix?.[i]?.reduce((acc: number, val: number) => acc * val, 1) || 1
                          const gm = Math.pow(product, 1 / 3)
                          return (
                            <TableRow key={i}>
                              <TableCell>{alt}</TableCell>
                              <TableCell className="text-right">{gm.toFixed(4)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Priority Vector (PV)</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alternative</TableHead>
                          <TableHead className="text-right">Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alternatives.map((alt, i) => (
                          <TableRow key={i}>
                            <TableCell>{alt}</TableCell>
                            <TableCell className="text-right">{item.priority?.[i]?.toFixed(4) || "0.0000"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Consistency */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Consistency Check</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">λmax:</span>{" "}
                      <span className="font-mono">{item.cons?.lambdaMax?.toFixed(4) || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CI:</span>{" "}
                      <span className="font-mono">{item.cons?.CI?.toFixed(4) || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">RI:</span>{" "}
                      <span className="font-mono">{item.cons?.RI?.toFixed(2) || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CR:</span>{" "}
                      <span className="font-mono font-bold">{item.cons?.CR?.toFixed(4) || "N/A"}</span>
                      {item.cons?.CR !== undefined && (
                        <Badge variant={item.cons.CR <= 0.1000 ? "default" : "destructive"} className="ml-2">
                          {item.cons.CR <= 0.1000 ? "Accepted" : "Not Accepted"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Step 5: Final Score Calculation */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle>Step 5: Final Score Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Calculation Breakdown</h4>
                <div className="space-y-4">
                  {alternatives.map((alt, i) => (
                    <div key={alt} className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-bold text-lg mb-2">{alt}</h5>
                      <div className="space-y-1 text-sm font-mono">
                        <div>
                          Score = ({(priorities?.criteria[0] || 0).toFixed(4)} ×{" "}
                          {(priorities?.coding[i] || 0).toFixed(4)}) + ({(priorities?.criteria[1] || 0).toFixed(4)} ×{" "}
                          {(priorities?.study[i] || 0).toFixed(4)}) + ({(priorities?.criteria[2] || 0).toFixed(4)} ×{" "}
                          {(priorities?.attendance[i] || 0).toFixed(4)})
                        </div>
                        <div>
                          Score = {((priorities?.criteria[0] || 0) * (priorities?.coding[i] || 0)).toFixed(4)} +
                          {((priorities?.criteria[1] || 0) * (priorities?.study[i] || 0)).toFixed(4)} +
                          {((priorities?.criteria[2] || 0) * (priorities?.attendance[i] || 0)).toFixed(4)}
                        </div>
                        <div className="font-bold text-base">Score = {finalScores?.[i]?.toFixed(4) || "0.0000"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Ranking */}
              <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg border border-green-300">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">🏆 Final Ranking</h3>
                <div className="space-y-3">
                  {ranking.map((item: any, i: number) => (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        i === 0
                          ? "bg-yellow-200 border-2 border-yellow-400"
                          : i === 1
                            ? "bg-gray-200 border-2 border-gray-400"
                            : "bg-orange-200 border-2 border-orange-400"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-3xl font-bold ${
                            i === 0 ? "text-yellow-700" : i === 1 ? "text-gray-700" : "text-orange-700"
                          }`}
                        >
                          #{i + 1}
                        </div>
                        <div>
                          <div className="text-xl font-bold">{item.name}</div>
                          <div className="text-sm text-gray-600">Score: {item.score.toFixed(4)}</div>
                        </div>
                      </div>
                      <Badge variant="default" className="text-lg px-4 py-2">
                        {(item.score * 100).toFixed(2)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalSteps = experts.length * 4 // Each expert has 4 steps
  const acceptedSteps = experts.reduce((count, expert) => {
    const crs = expert.submission.consistency_ratios
    return (
      count +
      (crs.criteria <= 0.1000 ? 1 : 0) +
      (crs.coding <= 0.1000 ? 1 : 0) +
      (crs.study <= 0.1000 ? 1 : 0) +
      (crs.attendance <= 0.1000 ? 1 : 0)
    )
  }, 0)
  const needsReviewSteps = totalSteps - acceptedSteps
  // </CHANGE>

  const chartData = aggregatedResults?.ranking
    ? aggregatedResults.ranking.map((item: any) => ({
        name: item.name,
        score: (item.score * 100).toFixed(2),
      }))
    : []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AHP Admin Dashboard</h1>
          <p className="text-muted-foreground">View and analyze expert submissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button variant="outline" onClick={downloadAllExpertsCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Download All Submissions (CSV)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Experts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{experts.length}</div>
            <p className="text-xs text-muted-foreground">Expert evaluations submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Steps</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{acceptedSteps}</div>
            <p className="text-xs text-muted-foreground">Expert steps with CR ≤ 0.10</p>
            {/* </CHANGE> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review Steps</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{needsReviewSteps}</div>
            <p className="text-xs text-muted-foreground">Expert steps with CR &gt; 0.10</p>
            {/* </CHANGE> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Alternative</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedResults?.ranking?.[0]?.name || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {aggregatedResults?.ranking?.[0]?.score
                ? `${(aggregatedResults.ranking[0].score * 100).toFixed(1)}% score`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>
      {/* </CHANGE> */}

      <Tabs defaultValue="aggregated" className="space-y-4">
        <TabsList>
          <TabsTrigger value="aggregated">Aggregated Results</TabsTrigger>
          <TabsTrigger value="experts">Expert Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="aggregated" className="space-y-4">
          {renderAggregatedResults()}

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="hsl(var(--primary))" name="Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experts" className="space-y-4">
          {experts.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {experts.map((expert, index) => {
                const crs = expert.submission.consistency_ratios
                const stepStatuses = {
                  criteria: crs.criteria <= 0.1000,
                  coding: crs.coding <= 0.1000,
                  study: crs.study <= 0.1000,
                  attendance: crs.attendance <= 0.1000,
                }
                const acceptedCount = Object.values(stepStatuses).filter(Boolean).length
                const isFullyAccepted = acceptedCount === 4
                // </CHANGE>

                return (
                  <AccordionItem key={expert.id} value={`expert-${index}`}>
                    <div className="flex items-center justify-between w-full pr-4 border-b">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="font-mono">
                            #{index + 1}
                          </Badge>
                          <div className="text-left">
                            <div className="font-semibold">{expert.expert_name}</div>
                            <div className="text-sm text-muted-foreground">{expert.expert_email}</div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <div className="flex items-center gap-2 pl-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadExpertCSV(expert)
                          }}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          CSV
                        </Button>
                        {/* </CHANGE> */}
                        <Badge variant={isFullyAccepted ? "default" : "destructive"}>
                          {isFullyAccepted ? "✓ All Accepted" : `⚠ ${acceptedCount}/4 Accepted`}
                        </Badge>
                        <div className="flex gap-1">
                          <Badge variant={stepStatuses.criteria ? "default" : "outline"} className="text-xs px-2">
                            S1 {stepStatuses.criteria ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={stepStatuses.coding ? "default" : "outline"} className="text-xs px-2">
                            S2 {stepStatuses.coding ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={stepStatuses.study ? "default" : "outline"} className="text-xs px-2">
                            S3 {stepStatuses.study ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={stepStatuses.attendance ? "default" : "outline"} className="text-xs px-2">
                            S4 {stepStatuses.attendance ? "✓" : "✗"}
                          </Badge>
                        </div>
                        {/* </CHANGE> */}
                        <Badge variant="outline" className="text-xs">
                          {new Date(expert.submitted_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <AccordionContent>
                      <div className="pt-4">{renderSimplifiedExpertCalculations(expert)}</div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No expert submissions yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
