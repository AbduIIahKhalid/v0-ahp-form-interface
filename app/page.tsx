import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">AHP Decision Support System</h1>
          <p className="text-xl text-gray-600 text-pretty">
            Analytical Hierarchy Process for Multi-Criteria Decision Making
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Expert Evaluation</CardTitle>
              <CardDescription>Submit your evaluation as an expert in the decision-making process</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Provide pairwise comparisons for criteria and alternatives to help determine the best choice
              </p>
              <Link href="/expert">
                <Button size="lg" className="w-full">
                  Start Evaluation
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>View aggregated results and expert submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access comprehensive analysis, view all expert evaluations, and see aggregated rankings
              </p>
              <Link href="/admin">
                <Button size="lg" variant="outline" className="w-full bg-transparent">
                  Admin Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/50">
          <CardHeader>
            <CardTitle>About AHP</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              The Analytical Hierarchy Process (AHP) is a structured technique for organizing and analyzing complex
              decisions based on mathematics and psychology.
            </p>
            <p>
              This system evaluates three alternatives (AI, CS, SE) across three criteria (Coding Hours, Study Hours,
              Attendance) using expert pairwise comparisons.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
