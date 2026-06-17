import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock, User } from 'lucide-react'
import { clientLogin } from '../api/clientAuth'
import { getClientAccessToken, saveClientSession } from '../auth/clientSession'
import { prefillDemoLogin, registrationEnabled } from '../config/security'
import {
  AuthField,
  AuthLink,
  AuthShell,
  AuthSubmitButton,
  authInputClass,
} from '../components/AuthShell'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/app'

  const [login, setLogin] = useState(prefillDemoLogin ? 'cliente@demo.allcenter.local' : '')
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
      const session = await clientLogin(login.trim(), password)
      saveClientSession(session.accessToken, session.refreshToken)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Portal cliente"
      subtitle="Accede con tu cuenta"
      footer={
        registrationEnabled ? (
          <span>
            ¿No tiene cuenta? <AuthLink to="/registro">Crear cuenta</AuthLink>
          </span>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthField label="Correo o usuario" icon={User}>
          <input
            type="text"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            className={`${authInputClass} pl-12`}
          />
        </AuthField>

        <AuthField label="Contraseña" icon={Lock}>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className={`${authInputClass} pl-12`}
          />
        </AuthField>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <AuthSubmitButton loading={submitting} loadingLabel="Entrando...">
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </AuthSubmitButton>
      </form>

      {prefillDemoLogin ? (
        <p className="hint mt-6 text-center">
          Demo: <code className="code-inline">cliente@demo.allcenter.local</code> /{' '}
          <code className="code-inline">cliente123</code>
        </p>
      ) : null}
    </AuthShell>
  )
}
