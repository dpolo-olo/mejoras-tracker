import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'

interface Props {
  profile: Profile
}

export function Header({ profile }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = profile.full_name?.trim() || profile.email.split('@')[0]
  const initial = displayName.charAt(0).toUpperCase()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className="bg-cream-50 border-b border-cream-300 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-navy-900 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-cream-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <span className="font-semibold text-navy-900 tracking-tight text-sm">Mejoras</span>
          </div>
          <span className="w-px h-4 bg-cream-300 hidden sm:block" />
          <span className="text-xs text-navy-600 hidden sm:block">Control de calidad</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-lg hover:bg-cream-200 transition-colors"
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-navy-900 leading-none">{displayName}</p>
              <p className="text-[10px] text-navy-600 mt-0.5 leading-none">{profile.email}</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-navy-900 flex items-center justify-center text-cream-50 text-xs font-semibold flex-shrink-0">
              {initial}
            </div>
            <svg
              className={`w-3.5 h-3.5 text-navy-600 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-cream-50 border border-cream-300 rounded-xl shadow-lg py-1 z-30">
              <div className="px-3 py-2.5 border-b border-cream-200">
                <p className="text-xs font-medium text-navy-900 truncate">{displayName}</p>
                <p className="text-[10px] text-navy-600 truncate mt-0.5">{profile.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
