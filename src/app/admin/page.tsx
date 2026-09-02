'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import AdminPanel from './AdminPanel'

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [username, setUsername] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push('/login')
          return
        }

        // Direct query to profiles table via client (works across web, mobile, desktop)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.warn('Profile fetch error in AdminPage:', profileError)
        }

        if (profile?.is_admin === true || profile?.role === 'admin') {
          setIsAdmin(true)
          setUsername(profile.username || user.email?.split('@')[0] || 'Admin')
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Admin check failed:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001a0d] flex items-center justify-center text-green-500">
        <div className="flex items-center gap-4">
          <span className="text-xl font-medium animate-pulse">Yetki kontrol ediliyor...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return <AdminPanel adminUsername={username} />
}
