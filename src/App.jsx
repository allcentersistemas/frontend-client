import { Navigate, Route, Routes } from 'react-router-dom'
import { registrationEnabled } from './config/security'
import RequireAuth from './components/RequireAuth.jsx'
import AppShell from './layout/AppShell.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import RootRedirect from './pages/RootRedirect.jsx'
import Inicio from './pages/app/Inicio.jsx'
import PlanillaCortePage from './pages/app/PlanillaCortePage.jsx'
export default function App() {
  return (
    <div className="app-layout-root min-h-svh w-full">
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
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
