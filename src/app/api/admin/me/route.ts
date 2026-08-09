import { NextResponse } from 'next/server'
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

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const adminClient = createAdminClient()

  // Admin client ile RLS bypass ederek profil çek
  let { data: profile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Eğer profil hiç yoksa, otomatik olarak approved admin olarak oluştur
  if (!profile) {
    const { data: newProfile, error: insertError } = await adminClient
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.email?.split('@')[0] || 'admin',
        status: 'approved',
        is_admin: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (!insertError && newProfile) {
      profile = newProfile
    }
  }

  // Eğer is_admin false ise ama role === 'admin' veya tek kullanıcı ise güncelle
  if (profile && !profile.is_admin) {
    if (profile.role === 'admin') {
      profile.is_admin = true
    } else {
      const { count } = await adminClient
        .from('profiles')
        .select('id', { count: 'exact', head: true })

      if (count === 1 || count === null || count === 0) {
        await adminClient
          .from('profiles')
          .update({ is_admin: true, status: 'approved' })
          .eq('id', user.id)
        profile.is_admin = true
      }
    }
  }

  // user_metadata içerisine de is_admin: true senkronize et (Eski EXE ve APK versiyonları için)
  if (profile?.is_admin && !user.user_metadata?.is_admin) {
    try {
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { ...(user.user_metadata || {}), is_admin: true }
      })
    } catch (e) {
      // Ignore error
    }
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers: corsHeaders })
  }

  return NextResponse.json(profile, { headers: corsHeaders })
}
