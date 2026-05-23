import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AuthPage } from './components/auth/AuthPage'
import { Header } from './components/layout/Header'
import { TrackerPage } from './pages/TrackerPage'
import type { Profile } from './types'

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string, userEmail: string, userMeta: Record<string, string>) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const avatarUrl = userMeta?.avatar_url ?? userMeta?.picture ?? null

    if (data) {
      setProfile({ ...(data as Profile), avatar_url: avatarUrl })
    } else {
      const newProfile: Profile = {
        id: userId,
        email: userEmail,
        full_name:
          userMeta?.full_name ??
          userMeta?.name ??
          userEmail.split('@')[0],
        api_key: null,
        avatar_url: avatarUrl,
      }
      await supabase.from('profiles').upsert(newProfile)
      setProfile(newProfile)
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id, u.email ?? '', u.user_metadata as Record<string, string>)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u.id, u.email ?? '', u.user_metadata as Record<string, string>)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cream-400 border-t-navy-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthPage />
  }

  return (
    <>
      <Header profile={profile} />
      <TrackerPage apiKey={CLAUDE_API_KEY} userId={user.id} />
    </>
  )
}
