import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Mevcut kullanıcının admin olup olmadığını kontrol eden yardımcı
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // RLS'yi bypass etmek için admin client kullan
  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin && profile?.role !== 'admin') return null
  return { supabase, adminClient, user }
}

// GET — Tüm kullanıcı listesi
export async function GET() {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })

  const { data: profiles, error } = await auth.adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json(profiles, { headers: corsHeaders })
}

// PATCH — Kullanıcı durumunu güncelle (approve / ban / pending)
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })

  const body = await request.json()
  const { userId, status } = body

  if (!userId || !['approved', 'banned', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders })
  }

  const { error } = await auth.adminClient
    .from('profiles')
    .update({ status })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  return NextResponse.json({ success: true }, { headers: corsHeaders })
}

// DELETE — Kullanıcıyı kalıcı sil (auth + profile)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers: corsHeaders })

  // Kendi kendini silmeyi engelle
  if (userId === auth.user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400, headers: corsHeaders })
  }

  // 1. Önce profiles tablosundan sil
  await auth.adminClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  // 2. Sonra auth.users'dan sil
  const { error } = await auth.adminClient.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }

  return NextResponse.json({ success: true }, { headers: corsHeaders })
}
