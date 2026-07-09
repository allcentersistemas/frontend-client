import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadProyectoCotizacion, cancelProyectoOptimizacion, listProyectosOptimizacion } from '../../api/orderApi'
import { EstadoTag } from '../../components/EstadoTag'
import {
  ESTADOS_PROYECTO,
  canDownloadCotizacion,
  emptyProyectoFilters,
  filterProyectosClientSide,
  formatProyectoDate,
} from '../../planilla/proyectoListUtils'

export default function ProyectosPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [busyId, setBusyId] = useState(null)
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

  async function handleCancelProject(project) {
    const nombre = project.nombre || `proyecto ${project.id}`
    if (
      !window.confirm(
        `¿Cancelar el proyecto «${nombre}»? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    setBusyId(project.id)
    setActionMsg('')
    try {
      await cancelProyectoOptimizacion(project.id)
      setActionMsg(`Proyecto «${nombre}» cancelado.`)
      await loadProjects()
    } catch (err) {
      setActionMsg(err.message || 'No se pudo cancelar el proyecto.')
    } finally {
      setBusyId(null)
    }
  }

  function canCancelProject(project) {
    return project.estado === 'ENVIADO' || project.estado === 'EN_ATENCION'
  }

  async function handleDownloadCotizacion(project) {
    setBusyId(project.id)
    setActionMsg('')
    try {
      const safe = (project.nombre || `proyecto-${project.id}`).replace(/[^\w.-]+/g, '_')
      await downloadProyectoCotizacion(project.id, safe)
    } catch (err) {
      setActionMsg(err.message || 'No se pudo descargar la cotización.')
    } finally {
      setBusyId(null)
    }
  }

  function renderProyectoActions(project) {
    return (
      <>
        <Link to={`/app/planilla-corte/${project.id}`} className="btn btn--ghost btn--sm">
          Ver detalle
        </Link>
        {canDownloadCotizacion(project) ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={busyId === project.id}
            onClick={() => void handleDownloadCotizacion(project)}
          >
            {busyId === project.id ? 'Descargando…' : 'Descargar cotización'}
          </button>
        ) : (
          <span className="small muted self-center">Sin cotización</span>
        )}
        {canCancelProject(project) ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={busyId === project.id}
            style={{ color: 'var(--danger, #b00020)' }}
            onClick={() => void handleCancelProject(project)}
          >
            Cancelar
          </button>
        ) : null}
      </>
    )
  }

  function renderProyectoCard(project) {
    return (
      <article key={project.id} className="project-card">
        <div className="project-card__head">
          <h2 className="project-card__title">{project.nombre}</h2>
          <EstadoTag estado={project.estado} />
        </div>
        {project.descripcion ? (
          <p className="project-card__desc line-clamp-2">{project.descripcion}</p>
        ) : (
          <p className="project-card__desc muted">Sin descripción</p>
        )}
        <p className="small muted mt-2">
          {project.cantidadOrdenes ?? 0} orden{(project.cantidadOrdenes ?? 0) === 1 ? '' : 'es'} ·{' '}
          {formatProyectoDate(project.fechaCreacion)}
        </p>
        <div className="project-card__actions">{renderProyectoActions(project)}</div>
      </article>
    )
  }

  return (
    <div className="page-stack">
      <header className="page__head">
        <div className="page__head-row">
          <div>
            <h1>Mis proyectos</h1>
            <p className="page__lead">
              Consulte el estado de sus envíos y descargue la cotización cuando esté disponible.
            </p>
          </div>
          <Link to="/app/planilla-corte" className="btn btn--primary shrink-0">
            Nuevo proyecto
          </Link>
        </div>
      </header>

      {actionMsg ? <p className="form-error px-1">{actionMsg}</p> : null}

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
            {filtered.map((p) => renderProyectoCard(p))}
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.nombre}</td>
                      <td>
                        <EstadoTag estado={p.estado} />
                      </td>
                      <td className="max-w-xs truncate">{p.descripcion || '—'}</td>
                      <td>{p.cantidadOrdenes ?? 0}</td>
                      <td className="small whitespace-nowrap">{formatProyectoDate(p.fechaCreacion)}</td>
                      <td>
                        <div className="flex flex-wrap gap-2">{renderProyectoActions(p)}</div>
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
