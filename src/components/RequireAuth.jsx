import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getClientAccessToken, getClientRefreshToken, isAccessTokenExpired } from '../auth/clientSession'

export default function RequireAuth() {
  const location = useLocation()
  const token = getClientAccessToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Token vencido y sin refresh token: sesión muerta, no vale la pena dejar entrar
  // (el primer llamado a la API fallaría igual). Con refresh token disponible se deja
  // pasar: withClientAuth() en clientApi.js renueva la sesión de forma transparente.
  if (isAccessTokenExpired(token) && !getClientRefreshToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
