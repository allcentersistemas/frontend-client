import { clientApiUrl } from '../config/env'
import { fetchJson, parseHttpError } from './http'
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

export async function findProyectoByNombre(nombre) {
  return withClientAuth(async (accessToken) => {
    const q = encodeURIComponent(nombre.trim())
    const url = clientApiUrl(`${OPT_BASE}/proyectos/por-nombre?nombre=${q}`)
    const res = await fetch(url, {
      headers: authHeaders(accessToken),
      credentials: 'omit',
    })
    if (res.status === 404) return null
    if (!res.ok) throw await parseHttpError(res)
    const text = await res.text()
    return text ? JSON.parse(text) : null
  })
}

export async function saveProyectoCompleto(payload) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/proyectos/guardar-completo`), {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    }),
  )
}

export async function fetchMaquinas() {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/maquinas`), {
      headers: authHeaders(accessToken),
    }),
  )
}

export async function updateProyectoMaquina(proyectoId, maquinaId) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/proyectos/${proyectoId}/maquina`), {
      method: 'PATCH',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ maquinaId }),
    }),
  )
}

/** Descarga la cotización del proyecto (solo si estado COTIZADO y archivo disponible). */
export async function downloadProyectoCotizacion(proyectoId, filenameHint = 'cotizacion') {
  return withClientAuth(async (accessToken) => {
    const url = clientApiUrl(`${OPT_BASE}/proyectos/${proyectoId}/cotizacion`)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'omit',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let message = 'No se pudo descargar la cotización.'
      try {
        const body = JSON.parse(text)
        if (body?.message) message = body.message
      } catch {
        if (text) message = text
      }
      throw new Error(message)
    }
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `${filenameHint}-cotizacion.pdf`
    a.click()
    URL.revokeObjectURL(objectUrl)
  })
}
