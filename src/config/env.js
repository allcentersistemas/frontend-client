function trimSlash(s) {
  return String(s).replace(/\/+$/, '')
}

function resolvePrefix(envKey, prodDefault, devDefault) {
  const raw = import.meta.env[envKey]
  if (raw !== undefined && raw !== '') {
    return trimSlash(raw)
  }
  if (import.meta.env.PROD || import.meta.env.MODE === 'staging') {
    return prodDefault
  }
  return trimSlash(devDefault)
}

/** Prefijo proxy Vite → module-system (auth en /api/client/auth vía rewrite). */
export const clientApiPrefix = resolvePrefix(
  'VITE_CLIENT_API_PREFIX',
  '/client-api',
  '/client-api',
)

/** Prefijo order/proyectos → module-system /api/order. */
export const orderApiPrefix = resolvePrefix(
  'VITE_ORDER_API_PREFIX',
  '/order-api',
  '/order-api',
)

/** URL absoluta opcional (sin proxy). */
export const clientApiBaseUrl = import.meta.env.VITE_CLIENT_API_BASE_URL
  ? trimSlash(import.meta.env.VITE_CLIENT_API_BASE_URL)
  : null

export const orderApiBaseUrl = import.meta.env.VITE_ORDER_API_BASE_URL
  ? trimSlash(import.meta.env.VITE_ORDER_API_BASE_URL)
  : null

export function clientApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (clientApiBaseUrl) {
    return `${clientApiBaseUrl}${p}`
  }
  return `${clientApiPrefix}${p}`
}

export function orderApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (orderApiBaseUrl) {
    return `${orderApiBaseUrl}${p}`
  }
  return `${orderApiPrefix}${p}`
}
