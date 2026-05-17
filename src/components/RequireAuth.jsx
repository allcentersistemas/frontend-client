import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getClientAccessToken } from '../auth/clientSession'

export default function RequireAuth() {
  const location = useLocation()
  const token = getClientAccessToken()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
