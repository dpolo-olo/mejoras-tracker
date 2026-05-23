import type { Mejora } from '../../types'

interface Props {
  mejora: Mejora
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteModal({ mejora, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-cream-50 border border-cream-300 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-sm font-semibold text-navy-900 mb-1.5">Eliminar registro</h3>
        <p className="text-xs text-navy-600 mb-2">Esta accion es permanente y no se puede deshacer.</p>
        <p className="text-xs font-medium text-navy-900 bg-cream-100 rounded-lg px-3 py-2 mb-5 line-clamp-2 border border-cream-300">
          {mejora.titulo}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-navy-700 border border-cream-300 rounded-lg hover:bg-cream-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
