const ACCESS = 'allcenter_client_access'
const REFRESH = 'allcenter_client_refresh'

export function saveClientSession(accessToken, refreshToken) {
  sessionStorage.setItem(ACCESS, accessToken)
  sessionStorage.setItem(REFRESH, refreshToken)
}

export function clearClientSession() {
  sessionStorage.removeItem(ACCESS)
  sessionStorage.removeItem(REFRESH)
}

export function getClientAccessToken() {
  return sessionStorage.getItem(ACCESS)
}

export function getClientRefreshToken() {
  return sessionStorage.getItem(REFRESH)
}

/** Decodifica el payload JWT (sin verificar firma; solo para decidir si ya caducó). */
function decodeJwtPayload(token) {
  const parts = String(token).split('.')
  if (parts.length < 2) return null
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  try {
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

/** true si el access token ya caducó (o caduca en los próximos skewSeconds). */
export function isAccessTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return Date.now() >= payload.exp * 1000 - skewSeconds * 1000
}
