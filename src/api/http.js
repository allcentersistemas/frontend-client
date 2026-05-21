/**
 * Fetch con mensajes claros para proxy 502 y fallos de red (ECONNREFUSED, etc.).
 * @param {string} url
 * @param {RequestInit} [init]
 */
export async function fetchJson(url, init) {
  let res
  try {
    res = await fetch(url, {
      ...init,
      credentials: 'omit',
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
  } catch (err) {
    const msg = err?.message || ''
    if (
      err?.name === 'TypeError' ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('ECONNREFUSED')
    ) {
      throw new Error(
        'No se pudo conectar con el servidor. Comprueba que module-system esté en marcha (puerto 8080) y que el proxy de Vite apunte al puerto correcto.',
      )
    }
    throw err
  }

  if (res.ok) {
    const text = await res.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  throw await parseHttpError(res)
}

/**
 * @param {Response} response
 */
export async function parseHttpError(response) {
  const status = response.status
  if (status === 502 || status === 503 || status === 504) {
    return new Error(
      'El servidor intermedio devolvió error (502/503). Suele indicar que el backend no está escuchando en el puerto configurado o que el proxy de Vite no puede alcanzarlo.',
    )
  }
  if (status === 401) {
    return new Error('Sesión no válida o sin permiso. Vuelva a iniciar sesión.')
  }
  try {
    const body = await response.json()
    return formatApiErrorBody(body, status, response.statusText)
  } catch {
    return new Error(response.statusText || `Error HTTP ${status}`)
  }
}

const FIELD_LABELS = {
  email: 'Correo',
  password: 'Contraseña',
  displayName: 'Nombre para mostrar',
  companyName: 'Empresa',
  phone: 'Teléfono',
  taxId: 'Identificación fiscal',
}

/**
 * @param {Record<string, unknown>} body — ApiErrorResponse del backend
 * @param {number} status
 * @param {string} statusText
 */
export function formatApiErrorBody(body, status, statusText) {
  const base = body?.message || body?.code || statusText || `Error ${status}`

  const details = body?.details
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const lines = Object.entries(details).map(([field, msg]) => {
      const label = FIELD_LABELS[field] || field
      return `${label}: ${msg}`
    })
    if (lines.length) {
      return new Error(`${base}\n${lines.join('\n')}`)
    }
  }

  return new Error(String(base))
}
