'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { UserPlus, Key, User, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from '@/app/hooks/useTranslation'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedUsername = username.trim().toLowerCase()

    if (trimmedUsername.length < 3) {
      setError(t('auth.usernameLengthError'))
      return
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError(t('auth.usernameFormatError'))
      return
    }
    if (password.length < 6) {
      setError(t('auth.passwordLengthError'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatchError'))
      return
    }

    setLoading(true)

    // Kullanıcı adını gizli e-posta formatına çevir
    const email = `${trimmedUsername}@notefinder.app`

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError(t('auth.usernameTakenError'))
      } else {
        setError('Kayıt sırasında bir hata oluştu: ' + error.message)
      }
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        router.push('/pending-approval')
        router.refresh()
      }, 1500)
    }
  }

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.15) 0%, #0a0a0a 60%)' }}>
      <div className="w-full max-w-md rounded-3xl p-8 border border-green-900/40 shadow-2xl" style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 0 60px rgba(34,197,94,0.1)' }}>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-wider text-green-500 mb-2">abbeslim.</div>
          <p className="text-gray-400 text-sm">{t('auth.registerSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-green-950/50 border border-green-500/30 flex items-center gap-3 text-green-400 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <p>{t('auth.registerSuccess')}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Kullanıcı Adı */}
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
                placeholder="ornek_kullanici"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1.5 px-1">Harf, rakam ve alt çizgi (_) kullanabilirsiniz.</p>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-green-600">
                <Key size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-green-900/50 bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="En az 6 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Şifreyi Onayla */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key size={18} className={passwordsMatch ? 'text-green-500' : passwordsMismatch ? 'text-red-500' : 'text-green-600'} />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={`w-full pl-11 pr-12 py-3 rounded-2xl border bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:ring-2 transition-all ${
                  passwordsMatch
                    ? 'border-green-500 focus:border-green-400 focus:ring-green-500/20'
                    : passwordsMismatch
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20'
                    : 'border-green-900/50 focus:border-green-500 focus:ring-green-500/20'
                }`}
                placeholder="Şifreyi tekrar girin"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordsMatch && (
              <p className="text-xs text-green-500 mt-1.5 px-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> {t('auth.passwordsMatch')}
              </p>
            )}
            {passwordsMismatch && (
              <p className="text-xs text-red-500 mt-1.5 px-1 flex items-center gap-1">
                <AlertCircle size={12} /> {t('auth.passwordsMismatch')}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3 px-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all focus:ring-4 focus:ring-green-500/20 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 mt-2"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('auth.registering')}</>
            ) : (
              <><UserPlus size={18} /> {t('auth.register')}</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {t('auth.haveAccount')}{' '}
          <a href="/login" className="text-green-500 hover:text-green-400 font-semibold transition-colors">
            {t('auth.login')}
          </a>
        </div>
      </div>
    </div>
  )
}
