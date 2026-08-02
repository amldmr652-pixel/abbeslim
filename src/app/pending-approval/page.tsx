'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Clock, LogOut, ShieldCheck } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useTranslation } from '@/app/hooks/useTranslation'

export default function PendingApprovalPage() {
  const router = useRouter()
  const supabase = createClient()
  const redirectingRef = useRef(false)
  const { t } = useTranslation()

  const goToHome = () => {
    if (redirectingRef.current) return
    redirectingRef.current = true
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>

    // ── 1. Supabase Realtime: profiles tablosundaki değişikliği anlık yakala ──
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const channel = supabase
        .channel('profile-status-watch')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new?.status === 'approved') {
              goToHome()
            }
          }
        )
        .subscribe()

      return channel
    }

    // ── 2. Polling fallback: Realtime çalışmazsa 5s'de bir kontrol et ──
    const startPolling = () => {
      intervalId = setInterval(async () => {
        try {
          const res = await apiClient('/api/admin/me')
          if (res.ok) {
            const profile = await res.json()
            if (profile.status === 'approved') {
              goToHome()
            }
          }
        } catch {
          // ağ hatası — bir sonraki tur dene
        }
      }, 5000)
    }

    let realtimeChannel: Awaited<ReturnType<typeof setupRealtime>>

    setupRealtime().then((ch) => {
      realtimeChannel = ch
    })
    startPolling()

    return () => {
      clearInterval(intervalId)
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.12) 0%, #0a0a0a 60%)',
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 border border-yellow-900/40 shadow-2xl text-center"
        style={{
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(234,179,8,0.08)',
        }}
      >
        {/* İkon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.3)',
            }}
          >
            <Clock size={36} className="text-yellow-500 animate-pulse" />
          </div>
        </div>

        {/* Başlık */}
        <div className="text-3xl font-bold tracking-wider text-yellow-500 mb-2">abbeslim.</div>
        <h1 className="text-xl font-semibold text-white mb-3">{t('auth.pendingApproval')}</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          {t('auth.pendingMessage')}
        </p>

        {/* Durum göstergesi */}
        <div
          className="flex items-center gap-3 p-4 rounded-2xl mb-6 text-left"
          style={{
            background: 'rgba(234,179,8,0.07)',
            border: '1px solid rgba(234,179,8,0.2)',
          }}
        >
          <ShieldCheck size={18} className="text-yellow-500 shrink-0" />
          <div>
            <p className="text-yellow-400 text-sm font-medium">{t('auth.waitingList')}</p>
            <p className="text-gray-500 text-xs mt-0.5">
              {t('auth.autoLoginWhenApproved')}
            </p>
          </div>
          <div className="ml-auto">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
          </div>
        </div>

        {/* Çıkış butonu */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-2xl border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <LogOut size={16} />
          {t('sidebar.logout')}
        </button>
      </div>
    </div>
  )
}
