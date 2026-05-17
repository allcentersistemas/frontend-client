import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { clientRegister } from '../api/clientAuth'
import { getClientAccessToken, saveClientSession } from '../auth/clientSession'
import { registrationEnabled } from '../config/security'
import '../App.css'

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
    <div className="shell login login-full">
      <div className="card login-card register-card">
        <h1 className="page-title">Crear cuenta</h1>
        <p className="muted subtitle">
          Registro en <strong>module-system</strong> (cuenta guardada en base de datos).
        </p>
        <form onSubmit={handleSubmit} className="login-form">
          <label className="field">
            <span>Correo *</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Contraseña * (mín. 8 caracteres)</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          <label className="field">
            <span>Repetir contraseña *</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Nombre para mostrar</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Empresa</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="field">
            <span>Identificación fiscal</span>
            <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Registrarse'}
          </button>
        </form>
        <p className="hint">
          ¿Ya tiene cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}