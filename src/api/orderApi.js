import { clientApiUrl } from '../config/env'
import { fetchJson } from './http'
import { clientRefreshSession } from './clientAuth'
import {
  clearClientSession,
  getClientAccessToken,
  getClientRefreshToken,
  saveClientSession,
} from '../auth/clientSession'

const OPT_BASE = '/client/optimizacion'

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

export async function listProyectosOptimizacion() {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/proyectos`), {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function getProyectoOptimizacion(proyectoId) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/proyectos/${proyectoId}`), {
      headers: authHeaders(accessToken),
    }),
  )
}

/** Tableros y cantos registrados en Inventario → Tableros / Cantos (empleados). */
export async function fetchPlanillaCatalogos() {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/catalogos/kardex`), {
      headers: authHeaders(accessToken),
    }),
  )
}

/** @deprecated Usar fetchPlanillaCatalogos */
export const fetchKardexCatalogos = fetchPlanillaCatalogos

export async function saveProyectoCompleto(payload) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/proyectos/guardar-completo`), {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}
