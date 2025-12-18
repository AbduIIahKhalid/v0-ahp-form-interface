import { createClient } from "@/lib/supabase/server"
import AdminDashboard from "@/components/admin-dashboard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

export default async function AdminPage() {
  const supabase = await createClient()

  console.log("[v0] Admin page: Checking authentication")

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log("[v0] Admin page: User check result", { user: user?.email, error })

  // If not authenticated, show login prompt instead of redirecting
  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You need to be logged in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Link href="/auth/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log("[v0] Admin page: User authenticated, showing dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Logged in as: <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
            <form action="/auth/signout" method="post">
              <Button variant="destructive" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        <AdminDashboard />
      </div>
    </div>
  )
}
