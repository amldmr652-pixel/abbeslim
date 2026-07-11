'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Users, Clock, CheckCircle2, Ban, Trash2,
  RefreshCw, UserCheck, Activity, LogOut,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type UserStatus = 'pending' | 'approved' | 'banned'
type FilterTab = 'all' | UserStatus

interface UserProfile {
  id: string
  username: string
  status: UserStatus
  is_admin: boolean
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminPanel({ adminUsername }: { adminUsername: string }) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setUsers(data)
    } catch {
      showToast('Kullanıcılar yüklenemedi.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const updateStatus = async (userId: string, status: UserStatus) => {
    setActionLoading(userId + status)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
      showToast(
        status === 'approved' ? '✓ Kullanıcı onaylandı.' :
        status === 'banned'   ? '⊘ Kullanıcı banlandı.' :
                                '↺ Kullanıcı beklemeye alındı.',
        'success'
      )
    } catch {
      showToast('İşlem başarısız.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`"${username}" adlı kullanıcıyı kalıcı olarak silmek istediğine emin misin?`)) return
    setActionLoading(userId + 'delete')
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.filter(u => u.id !== userId))
      showToast('Kullanıcı silindi.', 'success')
    } catch {
      showToast('Silme işlemi başarısız.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter)

  const stats = {
    total:    users.length,
    pending:  users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    banned:   users.filter(u => u.status === 'banned').length,
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const statusBadge = (status: UserStatus) => {
    const map: Record<UserStatus, string> = {
      pending:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      approved: 'bg-green-500/10  text-green-400  border-green-500/30',
      banned:   'bg-red-500/10    text-red-400    border-red-500/30',
    }
    const labels: Record<UserStatus, string> = {
      pending: 'Bekliyor', approved: 'Onaylı', banned: 'Banlı',
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* Toast bildirimi */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-medium shadow-xl transition-all ${
            toast.type === 'success'
              ? 'bg-green-950 border border-green-500/30 text-green-400'
              : 'bg-red-950 border border-red-500/30 text-red-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header
        className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 z-40"
        style={{ background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <Shield size={16} className="text-green-500" />
          </div>
          <div>
            <span className="text-white font-bold text-lg">abbeslim.</span>
            <span className="text-gray-600 text-sm ml-2">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm hidden sm:block">@{adminUsername}</span>
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Siteye Dön
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-gray-500 hover:text-red-400 text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-red-950/30"
          >
            <LogOut size={14} />
            Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* İstatistik kartları */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {([
            { label: 'Toplam',   value: stats.total,    icon: Users,        colorClass: 'text-blue-400',   borderColor: 'rgba(59,130,246,0.15)' },
            { label: 'Bekleyen', value: stats.pending,  icon: Clock,        colorClass: 'text-yellow-400', borderColor: 'rgba(234,179,8,0.15)' },
            { label: 'Onaylı',   value: stats.approved, icon: CheckCircle2, colorClass: 'text-green-400',  borderColor: 'rgba(34,197,94,0.15)' },
            { label: 'Banlı',    value: stats.banned,   icon: Ban,          colorClass: 'text-red-400',    borderColor: 'rgba(239,68,68,0.15)' },
          ] as const).map(({ label, value, icon: Icon, colorClass, borderColor }) => (
            <div
              key={label}
              className="rounded-2xl p-4 border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={colorClass} />
                <span className="text-gray-500 text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Filtre + Yenile */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'banned'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  filter === tab
                    ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'Tümü' :
                 tab === 'pending' ? 'Bekleyenler' :
                 tab === 'approved' ? 'Onaylılar' : 'Banlılar'}
                {tab !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-60">
                    ({tab === 'pending' ? stats.pending :
                      tab === 'approved' ? stats.approved : stats.banned})
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        {/* Kullanıcı listesi */}
        <div
          className="rounded-2xl border border-white/5 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.01)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              <RefreshCw size={20} className="animate-spin mr-2" />
              Yükleniyor...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Activity size={32} className="mb-3 opacity-40" />
              <p className="text-sm">Bu kategoride kullanıcı yok.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map(u => (
                <div
                  key={u.id}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Kullanıcı bilgileri */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-semibold">@{u.username}</span>
                      {u.is_admin && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/30 shrink-0">
                          Admin
                        </span>
                      )}
                      {statusBadge(u.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-600">
                      <span>Kayıt: {formatDate(u.created_at)}</span>
                      <span>Son giriş: {formatDate(u.last_sign_in_at)}</span>
                    </div>
                  </div>

                  {/* Aksiyon butonları */}
                  {!u.is_admin ? (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {u.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(u.id, 'approved')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-green-600/10 text-green-400 border border-green-600/20 hover:bg-green-600/20 transition-all disabled:opacity-50"
                        >
                          <UserCheck size={13} />
                          Onayla
                        </button>
                      )}
                      {u.status !== 'banned' && (
                        <button
                          onClick={() => updateStatus(u.id, 'banned')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600/20 transition-all disabled:opacity-50"
                        >
                          <Ban size={13} />
                          Banla
                        </button>
                      )}
                      {u.status === 'banned' && (
                        <button
                          onClick={() => updateStatus(u.id, 'pending')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-yellow-600/10 text-yellow-400 border border-yellow-600/20 hover:bg-yellow-600/20 transition-all disabled:opacity-50"
                        >
                          <Clock size={13} />
                          Beklemeye Al
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(u.id, u.username)}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-gray-500 border border-white/10 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/40 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Sil
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-700 shrink-0">Bu hesap korumalı</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
