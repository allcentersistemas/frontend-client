import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProyectosOptimizacion } from '../../api/orderApi'
import {
  ESTADOS_PROYECTO,
  emptyProyectoFilters,
  filterProyectosClientSide,
  formatEstadoProyecto,
  formatProyectoDate,
} from '../../planilla/proyectoListUtils'

export default function ProyectosPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(emptyProyectoFilters())
  const [applied, setApplied] = useState(emptyProyectoFilters())

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

  const filtered = useMemo(
    () => filterProyectosClientSide(projects, applied),
    [projects, applied],
  )

  function applyFilters(e) {
    e.preventDefault()
    setApplied({ ...filters })
  }

  function resetFilters() {
    const empty = emptyProyectoFilters()
    setFilters(empty)
    setApplied(empty)
  }

  return (
    <div className="page-stack">
      <header className="page__head">
        <div className="page__head-row">
          <div>
            <h1>Mis proyectos</h1>
            <p className="page__lead">
              Solo los proyectos de su cuenta. Una vez enviados a ventas ya no puede editarlos.
            </p>
          </div>
          <Link to="/app/planilla-corte" className="btn btn--primary shrink-0">
            Nuevo proyecto
          </Link>
        </div>
      </header>

      <section className="card pad">
        <form onSubmit={applyFilters} className="toolbar toolbar--wrap">
          <label className="field" style={{ flex: '1 1 160px', margin: 0 }}>
            <span>Estado</span>
            <select
              value={filters.estado}
              onChange={(e) => setFilters((f) => ({ ...f, estado: e.target.value }))}
            >
              {ESTADOS_PROYECTO.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ flex: '1 1 180px', margin: 0 }}>
            <span>Nombre</span>
            <input
              value={filters.nombre}
              onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Buscar proyecto"
            />
          </label>
          <label className="field" style={{ flex: '0 1 150px', margin: 0 }}>
            <span>Desde</span>
            <input
              type="date"
              value={filters.fechaDesde}
              onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value }))}
            />
          </label>
          <label className="field" style={{ flex: '0 1 150px', margin: 0 }}>
            <span>Hasta</span>
            <input
              type="date"
              value={filters.fechaHasta}
              onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn--primary">
            Filtrar
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetFilters}>
            Limpiar
          </button>
          <button type="button" className="btn btn--ghost" disabled={loading} onClick={() => void loadProjects()}>
            Actualizar
          </button>
        </form>
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
            {applied.nombre || applied.estado || applied.fechaDesde || applied.fechaHasta
              ? 'No hay proyectos que coincidan con los filtros.'
              : 'Aún no tiene proyectos enviados.'}
          </p>
          {!applied.nombre && !applied.estado && !applied.fechaDesde && !applied.fechaHasta ? (
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
                  <span className="tag">{formatEstadoProyecto(p.estado)}</span>
                </div>
                <p className="project-card__desc">{p.descripcion || 'Sin descripción'}</p>
                <p className="small muted">
                  {formatProyectoDate(p.fechaCreacion)} · {p.cantidadOrdenes ?? 0} órdenes
                </p>
                <div className="project-card__actions">
                  <Link to={`/app/planilla-corte/${p.id}`} className="btn btn--primary">
                    Ver detalle
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
                    <th>Estado</th>
                    <th>Descripción</th>
                    <th>Órdenes</th>
                    <th>Enviado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.nombre}</td>
                      <td>
                        <span className="tag">{formatEstadoProyecto(p.estado)}</span>
                      </td>
                      <td className="max-w-xs truncate">{p.descripcion || '—'}</td>
                      <td>{p.cantidadOrdenes ?? 0}</td>
                      <td className="small whitespace-nowrap">{formatProyectoDate(p.fechaCreacion)}</td>
                      <td>
                        <Link to={`/app/planilla-corte/${p.id}`} className="btn btn--ghost">
                          Ver detalle
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
