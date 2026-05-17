import { orderApiUrl } from '../config/env'
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
    const session = await clientRefreshSession(refresh)
    saveClientSession(session.accessToken, session.refreshToken)
    return run(session.accessToken)
  }
}

export async function saveProyectoCompleto(payload) {
  return withClientAuth((accessToken) =>
    fetchJson(orderApiUrl('/order/proyectos/guardar-completo'), {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}
