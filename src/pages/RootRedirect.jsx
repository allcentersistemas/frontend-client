import { Navigate } from 'react-router-dom'
import { getClientAccessToken } from '../auth/clientSession'

export default function RootRedirect() {
  const token = getClientAccessToken()
  return <Navigate to={token ? '/app' : '/login'} replace />
}
