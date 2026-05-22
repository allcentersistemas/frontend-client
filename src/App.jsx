import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { registrationEnabled } from './config/security'
import RequireAuth from './components/RequireAuth.jsx'
import AppShell from './layout/AppShell.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RootRedirect from './pages/RootRedirect.jsx'
import Inicio from './pages/app/Inicio.jsx'
import PlanillaCortePage from './pages/app/PlanillaCortePage.jsx'

/** Despliegue en raíz (/) vs subruta (/portal/). */
const atRoot = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') === ''

function PortalLegacyRedirect() {
  const { pathname, search, hash } = useLocation()
  const target = pathname.replace(/^\/portal/, '') || '/'
  return <Navigate to={`${target}${search}${hash}`} replace />
}

export default function App() {
  return (
    <div className="app-layout-root min-h-svh w-full">
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      {atRoot ? (
        <>
          <Route path="/portal" element={<Navigate to="/" replace />} />
          <Route path="/portal/*" element={<PortalLegacyRedirect />} />
        </>
      ) : null}
      <Route
        path="/registro"
        element={
          registrationEnabled ? <RegisterPage /> : <Navigate to="/login" replace />
        }
      />
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Inicio />} />
          <Route path="planilla-corte" element={<PlanillaCortePage />} />
        </Route>
      </Route>
    </Routes>
    </div>
  )
}
