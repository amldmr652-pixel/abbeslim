import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Admin client ile RLS bypass ederek profil çek
  let { data: profile } = await adminClient
    .from('profiles')
    .select('id, username, status, is_admin, role, created_at, last_sign_in_at')
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

  // Eğer is_admin false ise ama tek kullanıcı ise veya profilde admin ise güncelle
  if (profile && !profile.is_admin) {
    const { count } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (count === 1 || count === null) {
      await adminClient
        .from('profiles')
        .update({ is_admin: true, status: 'approved' })
        .eq('id', user.id)
      profile.is_admin = true
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
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(profile)
}
