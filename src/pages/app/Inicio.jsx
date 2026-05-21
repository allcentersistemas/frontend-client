import { Link, useOutletContext } from 'react-router-dom'

export default function Inicio() {
  const { user } = useOutletContext()

  return (
    <div>
      <div className="page__head mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          Inicio
        </h1>
        <p className="page__lead">
          Hola{user?.email ? `, ${user.email}` : ''}. Desde el menú{' '}
          <strong>Optimizaciones</strong> puede trabajar con la planilla de corte, importar Excel y
          guardar proyectos.
        </p>
      </div>

      <div className="card pad">
        <h2 className="card__title mb-3">Accesos rápidos</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/app/planilla-corte" className="btn btn--primary">
            Planilla de corte
          </Link>
        </div>
      </div>
    </div>
  )
}
