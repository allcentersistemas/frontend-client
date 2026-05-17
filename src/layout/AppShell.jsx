import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clientFetchMe, clientLogout, clientRefreshSession } from '../api/clientAuth'
import {
  clearClientSession,
  getClientAccessToken,
  getClientRefreshToken,
  saveClientSession,
} from '../auth/clientSession'
import '../App.css'
import './AppShell.css'

export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState(null)

  const isOptActive = useMemo(
    () => location.pathname.startsWith('/app/optimizaciones'),
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
      <div className="shell app-boot">
        <p className="muted">Validando sesión…</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="sidebar-brand">Allcenter</div>
        {user ? (
          <div className="sidebar-user">
            <span className="sidebar-user-label">Sesión</span>
            <span className="sidebar-user-email" title={user.email}>
              {user.email}
            </span>
          </div>
        ) : null}
        <nav className="sidebar-nav">
          <NavLink
            to="/app"
            end
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Inicio
          </NavLink>

          <div className={`sidebar-group ${isOptActive ? 'sidebar-group-open' : ''}`}>
            <div className="sidebar-group-label">Optimizaciones</div>
            <ul className="sidebar-submenu">
              <li>
                <NavLink
                  to="/app/planilla-corte"
                  className={({ isActive }) =>
                    isActive ? 'sidebar-link active' : 'sidebar-link'
                  }
                >
                  Planilla de corte
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
        <button type="button" className="btn secondary sidebar-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>
      <div className="app-shell-main">
        <Outlet context={{ user, refreshUser }} />
      </div>
    </div>
  )
}
