import { clientApiUrl } from '../config/env'
import { fetchJson } from './http'

/**
 * POST /api/client/auth/login
 * @param {string} email
 * @param {string} password
 * @returns {Promise<ClientAuthSession>}
 */
export async function clientLogin(email, password) {
  return fetchJson(clientApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: email.trim(),
      password,
    }),
  })
}

/**
 * Cuerpo esperado por ClientRegisterRequest (module-system).
 * @typedef {Object} ClientRegisterPayload
 * @property {string} email
 * @property {string} password — mín. 8, máx. 128
 * @property {string} displayName — obligatorio, máx. 180
 * @property {string} [companyName] — máx. 180
 * @property {string} [phone] — máx. 40
 * @property {string} [taxId] — máx. 40
 */

/**
 * Valida en cliente antes de llamar al backend.
 * @param {ClientRegisterPayload} input
 * @returns {{ ok: true, body: ClientRegisterPayload } | { ok: false, message: string }}
 */
export function validateClientRegisterPayload(input) {
  const email = String(input.email ?? '').trim()
  const password = String(input.password ?? '')
  const displayName = String(input.displayName ?? '').trim()

  if (!email) return { ok: false, message: 'El correo es obligatorio' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: 'Introduzca un correo válido' }
  }
  if (password.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (password.length > 128) {
    return { ok: false, message: 'La contraseña no puede superar 128 caracteres' }
  }
  if (!displayName) {
    return { ok: false, message: 'El nombre para mostrar es obligatorio' }
  }
  if (displayName.length > 180) {
    return { ok: false, message: 'El nombre no puede superar 180 caracteres' }
  }

  const companyName = String(input.companyName ?? '').trim()
  const phone = String(input.phone ?? '').trim()
  const taxId = String(input.taxId ?? '').trim()

  if (companyName.length > 180) {
    return { ok: false, message: 'El nombre de empresa no puede superar 180 caracteres' }
  }
  if (phone.length > 40) {
    return { ok: false, message: 'El teléfono no puede superar 40 caracteres' }
  }
  if (taxId.length > 40) {
    return { ok: false, message: 'La identificación fiscal no puede superar 40 caracteres' }
  }

  /** @type {ClientRegisterPayload} */
  const body = { email, password, displayName }
  if (companyName) body.companyName = companyName
  if (phone) body.phone = phone
  if (taxId) body.taxId = taxId

  return { ok: true, body }
}

/**
 * POST /api/client/auth/register — ClientAuthController.register
 * @param {ClientRegisterPayload} payload
 * @returns {Promise<ClientAuthSession>}
 */
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

/**
 * @typedef {Object} ClientAuthSession
 * @property {Object} client
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {string} tokenType
 * @property {number} accessExpiresInMs
 * @property {number} refreshExpiresInMs
 */

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

export async function clientLogout(refreshToken) {
  return fetchJson(clientApiUrl('/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}
