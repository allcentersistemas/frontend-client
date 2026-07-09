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

function parseContentDispositionFilename(header) {
  if (!header) return null
  const star = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i)
  if (star) {
    try {
      return decodeURIComponent(star[1].replace(/(^"|"$)/g, ''))
    } catch {
      return star[1].replace(/(^"|"$)/g, '')
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1] : null
}

function parseErrorMessage(text, fallback) {
  if (!text) return fallback
  try {
    const body = JSON.parse(text)
    if (body?.message) return body.message
    if (body?.error) return body.error
  } catch {
    if (text.length < 280) return text
  }
  return fallback
}

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

function isPreviewableDownload(contentType, filename) {
  const type = String(contentType || '').toLowerCase()
  const name = String(filename || '').toLowerCase()
  return type.includes('pdf') || type.startsWith('image/') || name.endsWith('.pdf')
}

function triggerFileDownload(blob, filename, contentType) {
  const typedBlob =
    blob.type && blob.type !== 'application/octet-stream'
      ? blob
      : new Blob([blob], { type: contentType || 'application/octet-stream' })
  const objectUrl = URL.createObjectURL(typedBlob)
  const mobile = isMobileBrowser()
  const previewable = isPreviewableDownload(contentType, filename)

  if (mobile && previewable) {
    const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000)
    return
  }

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000)
}

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

/** Descarga o abre la cotización del proyecto en una pestaña nueva (móvil) o como archivo. */
export async function downloadProyectoCotizacion(proyectoId, filenameHint = 'cotizacion') {
  return withClientAuth(async (accessToken) => {
    const url = clientApiUrl(`${OPT_BASE}/proyectos/${proyectoId}/cotizacion`)
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'omit',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(parseErrorMessage(text, 'No se pudo descargar la cotización.'))
    }
    const blob = await res.blob()
    if (!blob || blob.size === 0) {
      throw new Error('La cotización llegó vacía desde el servidor. Contacte a ventas.')
    }
    const disposition = res.headers.get('Content-Disposition')
    const fromHeader = parseContentDispositionFilename(disposition)
    const contentType = res.headers.get('Content-Type') || blob.type || 'application/pdf'
    const safeHint = String(filenameHint || 'cotizacion').replace(/[^\w.-]+/g, '_')
    const downloadName = fromHeader || `${safeHint}-cotizacion.pdf`
    triggerFileDownload(blob, downloadName, contentType)
  })
}

export async function cancelProyectoOptimizacion(proyectoId) {
  return withClientAuth((accessToken) =>
    fetchJson(clientApiUrl(`${OPT_BASE}/proyectos/${proyectoId}/cancelar`), {
      method: 'POST',
      headers: authHeaders(accessToken),
    }),
  )
}
