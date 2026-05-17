import { clientApiUrl } from '../config/env'
import { fetchJson } from './http'
import { clientRefreshSession } from './clientAuth'
import {
  clearClientSession,
  getClientAccessToken,
  getClientRefreshToken,
  saveClientSession,
} from '../auth/clientSession'

function authHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

async function withClientAuth(run) {
  const access = getClientAccessToken()
  if (!access) {
    throw new Error('No hay sesion activa')
  }
  try {
    return await run(access)
  } catch (err) {
    const message = String(err?.message || '')
    if (!message.includes('Sesión no válida') && !message.includes('no válida')) {
      throw err
    }
    const refresh = getClientRefreshToken()
    if (!refresh) {
      clearClientSession()
      throw err
    }
    try {
      const session = await clientRefreshSession(refresh)
      saveClientSession(session.accessToken, session.refreshToken)
      return await run(session.accessToken)
    } catch (refreshError) {
      clearClientSession()
      throw refreshError
    }
  }
}

export async function listClients() {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl('/clients'), {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  )
}

export async function getClientById(id) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`/clients/${id}`), {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  )
}

export async function createClient(body) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl('/clients'), {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    }),
  )
}

export async function updateClient(id, body) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`/clients/${id}`), {
      method: 'PUT',
      headers: authHeaders(accessToken),
      body: JSON.stringify(body),
    }),
  )
}

export async function deleteClient(id) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`/clients/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  )
}
