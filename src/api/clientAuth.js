import { clientApiUrl } from '../config/env'
import { fetchJson } from './http'

const TIPOS_DOCUMENTO = ['DNI', 'CE', 'PASAPORTE']

/**
 * POST /api/client/auth/login (correo o usuario)
 */
export async function clientLogin(login, password) {
  return fetchJson(clientApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: login.trim(),
      password,
    }),
  })
}

/**
 * @typedef {Object} ClientRegisterPayload
 * @property {string} email
 * @property {string} username
 * @property {string} password
 * @property {boolean} juridica
 * @property {string} [displayName]
 * @property {string} [phone]
 * @property {string} [telegramChatId]
 * @property {string} [tipoDocumento]
 * @property {string} [numeroDocumento]
 * @property {string} [direccion]
 * @property {string} [ciudad]
 * @property {string} [distrito]
 * @property {string} [departamento]
 * @property {string} [razonSocial]
 * @property {string} [ruc]
 * @property {string} [nombre]
 */

function trimOpt(value) {
  if (value == null) return null
  const t = String(value).trim()
  return t === '' ? null : t
}

function trimRequired(value, label) {
  const t = trimOpt(value)
  if (!t) return { ok: false, message: `${label} es obligatorio` }
  return { ok: true, value: t }
}

/**
 * @param {ClientRegisterPayload} input
 */
export function validateClientRegisterPayload(input) {
  const email = String(input.email ?? '').trim()
  const username = String(input.username ?? '').trim().toLowerCase()
  const password = String(input.password ?? '')
  const juridica = Boolean(input.juridica)

  if (!email) return { ok: false, message: 'El correo es obligatorio' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Introduzca un correo válido' }
  }
  if (username.length < 3) {
    return { ok: false, message: 'El usuario debe tener al menos 3 caracteres' }
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return {
      ok: false,
      message: 'El usuario solo puede contener letras, números, punto, guion y guion bajo',
    }
  }
  if (password.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (password.length > 128) {
    return { ok: false, message: 'La contraseña no puede superar 128 caracteres' }
  }

  /** @type {ClientRegisterPayload} */
  const body = {
    email,
    username,
    password,
    juridica,
  }

  const phone = trimOpt(input.phone)
  if (phone && phone.length > 40) {
    return { ok: false, message: 'El teléfono no puede superar 40 caracteres' }
  }
  if (phone) body.phone = phone

  const telegramChatId = trimOpt(input.telegramChatId)
  if (telegramChatId && telegramChatId.length > 64) {
    return { ok: false, message: 'El Chat ID de Telegram no puede superar 64 caracteres' }
  }
  if (telegramChatId) body.telegramChatId = telegramChatId

  if (juridica) {
    for (const [field, label] of [
      ['razonSocial', 'La razón social'],
      ['ruc', 'El RUC'],
      ['nombre', 'El nombre'],
      ['direccion', 'La dirección'],
      ['ciudad', 'La ciudad'],
      ['distrito', 'El distrito'],
      ['departamento', 'El departamento'],
    ]) {
      const check = trimRequired(input[field], label)
      if (!check.ok) return check
      body[field] = check.value
    }
  } else {
    const nameCheck = trimRequired(input.displayName, 'El nombre completo')
    if (!nameCheck.ok) return nameCheck
    body.displayName = nameCheck.value

    const tipo = trimOpt(input.tipoDocumento)?.toUpperCase()
    if (!tipo || !TIPOS_DOCUMENTO.includes(tipo)) {
      return { ok: false, message: 'Seleccione un tipo de documento (DNI, CE o Pasaporte)' }
    }
    body.tipoDocumento = tipo

    const docCheck = trimRequired(input.numeroDocumento, 'El número de documento')
    if (!docCheck.ok) return docCheck
    body.numeroDocumento = docCheck.value

    for (const [field, label] of [
      ['direccion', 'La dirección'],
      ['ciudad', 'La ciudad'],
      ['distrito', 'El distrito'],
      ['departamento', 'El departamento'],
    ]) {
      const check = trimRequired(input[field], label)
      if (!check.ok) return check
      body[field] = check.value
    }
  }

  return { ok: true, body }
}

export async function clientRegister(payload) {
  const checked = validateClientRegisterPayload(payload)
  if (!checked.ok) {
    throw new Error(checked.message)
  }

  return fetchJson(clientApiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checked.body),
  })
}

export async function clientRefreshSession(refreshToken) {
  return fetchJson(clientApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

export async function clientFetchMe(accessToken) {
  return fetchJson(clientApiUrl('/auth/me'), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function clientUpdateProfile(accessToken, body) {
  return fetchJson(clientApiUrl('/auth/me'), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

export async function clientFetchLoginHistory(accessToken, { page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return fetchJson(clientApiUrl(`/auth/login-history?${params}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function clientChangePassword(accessToken, currentPassword, newPassword) {
  return fetchJson(clientApiUrl('/auth/change-password'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export async function clientLogoutAll(accessToken) {
  return fetchJson(clientApiUrl('/auth/logout-all'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function clientLogout(refreshToken) {
  return fetchJson(clientApiUrl('/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}
