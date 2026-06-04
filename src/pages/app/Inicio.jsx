import { Link, useOutletContext } from 'react-router-dom'

export default function Inicio() {
  const { user } = useOutletContext()
  const name = user?.razonSocial || user?.displayName || user?.email

  return (
    <div className="page-stack">
      <header className="page__head">
        <h1>Inicio</h1>
        <p className="page__lead">
          Hola{name ? `, ${name}` : ''}. Gestione sus proyectos de optimización y capture la planilla de
          corte desde el menú lateral.
        </p>
      </header>

      <div className="quick-links">
        <Link to="/app/proyectos" className="quick-link card pad">
          <h2 className="card__title">Proyectos</h2>
          <p className="muted small mt-2">Ver y abrir los proyectos guardados de su cuenta.</p>
        </Link>
        <Link to="/app/planilla-corte" className="quick-link card pad">
          <h2 className="card__title">Nuevo proyecto</h2>
          <p className="muted small mt-2">Crear proyecto, órdenes y detalle de piezas.</p>
        </Link>
      </div>
    </div>
  )
}
