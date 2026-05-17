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
