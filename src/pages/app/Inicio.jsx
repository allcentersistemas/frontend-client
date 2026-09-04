import { Link, useOutletContext } from 'react-router-dom'

const shortcuts = [
  {
    to: '/app/proyectos',
    title: 'Mis proyectos',
    desc: 'Ver, buscar y abrir proyectos guardados de su cuenta.',
    step: '1',
  },
  {
    to: '/app/planilla-corte',
    title: 'Nuevo proyecto',
    desc: 'Crear proyecto, órdenes y capturar el detalle de piezas.',
    step: '2',
  },
]

export default function Inicio() {
  const { user } = useOutletContext()
  const name = user?.razonSocial || user?.displayName || user?.email

  return (
    <div className="page-stack">
      <header className="page__head">
        <h1>Inicio</h1>
        <p className="page__lead">
          Hola{name ? `, ${name}` : ''}. Siga el avance de sus pedidos (proyecto + obra/XML) o cree
          una planilla nueva.
        </p>
      </header>

      <div className="quick-links">
        {shortcuts.map((item) => (
          <Link key={item.to} to={item.to} className="quick-link card pad">
            <span className="home-card__step">{item.step}</span>
            <h2 className="card__title mt-3">{item.title}</h2>
            <p className="muted small mt-2">{item.desc}</p>
          </Link>
        ))}
      </div>

      <section className="card pad">
        <h2 className="card__title">Flujo recomendado</h2>
        <ol className="home-flow-list mt-4">
          <li>Active un proyecto con nombre y descripción.</li>
          <li>Agregue órdenes; al crear una irá al editor de piezas en pantalla completa.</li>
          <li>Complete la tabla de detalle y guarde el proyecto en el servidor.</li>
        </ol>
      </section>
    </div>
  )
}
