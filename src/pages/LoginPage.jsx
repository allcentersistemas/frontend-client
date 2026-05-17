import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { clientLogin } from '../api/clientAuth'
import { getClientAccessToken, saveClientSession } from '../auth/clientSession'
import { prefillDemoLogin, registrationEnabled } from '../config/security'
import '../App.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/app'

  const [email, setEmail] = useState(prefillDemoLogin ? 'cliente@demo.allcenter.local' : '')
  const [password, setPassword] = useState(prefillDemoLogin ? 'cliente123' : '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (getClientAccessToken()) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await clientLogin(email.trim(), password)
      saveClientSession(session.accessToken, session.refreshToken)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="shell login login-full">
      <div className="card login-card">
        <h1 className="page-title">Iniciar sesión</h1>
        <p className="muted subtitle">
          Acceso con cuenta de portal cliente (module-system).
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Correo</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
          {registrationEnabled ? (
            <Link to="/registro" className="btn secondary">
              Registrate
            </Link>
          ) : null}
        </form>
        {prefillDemoLogin ? (
          <p className="hint">
            Demo (solo desarrollo): <code>cliente@demo.allcenter.local</code> /{' '}
            <code>cliente123</code>
          </p>
        ) : null}
        {registrationEnabled ? (
          <p className="hint">
            ¿No tiene cuenta? <Link to="/registro">Registrarse</Link>
          </p>
        ) : null}
      </div>
    </div>
  )
}
