import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProyectosOptimizacion } from '../../api/orderApi'
import { formatProjectDate } from '../../planilla/helpers'

export default function ProyectosPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await listProyectosOptimizacion()
      setProjects(Array.isArray(list) ? list : [])
    } catch (err) {
      setProjects([])
      setError(err.message || 'No se pudieron cargar sus proyectos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => {
      const hay = `${p.nombre || ''} ${p.descripcion || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [projects, query])

  return (
    <div className="page-stack">
      <header className="page__head">
        <div className="page__head-row">
          <div>
            <h1>Mis proyectos</h1>
            <p className="page__lead">
              Proyectos de optimización de su cuenta. Abra uno para editar la planilla de corte o cree
              uno nuevo.
            </p>
          </div>
          <Link to="/app/planilla-corte" className="btn btn--primary shrink-0">
            Nuevo proyecto
          </Link>
        </div>
      </header>

      <section className="card pad toolbar toolbar--wrap">
        <label className="field" style={{ flex: '1 1 220px', margin: 0 }}>
          <span>Buscar</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o descripción"
          />
        </label>
        <button type="button" className="btn btn--ghost" disabled={loading} onClick={() => void loadProjects()}>
          Actualizar
        </button>
      </section>

      {error ? <p className="form-error px-1">{error}</p> : null}

      {loading ? (
        <div className="card pad">
          <p className="muted">Cargando proyectos…</p>
        </div>
      ) : !filtered.length ? (
        <div className="card pad empty-state">
          <h2 className="card__title">Sin proyectos</h2>
          <p className="muted mt-2">
            {query.trim()
              ? 'No hay proyectos que coincidan con la búsqueda.'
              : 'Aún no tiene proyectos guardados.'}
          </p>
          {!query.trim() ? (
            <Link to="/app/planilla-corte" className="btn btn--primary mt-4">
              Crear proyecto
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <div className="project-grid md:hidden">
            {filtered.map((p) => (
              <article key={p.id} className="project-card">
                <div className="project-card__head">
                  <h3 className="project-card__title">{p.nombre}</h3>
                  <span className="tag">{p.cantidadOrdenes ?? 0} órdenes</span>
                </div>
                <p className="project-card__desc">{p.descripcion || 'Sin descripción'}</p>
                <p className="small muted">{formatProjectDate(p.fechaCreacion)}</p>
                <div className="project-card__actions">
                  <Link to={`/app/planilla-corte/${p.id}`} className="btn btn--primary">
                    Abrir planilla
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="card card--table hidden md:block">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Órdenes</th>
                    <th>Creado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.nombre}</td>
                      <td className="max-w-xs truncate">{p.descripcion || '—'}</td>
                      <td>{p.cantidadOrdenes ?? 0}</td>
                      <td className="small whitespace-nowrap">{formatProjectDate(p.fechaCreacion)}</td>
                      <td>
                        <Link to={`/app/planilla-corte/${p.id}`} className="btn btn--ghost">
                          Abrir planilla
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
