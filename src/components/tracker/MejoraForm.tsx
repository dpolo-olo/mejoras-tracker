import { useState } from 'react'
import type { Estado, Profile } from '../../types'

const ESTADOS: Estado[] = ['Pendiente', 'En Progreso', 'Completado', 'Cancelado']

interface FormData {
  estado: Estado
  responsable: string
  nota: string
}

interface Props {
  titulo: string
  imagePreview: string
  initialData?: Partial<FormData>
  onSave: (data: FormData) => void
  onCancel: () => void
  saving?: boolean
  editMode?: boolean
  profiles: Profile[]
}

export function MejoraForm({
  titulo,
  imagePreview,
  initialData,
  onSave,
  onCancel,
  saving,
  editMode,
  profiles,
}: Props) {
  const [estado, setEstado] = useState<Estado>(initialData?.estado ?? 'Pendiente')
  const [responsable, setResponsable] = useState(initialData?.responsable ?? '')
  const [nota, setNota] = useState(initialData?.nota ?? '')

  const matchedProfile = profiles.find(
    p => p.email.toLowerCase() === responsable.trim().toLowerCase()
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ estado, responsable, nota })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-4 p-4 bg-cream-100 rounded-xl border border-cream-300">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Imagen analizada"
            className="w-16 h-16 object-cover rounded-lg border border-cream-300 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-navy-500 uppercase tracking-widest mb-1">
            Error detectado por Claude
          </p>
          <p className="text-sm font-medium text-navy-900 leading-snug">{titulo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-navy-700 mb-1.5">Estado</label>
          <select
            value={estado}
            onChange={e => setEstado(e.target.value as Estado)}
            className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-lg text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
          >
            {ESTADOS.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-navy-700 mb-1.5">Responsable</label>
          <input
            type="email"
            value={responsable}
            onChange={e => setResponsable(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-lg text-navy-900 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            placeholder="correo@empresa.com"
          />
          {matchedProfile && (
            <p className="text-[11px] text-navy-600 mt-1 pl-0.5">
              {matchedProfile.full_name || matchedProfile.email}
            </p>
          )}
          {responsable.includes('@') && !matchedProfile && (
            <p className="text-[11px] text-cream-500 mt-1 pl-0.5">Usuario no encontrado</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-navy-700 mb-1.5">Nota</label>
          <input
            type="text"
            value={nota}
            onChange={e => setNota(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-lg text-navy-900 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent"
            placeholder="Observaciones"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-navy-700 border border-cream-300 rounded-lg hover:bg-cream-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-xs font-medium text-cream-50 bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : editMode ? 'Guardar cambios' : 'Registrar mejora'}
        </button>
      </div>
    </form>
  )
}
