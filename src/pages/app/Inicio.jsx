import { Link, useOutletContext } from 'react-router-dom'

export default function Inicio() {
  const { user } = useOutletContext()

  return (
    <div className="page-inicio">
      <h1 className="page-title">Inicio</h1>
      <p className="page-lead muted">
        Hola{user?.email ? `, ${user.email}` : ''}. Use el menú <strong>Optimizaciones</strong>{' '}
        para crear filas, importar Excel, buscar por material o ver el listado.
      </p>

    </div>
  )
}
