'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { LogIn, Key, User, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/app/hooks/useTranslation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Kullanıcı adını gizli e-posta formatına çevir
    const email = `${username.trim().toLowerCase()}@notefinder.app`

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t('auth.loginError'))
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.15) 0%, #0a0a0a 60%)' }}>
      <div className="w-full max-w-md rounded-3xl p-8 border border-green-900/40 shadow-2xl" style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 0 60px rgba(34,197,94,0.1)' }}>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-wider text-green-500 mb-2">abbeslim.</div>
          <p className="text-gray-400 text-sm">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.username')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-600">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                required
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-green-900/50 bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="kullanici_adi"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-600">
                <Key size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-green-900/50 bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all focus:ring-4 focus:ring-green-500/20 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 mt-2"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('auth.loggingIn')}</>
            ) : (
              <><LogIn size={18} /> {t('auth.login')}</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t('auth.noAccount')}{' '}
          <a href="/register" className="text-green-500 hover:text-green-400 font-semibold transition-colors">
            {t('auth.register')}
          </a>
        </div>
      </div>
    </div>
  )
}
