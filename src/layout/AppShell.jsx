import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clientFetchMe, clientLogout, clientRefreshSession } from '../api/clientAuth'
import {
  clearClientSession,
  getClientAccessToken,
  getClientRefreshToken,
  saveClientSession,
} from '../auth/clientSession'
import { ThemeToggle } from '../components/ThemeToggle'
import { cn } from '../lib/cn'
import { formatAppDateTime } from '../utils/appDateTime'
import logo from '../assets/allpanel.png'

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const isPlanillaRoute = useMemo(
    () => location.pathname.startsWith('/app/planilla-corte'),
    [location.pathname],
  )

  const refreshUser = useCallback(async (accessToken) => {
    const me = await clientFetchMe(accessToken)
    setUser(me)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const access = getClientAccessToken()
      const refresh = getClientRefreshToken()
      if (!access) {
        if (!cancelled) {
          setBooting(false)
          navigate('/login', { replace: true, state: { from: location } })
        }
        return
      }
      try {
        await refreshUser(access)
      } catch {
        if (!refresh) {
          clearClientSession()
          if (!cancelled) navigate('/login', { replace: true })
          return
        }
        try {
          const session = await clientRefreshSession(refresh)
          saveClientSession(session.accessToken, session.refreshToken)
          await refreshUser(session.accessToken)
        } catch {
          clearClientSession()
          if (!cancelled) navigate('/login', { replace: true })
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, refreshUser, location])

  function handleLogout() {
    const refresh = getClientRefreshToken()
    if (refresh) {
      clientLogout(refresh).catch(() => {})
    }
    clearClientSession()
    setUser(null)
    navigate('/login', { replace: true })
  }

  if (booting) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" aria-hidden />
        <p className="text-sm">Validando sesión…</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative min-h-svh lg:grid lg:min-h-screen lg:grid-cols-[280px_1fr]',
        menuOpen && 'max-lg:overflow-hidden',
      )}
    >
      <div className="pointer-events-none fixed inset-0 -z-10 bg-slate-100 dark:bg-slate-950" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_60%_at_0%_-10%,rgba(251,191,36,0.18),transparent_50%),radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(245,158,11,0.1),transparent_45%),linear-gradient(180deg,rgb(248,250,252)_0%,rgb(241,245,249)_100%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_0%_-10%,rgba(251,191,36,0.12),transparent_50%),radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(245,158,11,0.08),transparent_45%),linear-gradient(180deg,rgb(15,23,42)_0%,rgb(2,6,23)_100%)]"
        aria-hidden
      />

      <header className="fixed inset-x-0 top-0 z-40 flex min-h-14 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-950/80 lg:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? 'Cerrar' : 'Menú'}
        </button>
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">Portal cliente</p>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(88vw,300px)] flex-col border-r border-slate-200/80 bg-white/90 px-4 py-6 shadow-xl backdrop-blur-2xl transition-transform max-lg:pt-[4.5rem] dark:border-white/[0.08] dark:bg-slate-950/70 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          menuOpen ? 'translate-x-0' : 'max-lg:-translate-x-full',
        )}
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-200 to-amber-400 dark:from-yellow-300 dark:to-amber-500">
            <img src={logo} alt="AllCenter" className="h-9 w-9 object-contain" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">AllPanel</p>
            <p className="truncate text-xs text-slate-500">Portal cliente</p>
          </div>
        </div>

        {user ? (
          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-black/20">
            <p className="text-[0.65rem] font-bold tracking-wider text-slate-500 uppercase">Sesión</p>
            <p className="truncate text-sm text-slate-800 dark:text-slate-200" title={user.email}>
              {user.email}
            </p>
            {user.lastLoginAt ? (
              <p className="mt-1 truncate text-[0.7rem] text-slate-500" title={user.lastLoginIp || ''}>
                Último acceso: {formatAppDateTime(user.lastLoginAt)}
              </p>
            ) : null}
          </div>
        ) : null}

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          <NavLink
            to="/app"
            end
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-amber-400/25 to-amber-600/15 text-amber-900 ring-1 ring-amber-400/30 dark:text-amber-50'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
              )
            }
          >
            Inicio
          </NavLink>

          <p className="mt-4 px-3 text-[0.65rem] font-bold tracking-wider text-slate-500 uppercase">
            Optimizaciones
          </p>
          <NavLink
            to="/app/proyectos"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-amber-400/25 to-amber-600/15 text-amber-900 ring-1 ring-amber-400/30 dark:text-amber-50'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
              )
            }
          >
            Mis proyectos
          </NavLink>
          <NavLink
            to="/app/planilla-corte"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive || isPlanillaRoute
                  ? 'bg-gradient-to-r from-amber-400/25 to-amber-600/15 text-amber-900 ring-1 ring-amber-400/30 dark:text-amber-50'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
              )
            }
          >
            Planilla de corte
          </NavLink>

          <p className="mt-4 px-3 text-[0.65rem] font-bold tracking-wider text-slate-500 uppercase">
            Cuenta
          </p>
          <NavLink
            to="/app/cuenta"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-gradient-to-r from-amber-400/25 to-amber-600/15 text-amber-900 ring-1 ring-amber-400/30 dark:text-amber-50'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
              )
            }
          >
            Mi cuenta
          </NavLink>
        </nav>

        <div className="mt-auto space-y-3 border-t border-slate-200/80 pt-4 dark:border-white/[0.08]">
          <div className="flex justify-center">
            <ThemeToggle size="sm" />
          </div>
          <button
            type="button"
            className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-amber-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-amber-400/5"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 pt-[3.75rem] lg:col-start-2 lg:pt-0">
        <div className={cn('app-shell-page', isPlanillaRoute && 'app-shell-page--focus')}>
          <Outlet context={{ user, refreshUser }} />
        </div>
      </main>
    </div>
  )
}
