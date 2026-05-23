import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { verifyApiKey } from '../../lib/claude'
import type { Profile } from '../../types'

interface Props {
  profile: Profile
  onSaved: () => void
  onCancel?: () => void
  isModal?: boolean
}

type VerifyStatus = 'idle' | 'verifying' | 'valid' | 'invalid'

export function ApiKeySetup({ profile, onSaved, onCancel, isModal = false }: Props) {
  const [apiKey, setApiKey] = useState(profile.api_key ?? '')
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify() {
    if (!apiKey.trim()) return
    setVerifyStatus('verifying')
    setError(null)
    const valid = await verifyApiKey(apiKey.trim())
    if (valid) {
      setVerifyStatus('valid')
    } else {
      setVerifyStatus('invalid')
      setError('La API key no es valida o no tiene permisos suficientes.')
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ api_key: apiKey.trim() })
      .eq('id', profile.id)
    if (dbErr) {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    } else {
      onSaved()
    }
  }

  const canSave = verifyStatus === 'valid' && !saving
  const canVerify = apiKey.trim().length > 10 && verifyStatus !== 'verifying'

  const content = (
    <div className={isModal ? '' : 'w-full max-w-md'}>
      <div className={`bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-sm ${isModal ? '' : ''}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">
              {profile.api_key ? 'Actualizar API key de Claude' : 'Configurar API key de Claude'}
            </h2>
            <p className="text-xs text-navy-600 mt-1 leading-relaxed">
              Necesitas tu propia API key de Anthropic para el analisis de imagenes.
              Se guarda de forma segura en tu perfil.
            </p>
          </div>
          {isModal && onCancel && (
            <button
              onClick={onCancel}
              className="ml-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream-200 text-navy-500 hover:text-navy-900 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {verifyStatus === 'valid' && (
          <div className="mb-4 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
            API key verificada correctamente.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1.5">
              API Key de Anthropic
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => {
                setApiKey(e.target.value)
                setVerifyStatus('idle')
                setError(null)
              }}
              className="w-full px-3 py-2 text-sm font-mono bg-white border border-cream-300 rounded-lg text-navy-900 placeholder:text-cream-500 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-shadow"
              placeholder="sk-ant-api..."
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={!canVerify}
              className="flex-1 py-2 px-3 border border-cream-300 text-navy-900 text-xs font-medium rounded-lg hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {verifyStatus === 'verifying' ? 'Verificando...' : 'Verificar key'}
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 py-2 px-3 bg-navy-900 text-cream-50 text-xs font-medium rounded-lg hover:bg-navy-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-navy-600 mt-4">
          Obtene tu API key en{' '}
          <span className="font-mono font-medium text-navy-900">console.anthropic.com</span>
        </p>

        {!isModal && onCancel && (
          <button
            onClick={onCancel}
            className="mt-3 w-full py-2 text-xs text-navy-600 hover:text-navy-900 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={onCancel} />
        <div className="relative w-full max-w-md">{content}</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-cream-100 flex items-center justify-center p-4">
      {content}
    </div>
  )
}
