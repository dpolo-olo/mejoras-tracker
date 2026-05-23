import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { analyzeImage } from '../lib/claude'
import { UploadZone } from '../components/tracker/UploadZone'
import { MejoraForm } from '../components/tracker/MejoraForm'
import { MejorasTable } from '../components/tracker/MejorasTable'
import type { Mejora, Estado } from '../types'

type Step = 'idle' | 'analyzing' | 'form' | 'saving'

interface FormData {
  estado: Estado
  usuario: string
  responsable: string
  nota: string
}

interface Props {
  apiKey: string
  userId: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function fileToPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function TrackerPage({ apiKey, userId }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [mejoras, setMejoras] = useState<Mejora[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [titulo, setTitulo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadMejoras = useCallback(async () => {
    const { data } = await supabase
      .from('mejoras')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setMejoras(data ?? [])
    setLoadingData(false)
  }, [userId])

  useEffect(() => {
    loadMejoras()
  }, [loadMejoras])

  async function handleImageSelected(file: File) {
    setSelectedFile(file)
    setError(null)

    const [preview, base64] = await Promise.all([fileToPreview(file), fileToBase64(file)])
    setImagePreview(preview)
    setStep('analyzing')

    try {
      const result = await analyzeImage(apiKey, base64, file.type)
      setTitulo(result)
      setStep('form')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar la imagen con Claude.')
      setStep('idle')
    }
  }

  async function handleSave(data: FormData) {
    if (!selectedFile) return
    setStep('saving')
    setError(null)

    try {
      const ext = selectedFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('mejoras-images')
        .upload(path, selectedFile, { contentType: selectedFile.type })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('mejoras-images')
        .getPublicUrl(path)

      const { error: dbErr } = await supabase.from('mejoras').insert({
        user_id: userId,
        titulo,
        usuario: data.usuario,
        responsable: data.responsable,
        estado: data.estado,
        nota: data.nota,
        imagen_url: publicUrl,
        fecha: new Date().toISOString(),
      })

      if (dbErr) throw dbErr

      reset()
      loadMejoras()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la mejora.')
      setStep('form')
    }
  }

  function reset() {
    setStep('idle')
    setSelectedFile(null)
    setImagePreview('')
    setTitulo('')
    setError(null)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Nueva mejora</h2>
            <p className="text-xs text-navy-600 mt-0.5">Sube una imagen para que Claude detecte errores automaticamente</p>
          </div>
          {step !== 'idle' && (
            <button
              onClick={reset}
              className="text-xs text-navy-600 hover:text-navy-900 border border-cream-300 px-3 py-1.5 rounded-lg hover:bg-cream-100 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {step === 'idle' && (
          <UploadZone onImageSelected={handleImageSelected} />
        )}

        {step === 'analyzing' && (
          <div className="border border-cream-300 rounded-xl p-12 text-center bg-cream-100">
            <div className="w-8 h-8 border-2 border-cream-400 border-t-navy-900 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-navy-900">Analizando imagen...</p>
            <p className="text-xs text-navy-600 mt-1">Claude esta detectando errores en el documento</p>
          </div>
        )}

        {(step === 'form' || step === 'saving') && (
          <MejoraForm
            titulo={titulo}
            imagePreview={imagePreview}
            onSave={handleSave}
            onCancel={reset}
            saving={step === 'saving'}
          />
        )}
      </div>

      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Registro de mejoras</h2>
            <p className="text-xs text-navy-600 mt-0.5">
              {loadingData ? 'Cargando...' : `${mejoras.length} ${mejoras.length === 1 ? 'registro' : 'registros'} en total`}
            </p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-cream-400 border-t-navy-900 rounded-full animate-spin" />
          </div>
        ) : (
          <MejorasTable mejoras={mejoras} onUpdate={loadMejoras} />
        )}
      </div>
    </main>
  )
}
