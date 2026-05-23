import type { Estado } from '../../types'

interface Config {
  bg: string
  text: string
  dot: string
}

const STATUS_CONFIG: Record<Estado, Config> = {
  Pendiente:    { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  'En Progreso':{ bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  Completado:   { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  Cancelado:    { bg: 'bg-cream-200',  text: 'text-navy-600',    dot: 'bg-navy-400' },
}

interface Props {
  estado: Estado
}

export function StatusBadge({ estado }: Props) {
  const c = STATUS_CONFIG[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {estado}
    </span>
  )
}
