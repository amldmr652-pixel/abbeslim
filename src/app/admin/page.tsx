'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { apiClient } from '@/lib/apiClient'
import AdminPanel from './AdminPanel'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [username, setUsername] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const res = await apiClient('/api/admin/me')
        if (!res.ok) {
          router.push('/')
          return
        }

        const profile = await res.json()
        if (profile.is_admin) {
          setIsAdmin(true)
          setUsername(profile.username || '')
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
  }, [router, supabase])

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
