import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from './StatusBadge'
import { ImageModal } from './ImageModal'
import { DeleteModal } from './DeleteModal'
import type { Mejora, Estado } from '../../types'

const ESTADOS: Estado[] = ['Pendiente', 'En Progreso', 'Completado', 'Cancelado']
const ALL_FILTERS = ['Todos', ...ESTADOS] as const
type Filter = (typeof ALL_FILTERS)[number]

interface EditingCell {
  id: string
  field: 'usuario' | 'responsable' | 'nota' | 'estado'
}

interface Props {
  mejoras: Mejora[]
  onUpdate: () => void
}

export function MejorasTable({ mejoras, onUpdate }: Props) {
  const [filter, setFilter] = useState<Filter>('Todos')
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Mejora | null>(null)
  const [editing, setEditing] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = filter === 'Todos' ? mejoras : mejoras.filter(m => m.estado === filter)

  const counts: Record<Filter, number> = {
    Todos: mejoras.length,
    Pendiente: mejoras.filter(m => m.estado === 'Pendiente').length,
    'En Progreso': mejoras.filter(m => m.estado === 'En Progreso').length,
    Completado: mejoras.filter(m => m.estado === 'Completado').length,
    Cancelado: mejoras.filter(m => m.estado === 'Cancelado').length,
  }

  function startEdit(id: string, field: EditingCell['field'], value: string) {
    setEditing({ id, field })
    setEditValue(value)
  }

  async function commitEdit() {
    if (!editing) return
    await supabase
      .from('mejoras')
      .update({ [editing.field]: editValue })
      .eq('id', editing.id)
    setEditing(null)
    onUpdate()
  }

  function cancelEdit() {
    setEditing(null)
    setEditValue('')
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  async function handleDelete(mejora: Mejora) {
    if (mejora.imagen_url) {
      try {
        const url = new URL(mejora.imagen_url)
        const match = url.pathname.match(/\/storage\/v1\/object\/public\/mejoras-images\/(.+)/)
        if (match) {
          await supabase.storage.from('mejoras-images').remove([match[1]])
        }
      } catch {
        // continue with deletion even if storage cleanup fails
      }
    }
    await supabase.from('mejoras').delete().eq('id', mejora.id)
    setDeleteTarget(null)
    onUpdate()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (mejoras.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <p className="text-sm text-navy-600">Aun no hay mejoras registradas</p>
        <p className="text-xs text-cream-500 mt-1">Sube una imagen arriba para comenzar</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {ALL_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
              filter === f
                ? 'bg-navy-900 text-cream-50'
                : 'bg-cream-200 text-navy-600 hover:bg-cream-300'
            }`}
          >
            {f}
            <span
              className={`text-[10px] px-1.5 py-px rounded-full font-semibold ${
                filter === f ? 'bg-navy-700 text-cream-200' : 'bg-cream-300 text-navy-600'
              }`}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      <div className="border border-cream-300 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cream-300">
            <thead>
              <tr className="bg-cream-100">
                {['Imagen', 'Error detectado', 'Usuario', 'Fecha', 'Estado', 'Responsable', 'Nota', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold text-navy-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-cream-50 divide-y divide-cream-200">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-cream-100 transition-colors">

                  <td className="px-4 py-3">
                    {m.imagen_url ? (
                      <button
                        onClick={() => setPreviewSrc(m.imagen_url)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-cream-300 hover:border-navy-900 transition-colors block"
                      >
                        <img src={m.imagen_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-cream-200 border border-cream-300" />
                    )}
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-navy-900 leading-snug line-clamp-2">{m.titulo}</p>
                  </td>

                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => !editing && startEdit(m.id, 'usuario', m.usuario)}
                  >
                    {editing?.id === m.id && editing.field === 'usuario' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={onKeyDown}
                        className="w-full min-w-[100px] px-2 py-1 text-xs border border-navy-900 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs text-navy-700 block min-w-[80px] min-h-[18px] group-hover:text-navy-900">
                        {m.usuario || <span className="text-cream-400">—</span>}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-navy-600">{formatDate(m.fecha)}</span>
                  </td>

                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => !editing && startEdit(m.id, 'estado', m.estado)}
                  >
                    {editing?.id === m.id && editing.field === 'estado' ? (
                      <select
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        className="text-xs border border-navy-900 rounded px-2 py-1 focus:outline-none bg-white"
                      >
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    ) : (
                      <StatusBadge estado={m.estado as Estado} />
                    )}
                  </td>

                  <td
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => !editing && startEdit(m.id, 'responsable', m.responsable)}
                  >
                    {editing?.id === m.id && editing.field === 'responsable' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={onKeyDown}
                        className="w-full min-w-[100px] px-2 py-1 text-xs border border-navy-900 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs text-navy-700 block min-w-[80px] min-h-[18px]">
                        {m.responsable || <span className="text-cream-400">—</span>}
                      </span>
                    )}
                  </td>

                  <td
                    className="px-4 py-3 max-w-[180px] cursor-pointer"
                    onClick={() => !editing && startEdit(m.id, 'nota', m.nota)}
                  >
                    {editing?.id === m.id && editing.field === 'nota' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={onKeyDown}
                        className="w-full min-w-[120px] px-2 py-1 text-xs border border-navy-900 rounded focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs text-navy-600 block min-h-[18px] line-clamp-1">
                        {m.nota || <span className="text-cream-400">—</span>}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="text-[11px] text-cream-500 hover:text-red-600 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewSrc && (
        <ImageModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
      )}
      {deleteTarget && (
        <DeleteModal
          mejora={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget!)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
