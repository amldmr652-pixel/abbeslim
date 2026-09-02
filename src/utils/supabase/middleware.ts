import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // RLS'yi bypass etmek için service role client (sadece profil kontrolü için)
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute    = path.startsWith('/login') || path.startsWith('/register')
  const isPendingRoute = path.startsWith('/pending-approval')
  const isAdminRoute   = path.startsWith('/admin')
  const isApiRoute     = path.startsWith('/api')

  // Giriş yapılmamışsa ve korumalı bir sayfaysa → login'e yönlendir
  if (!user && !isAuthRoute && !isPendingRoute && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Giriş yapılmışsa ek kontroller
  if (user) {
    // Auth sayfalarına gitmeye çalışıyorsa → ana sayfaya yönlendir
    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // API ve pending sayfaları için profil kontrolü yapma (sonsuz döngü önlenir)
    if (!isApiRoute && !isPendingRoute) {
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('status, role, is_admin')
        .eq('id', user.id)
        .single()

      // Profil yoksa veya pending/banned ise → pending-approval sayfasına
      if (!profile || profile.status === 'pending' || profile.status === 'banned') {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }

      // Admin paneli için role/is_admin kontrolü
      const isAdminUser = profile.is_admin === true || profile.role === 'admin'
      if (isAdminRoute && !isAdminUser) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
