import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, Loader2, Lock, Mail, Phone, User } from 'lucide-react'
import { clientRegister } from '../api/clientAuth'
import { getClientAccessToken, saveClientSession } from '../auth/clientSession'
import { registrationEnabled } from '../config/security'
import {
  AuthField,
  AuthLink,
  AuthShell,
  AuthSubmitButton,
  authInputClass,
} from '../components/AuthShell'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!registrationEnabled) {
    return <Navigate to="/login" replace />
  }

  if (getClientAccessToken()) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSubmitting(true)
    try {
      const session = await clientRegister({
        email,
        password,
        displayName,
        companyName,
        phone,
        taxId,
      })
      saveClientSession(session.accessToken, session.refreshToken)
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo completar el registro')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Cree su cuenta de portal cliente en AllCenter"
      footer={
        <span>
          ¿Ya tiene cuenta? <AuthLink to="/login">Iniciar sesión</AuthLink>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-200/70">
            Acceso
          </p>
          <AuthField label="Correo *" icon={Mail}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Contraseña * (8–128)" icon={Lock}>
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                className={`${authInputClass} pl-12`}
              />
            </AuthField>
            <AuthField label="Repetir contraseña *" icon={Lock}>
              <input
                type="password"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                className={`${authInputClass} pl-12`}
              />
            </AuthField>
          </div>
        </div>

        <div className="space-y-4 border-t border-amber-400/15 pt-5 dark:border-white/10">
          <p className="text-xs font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-200/70">
            Perfil
          </p>
          <AuthField label="Nombre para mostrar *" icon={User}>
            <input
              type="text"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={180}
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <AuthField label="Empresa" icon={Building2}>
            <input
              type="text"
              name="companyName"
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={180}
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Teléfono" icon={Phone}>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                className={`${authInputClass} pl-12`}
              />
            </AuthField>
            <AuthField label="Identificación fiscal">
              <input
                type="text"
                name="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                maxLength={40}
                className={authInputClass}
              />
            </AuthField>
          </div>
        </div>

        {error ? (
          <div
            className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm whitespace-pre-line text-red-600 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <AuthSubmitButton loading={submitting} loadingLabel="Creando cuenta...">
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Registrarse'
          )}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
