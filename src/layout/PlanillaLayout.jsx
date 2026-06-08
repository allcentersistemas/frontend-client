import { Outlet, useParams } from 'react-router-dom'
import { PlanillaDraftProvider } from '../context/PlanillaDraftContext'

export default function PlanillaLayout() {
  const { projectId } = useParams()
  const projectKey = projectId || 'nuevo'

  return (
    <PlanillaDraftProvider projectKey={projectKey}>
      <Outlet />
    </PlanillaDraftProvider>
  )
}
