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
    return new Error(body.message || body.code || response.statusText || `Error ${status}`)
  } catch {
    return new Error(response.statusText || `Error HTTP ${status}`)
  }
}
