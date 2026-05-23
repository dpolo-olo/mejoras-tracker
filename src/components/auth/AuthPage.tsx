import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type Mode = 'login' | 'register'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function reset() {
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    reset()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(translateError(error.message))
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      })
      if (error) setError(translateError(error.message))
      else setSuccess('Cuenta creada. Revisá tu correo para confirmarla antes de ingresar.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    reset()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    setGoogleLoading(false)
  }

  function switchMode(m: Mode) {
    setMode(m)
    reset()
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-navy-900 mb-4">
            <svg className="w-5 h-5 text-cream-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-navy-900 tracking-tight">Mejoras</h1>
          <p className="text-sm text-navy-600 mt-1">Control de calidad de documentos</p>
        </div>

        <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-navy-900 mb-5">
            {mode === 'login' ? 'Ingresar a tu cuenta' : 'Crear una cuenta nueva'}
          </h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-navy-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-lg text-navy-900 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-shadow"
                  placeholder="Tu nombre"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1.5">Correo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-lg text-navy-900 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-shadow"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-700 mb-1.5">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-lg text-navy-900 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-shadow"
                placeholder="Minimo 6 caracteres"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-navy-900 text-cream-50 text-sm font-medium rounded-lg hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-cream-300" />
            <span className="text-xs text-cream-500">o</span>
            <div className="flex-1 h-px bg-cream-300" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 bg-white border border-cream-300 text-navy-900 text-sm font-medium rounded-lg hover:bg-cream-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2.5"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Redirigiendo...' : 'Continuar con Google'}
          </button>
        </div>

        <p className="text-center text-xs text-navy-600 mt-4">
          {mode === 'login' ? 'No tenes cuenta?' : 'Ya tenes cuenta?'}{' '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-navy-900 hover:text-coral-500 transition-colors"
          >
            {mode === 'login' ? 'Registrarse' : 'Ingresar'}
          </button>
        </p>
      </div>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Correo o contrasena incorrectos.'
  if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de ingresar.'
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese correo.'
  if (msg.includes('Password should be')) return 'La contrasena debe tener al menos 6 caracteres.'
  return msg
}
