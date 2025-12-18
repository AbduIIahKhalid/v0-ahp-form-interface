import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Special client creation for API routes that handles auth properly
export async function createClientForAPIRoute(request?: NextRequest) {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// For use in API routes specifically when we need the request object
export async function createClientFromRequest(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // For API routes, we need to extract cookies from the request
          const cookieHeader = request.headers.get('Cookie')
          if (!cookieHeader) return []

          return cookieHeader.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=')
            return { name, value }
          })
        },
        setAll() {
          // We can't set cookies from API route response in the same way
          // This is a limitation of this approach
        },
      },
    }
  )

  return supabase
}