import { clientApiUrl } from '../config/env'
import { fetchJson } from './http'

/**
 * @param {string} email
 * @param {string} password
 */
export async function clientLogin(email, password) {
  return fetchJson(clientApiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  })
}

/**
 * @param {{
 *   email: string,
 *   password: string,
 *   displayName?: string,
 *   companyName?: string,
 *   phone?: string,
 *   taxId?: string
 * }} body
 */
export async function clientRegister(body) {
  return fetchJson(clientApiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

export async function clientLogout(refreshToken) {
  return fetchJson(clientApiUrl('/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}
