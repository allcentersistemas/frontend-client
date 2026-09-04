import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  clientChangePassword,
  clientFetchLoginHistory,
  clientFetchTelegramInfo,
  clientLogoutAll,
  clientUpdateProfile,
} from '../../api/clientAuth'
import { clearClientSession, getClientAccessToken } from '../../auth/clientSession'
import { formatAppDateTime } from '../../utils/appDateTime'

const ACTION_LABELS = {
  LOGIN_SUCCESS: 'Inicio de sesión exitoso',
  LOGIN_FAILURE: 'Intento fallido',
  CREATE: 'Cuenta creada',
  PASSWORD_CHANGED: 'Contraseña actualizada',
  LOGOUT_ALL: 'Sesiones cerradas',
}

function actionLabel(action) {
  return ACTION_LABELS[action] || action || '—'
}

function summarizeDevice(event) {
  if (event.deviceName) return event.deviceName
  if (!event.userAgent) return '—'
  const ua = event.userAgent
  if (ua.length <= 80) return ua
  return `${ua.slice(0, 77)}…`
}

function InfoRow({ label, value }) {
  return (
    <div className="account-info-row">
      <dt className="muted small">{label}</dt>
      <dd className="account-info-row__value">{value || '—'}</dd>
    </div>
  )
}

export default function CuentaPage() {
  const { user, refreshUser } = useOutletContext()
  const [history, setHistory] = useState({ items: [], page: 0, size: 20, totalElements: 0 })
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [page, setPage] = useState(0)

  const [telegramChatId, setTelegramChatId] = useState('')
  const [tgMsg, setTgMsg] = useState('')
  const [tgBusy, setTgBusy] = useState(false)
  const [telegramInfo, setTelegramInfo] = useState(null)

  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)

  useEffect(() => {
    setTelegramChatId(user?.telegramChatId ?? '')
  }, [user?.telegramChatId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await clientFetchTelegramInfo()
        if (!cancelled) setTelegramInfo(data)
      } catch {
        if (!cancelled) setTelegramInfo(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadHistory = useCallback(async (pageIndex = 0) => {
    const token = getClientAccessToken()
    if (!token) return
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const data = await clientFetchLoginHistory(token, { page: pageIndex, size: 20 })
      setHistory(data)
      setPage(data.page ?? pageIndex)
    } catch (err) {
      setHistory({ items: [], page: 0, size: 20, totalElements: 0 })
      setHistoryError(err.message || 'No se pudo cargar el historial.')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory(0)
  }, [loadHistory])

  const totalPages = Math.max(1, Math.ceil((history.totalElements || 0) / (history.size || 20)))

  async function handleSaveTelegram(e) {
    e.preventDefault()
    setTgMsg('')
    const token = getClientAccessToken()
    if (!token) return
    setTgBusy(true)
    try {
      await clientUpdateProfile(token, { telegramChatId: telegramChatId.trim() })
      setTgMsg(
        telegramChatId.trim()
          ? 'Chat ID de Telegram guardado. Recibirá avisos cuando su pedido esté listo.'
          : 'Chat ID de Telegram eliminado.',
      )
      await refreshUser(token)
    } catch (err) {
      setTgMsg(err.message || 'No se pudo guardar el Chat ID.')
    } finally {
      setTgBusy(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwdMsg('')
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdMsg('La nueva contraseña y la confirmación no coinciden.')
      return
    }
    if (pwdForm.next.length < 8) {
      setPwdMsg('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    const token = getClientAccessToken()
    if (!token) return
    setPwdBusy(true)
    try {
      await clientChangePassword(token, pwdForm.current, pwdForm.next)
      setPwdForm({ current: '', next: '', confirm: '' })
      setPwdMsg('Contraseña actualizada correctamente.')
      await loadHistory(0)
      await refreshUser(token)
    } catch (err) {
      setPwdMsg(err.message || 'No se pudo actualizar la contraseña.')
    } finally {
      setPwdBusy(false)
    }
  }

  async function handleLogoutAll() {
    if (
      !window.confirm(
        '¿Cerrar sesión en todos los dispositivos? Tendrá que volver a iniciar sesión aquí también.',
      )
    ) {
      return
    }
    const token = getClientAccessToken()
    if (!token) return
    try {
      await clientLogoutAll(token)
    } catch {
      /* cerrar sesión local aunque falle el servidor */
    }
    clearClientSession()
    window.location.href = '/login'
  }

  const displayName = user?.juridica
    ? user?.razonSocial || user?.displayName
    : user?.displayName || user?.nombre

  return (
    <div className="page-stack">
      <header className="page__head">
        <h1>Mi cuenta</h1>
        <p className="page__lead">
          Consulte los datos de su cuenta, el último acceso y el historial de actividad de seguridad.
        </p>
      </header>

      <section className="card pad account-summary">
        <h2 className="card__title">Información de la cuenta</h2>
        <dl className="account-info-grid mt-4">
          <InfoRow label="Nombre" value={displayName} />
          <InfoRow label="Correo" value={user?.email} />
          <InfoRow label="Usuario" value={user?.username} />
          <InfoRow
            label="Tipo de cuenta"
            value={user?.juridica ? 'Persona jurídica' : 'Persona natural'}
          />
          {user?.juridica ? (
            <>
              <InfoRow label="RUC" value={user?.ruc} />
              <InfoRow label="Contacto" value={user?.nombre} />
            </>
          ) : (
            <>
              <InfoRow
                label="Documento"
                value={
                  user?.tipoDocumento && user?.numeroDocumento
                    ? `${user.tipoDocumento} ${user.numeroDocumento}`
                    : user?.numeroDocumento
                }
              />
            </>
          )}
          <InfoRow label="Teléfono" value={user?.phone} />
          <InfoRow label="Telegram Chat ID" value={user?.telegramChatId} />
          <InfoRow label="Cuenta creada" value={formatAppDateTime(user?.createdAt)} />
          <InfoRow label="Último acceso" value={formatAppDateTime(user?.lastLoginAt)} />
          <InfoRow label="IP del último acceso" value={user?.lastLoginIp} />
          <InfoRow
            label="Total de accesos"
            value={user?.loginCount != null ? String(user.loginCount) : '—'}
          />
        </dl>
      </section>

      <section className="card pad">
        <h2 className="card__title">Notificaciones Telegram</h2>
        <p className="muted small mt-1">
          Opcional. Guarde su Chat ID para recibir un aviso cuando su pedido esté listo para entregar.
          {telegramInfo?.enabled && telegramInfo?.botUsername ? (
            <>
              {' '}
              Abra el bot{' '}
              <a
                href={telegramInfo.botUrl || `https://t.me/${telegramInfo.botUsername}`}
                target="_blank"
                rel="noreferrer"
              >
                @{telegramInfo.botUsername}
              </a>
              , inicie el chat y obtenga su Chat ID (por ejemplo con @userinfobot).
            </>
          ) : (
            <> Las notificaciones Telegram no están activas todavía o el bot no tiene usuario configurado.</>
          )}
        </p>
        <form className="mt-4" onSubmit={(e) => void handleSaveTelegram(e)}>
          <label className="field">
            <span className="field__label">Chat ID de Telegram</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={64}
              placeholder="Ej. 123456789"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
            />
          </label>
          {telegramInfo?.enabled && telegramInfo?.botUrl ? (
            <p className="mt-3">
              <a
                className="btn btn--secondary btn--sm"
                href={telegramInfo.botUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir @{telegramInfo.botUsername} en Telegram
              </a>
            </p>
          ) : null}
          {tgMsg ? (
            <p
              className={
                tgMsg.includes('guardado') || tgMsg.includes('eliminado')
                  ? 'form-success mt-3'
                  : 'form-error mt-3'
              }
              role="status"
            >
              {tgMsg}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary mt-4" disabled={tgBusy}>
            {tgBusy ? 'Guardando…' : 'Guardar Chat ID'}
          </button>
        </form>
      </section>

      <section className="card pad">
        <div className="account-section-head">
          <h2 className="card__title">Historial de acceso</h2>
          <p className="muted small mt-1">
            Inicios de sesión, intentos fallidos y cambios relevantes de seguridad.
          </p>
        </div>

        {historyError ? (
          <p className="form-error mt-4" role="alert">
            {historyError}
          </p>
        ) : null}

        {loadingHistory ? (
          <p className="muted small mt-4">Cargando historial…</p>
        ) : history.items?.length ? (
          <>
            <div className="table-wrap mt-4 hidden md:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Evento</th>
                    <th>IP</th>
                    <th>Dispositivo / navegador</th>
                  </tr>
                </thead>
                <tbody>
                  {history.items.map((event) => (
                    <tr key={event.id}>
                      <td>{formatAppDateTime(event.occurredAt)}</td>
                      <td>
                        <span
                          className={
                            event.action === 'LOGIN_FAILURE'
                              ? 'account-event account-event--fail'
                              : 'account-event'
                          }
                        >
                          {actionLabel(event.action)}
                        </span>
                        {event.details ? (
                          <span className="muted small block mt-1">{event.details}</span>
                        ) : null}
                      </td>
                      <td>{event.clientIp || '—'}</td>
                      <td className="account-ua">{summarizeDevice(event)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="account-history-mobile mt-4 grid gap-3 md:hidden">
              {history.items.map((event) => (
                <li key={event.id} className="account-history-card">
                  <p className="font-medium">{actionLabel(event.action)}</p>
                  <p className="muted small mt-1">{formatAppDateTime(event.occurredAt)}</p>
                  <p className="small mt-2">
                    <span className="muted">IP:</span> {event.clientIp || '—'}
                  </p>
                  <p className="small mt-1 account-ua">{summarizeDevice(event)}</p>
                  {event.details ? <p className="muted small mt-1">{event.details}</p> : null}
                </li>
              ))}
            </ul>

            {totalPages > 1 ? (
              <div className="account-pagination mt-4">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={page <= 0}
                  onClick={() => void loadHistory(page - 1)}
                >
                  Anterior
                </button>
                <span className="muted small">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => void loadHistory(page + 1)}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="muted small mt-4">Aún no hay eventos registrados.</p>
        )}
      </section>

      <section className="card pad">
        <h2 className="card__title">Seguridad</h2>
        <form className="account-password-form mt-4" onSubmit={handleChangePassword}>
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Contraseña actual</span>
              <input
                type="password"
                autoComplete="current-password"
                value={pwdForm.current}
                onChange={(e) => setPwdForm((f) => ({ ...f, current: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pwdForm.next}
                onChange={(e) => setPwdForm((f) => ({ ...f, next: e.target.value }))}
                required
                minLength={8}
              />
            </label>
            <label className="field">
              <span className="field__label">Confirmar nueva contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pwdForm.confirm}
                onChange={(e) => setPwdForm((f) => ({ ...f, confirm: e.target.value }))}
                required
                minLength={8}
              />
            </label>
          </div>
          {pwdMsg ? (
            <p
              className={pwdMsg.includes('correctamente') ? 'form-success mt-3' : 'form-error mt-3'}
              role="status"
            >
              {pwdMsg}
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary mt-4" disabled={pwdBusy}>
            {pwdBusy ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>

        <div className="account-danger-zone mt-6">
          <h3 className="text-sm font-semibold">Sesiones activas</h3>
          <p className="muted small mt-1">
            Si sospecha que alguien más tiene acceso a su cuenta, cierre todas las sesiones abiertas.
          </p>
          <button type="button" className="btn btn--ghost mt-3" onClick={handleLogoutAll}>
            Cerrar sesión en todos los dispositivos
          </button>
        </div>
      </section>
    </div>
  )
}
