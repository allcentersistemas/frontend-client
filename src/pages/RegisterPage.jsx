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
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setSubmitting(true)
    try {
      const session = await clientRegister({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
        taxId: taxId.trim() || undefined,
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
      subtitle="Registro en el portal cliente de AllCenter"
      footer={
        <span>
          ¿Ya tiene cuenta? <AuthLink to="/login">Iniciar sesión</AuthLink>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-200/70">
            Acceso
          </p>
          <AuthField label="Correo *" icon={Mail}>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Contraseña *" icon={Lock}>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
                className={`${authInputClass} pl-12`}
              />
            </AuthField>
          </div>
        </div>

        <div className="space-y-4 border-t border-amber-400/15 pt-5 dark:border-white/10">
          <p className="text-xs font-semibold tracking-wider text-amber-800/80 uppercase dark:text-amber-200/70">
            Perfil (opcional)
          </p>
          <AuthField label="Nombre para mostrar" icon={User}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <AuthField label="Empresa" icon={Building2}>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Teléfono" icon={Phone}>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${authInputClass} pl-12`}
              />
            </AuthField>
            <AuthField label="Identificación fiscal">
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={authInputClass}
              />
            </AuthField>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
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
