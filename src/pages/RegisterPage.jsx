import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Building2,
  FileText,
  Hash,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserCircle,
} from 'lucide-react'
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

const TIPOS_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carné de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
]

const emptyProfile = () => ({
  juridica: false,
  displayName: '',
  phone: '',
  tipoDocumento: 'DNI',
  numeroDocumento: '',
  direccion: '',
  ciudad: '',
  distrito: '',
  departamento: '',
  razonSocial: '',
  ruc: '',
  nombre: '',
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [profile, setProfile] = useState(emptyProfile)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!registrationEnabled) {
    return <Navigate to="/login" replace />
  }

  if (getClientAccessToken()) {
    return <Navigate to="/app" replace />
  }

  function setProfileField(key, value) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function goToStep2(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('El correo es obligatorio')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Introduzca un correo válido')
      return
    }
    const u = username.trim().toLowerCase()
    if (u.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres')
      return
    }
    if (!/^[a-z0-9._-]+$/.test(u)) {
      setError('El usuario solo puede contener letras, números, punto, guion y guion bajo')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await clientRegister({
        email: email.trim(),
        username: username.trim(),
        password,
        juridica: profile.juridica,
        displayName: profile.displayName,
        phone: profile.phone,
        tipoDocumento: profile.tipoDocumento,
        numeroDocumento: profile.numeroDocumento,
        direccion: profile.direccion,
        ciudad: profile.ciudad,
        distrito: profile.distrito,
        departamento: profile.departamento,
        razonSocial: profile.razonSocial,
        ruc: profile.ruc,
        nombre: profile.nombre,
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
      wide
      title="Crear cuenta"
      subtitle={
        step === 1
          ? 'Paso 1 de 2 — datos de acceso'
          : 'Paso 2 de 2 — datos de persona natural o jurídica'
      }
      footer={
        <span>
          ¿Ya tiene cuenta? <AuthLink to="/login">Iniciar sesión</AuthLink>
        </span>
      }
    >
      <div className="mb-6 flex gap-2">
        <div
          className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-amber-400/20 dark:bg-white/10'}`}
          aria-hidden
        />
        <div
          className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-amber-400/20 dark:bg-white/10'}`}
          aria-hidden
        />
      </div>

      {step === 1 ? (
        <form onSubmit={goToStep2} className="space-y-5" noValidate>
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
          <AuthField label="Usuario *" icon={User}>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={64}
              pattern="[a-zA-Z0-9._-]+"
              className={`${authInputClass} pl-12`}
            />
          </AuthField>
          <p className="text-xs text-slate-500 dark:text-yellow-200/50">
            Letras, números, punto, guion y guion bajo. Podrá iniciar sesión con correo o usuario.
          </p>
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

          {error ? <ErrorBox message={error} /> : null}

          <AuthSubmitButton loading={false}>Continuar</AuthSubmitButton>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="rounded-xl border border-amber-400/20 bg-amber-50/50 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="mb-3 text-sm font-medium text-amber-900 dark:text-amber-100">Tipo de persona</p>
            <div className="grid grid-cols-2 gap-2">
              <PersonTypeButton
                active={!profile.juridica}
                label="Persona natural"
                onClick={() => setProfileField('juridica', false)}
              />
              <PersonTypeButton
                active={profile.juridica}
                label="Persona jurídica"
                onClick={() => setProfileField('juridica', true)}
              />
            </div>
          </div>

          {profile.juridica ? (
            <JuridicaFields profile={profile} setProfileField={setProfileField} />
          ) : (
            <NaturalFields profile={profile} setProfileField={setProfileField} />
          )}

          {error ? <ErrorBox message={error} /> : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-xl border border-amber-400/25 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-50 dark:border-white/10 dark:text-amber-100 dark:hover:bg-white/5"
              disabled={submitting}
              onClick={() => {
                setError('')
                setStep(1)
              }}
            >
              Volver
            </button>
            <div className="flex-[2]">
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
            </div>
          </div>
        </form>
      )}
    </AuthShell>
  )
}

function PersonTypeButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-md'
          : 'border border-amber-400/20 bg-white/80 text-slate-700 hover:bg-amber-50 dark:border-white/10 dark:bg-black/20 dark:text-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function NaturalFields({ profile, setProfileField }) {
  return (
    <div className="space-y-4">
      <AuthField label="Nombre completo *" icon={UserCircle}>
        <input
          type="text"
          value={profile.displayName}
          onChange={(e) => setProfileField('displayName', e.target.value)}
          required
          maxLength={180}
          className={`${authInputClass} pl-12`}
        />
      </AuthField>
      <AuthField label="Teléfono *" icon={Phone}>
        <input
          type="tel"
          value={profile.phone}
          onChange={(e) => setProfileField('phone', e.target.value)}
          required
          maxLength={40}
          className={`${authInputClass} pl-12`}
        />
      </AuthField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField label="Tipo de documento *" icon={FileText}>
          <select
            value={profile.tipoDocumento}
            onChange={(e) => setProfileField('tipoDocumento', e.target.value)}
            required
            className={authInputClass}
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </AuthField>
        <AuthField label="Número de documento *" icon={Hash}>
          <input
            type="text"
            value={profile.numeroDocumento}
            onChange={(e) => setProfileField('numeroDocumento', e.target.value)}
            required
            maxLength={40}
            className={`${authInputClass} pl-12`}
          />
        </AuthField>
      </div>
      <AddressFields profile={profile} setProfileField={setProfileField} />
    </div>
  )
}

function JuridicaFields({ profile, setProfileField }) {
  return (
    <div className="space-y-4">
      <AuthField label="Razón social *" icon={Building2}>
        <input
          type="text"
          value={profile.razonSocial}
          onChange={(e) => setProfileField('razonSocial', e.target.value)}
          required
          maxLength={180}
          className={`${authInputClass} pl-12`}
        />
      </AuthField>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField label="RUC *" icon={Hash}>
          <input
            type="text"
            inputMode="numeric"
            value={profile.ruc}
            onChange={(e) => setProfileField('ruc', e.target.value)}
            required
            maxLength={20}
            className={`${authInputClass} pl-12`}
          />
        </AuthField>
        <AuthField label="Nombre *" icon={User}>
          <input
            type="text"
            value={profile.nombre}
            onChange={(e) => setProfileField('nombre', e.target.value)}
            required
            maxLength={180}
            className={`${authInputClass} pl-12`}
          />
        </AuthField>
      </div>
      <AuthField label="Teléfono" icon={Phone}>
        <input
          type="tel"
          value={profile.phone}
          onChange={(e) => setProfileField('phone', e.target.value)}
          maxLength={40}
          className={`${authInputClass} pl-12`}
        />
      </AuthField>
      <AddressFields profile={profile} setProfileField={setProfileField} />
    </div>
  )
}

function AddressFields({ profile, setProfileField }) {
  return (
    <>
      <AuthField label="Dirección *" icon={MapPin}>
        <input
          type="text"
          value={profile.direccion}
          onChange={(e) => setProfileField('direccion', e.target.value)}
          required
          maxLength={200}
          className={`${authInputClass} pl-12`}
        />
      </AuthField>
      <div className="grid gap-4 sm:grid-cols-3">
        <AuthField label="Ciudad *">
          <input
            type="text"
            value={profile.ciudad}
            onChange={(e) => setProfileField('ciudad', e.target.value)}
            required
            maxLength={120}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Distrito *">
          <input
            type="text"
            value={profile.distrito}
            onChange={(e) => setProfileField('distrito', e.target.value)}
            required
            maxLength={120}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Departamento *">
          <input
            type="text"
            value={profile.departamento}
            onChange={(e) => setProfileField('departamento', e.target.value)}
            required
            maxLength={120}
            className={authInputClass}
          />
        </AuthField>
      </div>
    </>
  )
}

function ErrorBox({ message }) {
  return (
    <div
      className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm whitespace-pre-line text-red-600 dark:text-red-300"
      role="alert"
    >
      {message}
    </div>
  )
}
