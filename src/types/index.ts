export type Estado = 'Pendiente' | 'En Progreso' | 'Completado' | 'Cancelado'

export interface Mejora {
  id: string
  user_id: string
  titulo: string
  usuario: string
  responsable: string
  estado: Estado
  nota: string
  imagen_url: string | null
  fecha: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  api_key: string | null
}
