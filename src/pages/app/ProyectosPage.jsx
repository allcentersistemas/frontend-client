import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  downloadProyectoCotizacion,
  cancelProyectoOptimizacion,
  getProyectoOptimizacion,
  listProyectosOptimizacion,
  listSeguimientoProyectosBoard,
} from '../../api/orderApi'
import { EstadoTag } from '../../components/EstadoTag'
import { PlanoViewerModal } from '../../components/planilla/PlanoViewerModal'
import { ProyectoFlujoBar } from '../../components/ProyectoFlujoBar'
import {
  ESTADOS_PROYECTO,
  canDownloadCotizacion,
  canViewPlano,
  emptyProyectoFilters,
  estadoOrdenClienteTagClass,
  filterProyectosClientSide,
  formatEstadoOrdenCliente,
  formatProyectoDate,
  isProyectoCancelado,
  normalizeEstadoCodigo,
  resolveEstadoOrdenCliente,
} from '../../planilla/proyectoListUtils'

function mergeProjectsWithBoard(projects, board) {
  const byId = new Map()
  for (const item of Array.isArray(board) ? board : []) {
    if (item?.proyectoId != null) byId.set(String(item.proyectoId), item)
  }
  return (Array.isArray(projects) ? projects : []).map((p) => {
    const boardItem = byId.get(String(p.id))
    if (!boardItem) {
      return { ...p, ordenes: Array.isArray(p.ordenes) ? p.ordenes : [] }
    }
    return {
      ...p,
      estado: boardItem.estado || p.estado,
      ordenes: Array.isArray(boardItem.ordenes) ? boardItem.ordenes : [],
      ordenesConXml: boardItem.ordenesConXml,
      totalOrdenes: boardItem.totalOrdenes ?? p.cantidadOrdenes,
    }
  })
}

function mapTreeOrders(tree) {
  const orders = Array.isArray(tree?.orders) ? tree.orders : []
  return orders.map((o) => ({
    ordenId: o.id,
    codigo: o.codigo,
    biesseOrderId: o.biesseOrderId ?? o.biesse_order_id ?? null,
    biesseOrderName: o.biesseOrderName ?? o.biesse_order_name ?? null,
    opCodigo: o.opCodigo ?? o.op_codigo ?? null,
    estadoEscaneo: o.estadoEscaneo ?? o.estado_escaneo ?? null,
  }))
}

async function fillMissingOrdenes(projects) {
  const missing = projects.filter(
    (p) => (Number(p.cantidadOrdenes) > 0 || Number(p.totalOrdenes) > 0) && !(p.ordenes?.length > 0),
  )
  if (!missing.length) return projects

  const trees = await Promise.all(
    missing.map(async (p) => {
      try {
        const tree = await getProyectoOptimizacion(p.id)
        return [String(p.id), mapTreeOrders(tree)]
      } catch {
        return [String(p.id), []]
      }
    }),
  )
  const byId = new Map(trees)
  return projects.map((p) => {
    const ordenes = byId.get(String(p.id))
    if (!ordenes) return p
    return {
      ...p,
      ordenes,
      totalOrdenes: ordenes.length || p.totalOrdenes || p.cantidadOrdenes,
      ordenesConXml: ordenes.filter((o) => o.biesseOrderId != null).length,
    }
  })
}

function OrdenesDelProyecto({ project }) {
  const ordenes = Array.isArray(project.ordenes) ? project.ordenes : []
  const expected = Number(project.totalOrdenes ?? project.cantidadOrdenes ?? 0)

  if (!ordenes.length) {
    if (expected > 0) {
      return <p className="muted small mt-3 mb-0">No se pudo cargar el detalle de las órdenes.</p>
    }
    return <p className="muted small mt-3 mb-0">Sin órdenes registradas.</p>
  }

  return (
    <div className="proyecto-ordenes">
      <div className="proyecto-ordenes__title">
        <span>Órdenes · avance de producción</span>
      </div>
      <ul className="proyecto-ordenes__list">
        {ordenes.map((orden) => {
          const name =
            orden.biesseOrderName ||
            orden.codigo ||
            (orden.ordenId != null ? `Orden #${orden.ordenId}` : 'Orden')
          const estadoOrden = resolveEstadoOrdenCliente(project.estado, orden)
          return (
            <li
              key={orden.ordenId ?? `${project.id}-${orden.biesseOrderId}-${name}`}
              className="proyecto-ordenes__item"
            >
              <div className="proyecto-ordenes__head">
                <strong className="proyecto-ordenes__name" title={name}>
                  {name}
                </strong>
                <span className={estadoOrdenClienteTagClass(estadoOrden)}>
                  {formatEstadoOrdenCliente(estadoOrden)}
                </span>
              </div>
              {orden.codigo && orden.codigo !== name ? (
                <div className="proyecto-ordenes__meta">
                  <span className="muted small">{orden.codigo}</span>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function ProyectosPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [filters, setFilters] = useState(emptyProyectoFilters())
  const [applied, setApplied] = useState(emptyProyectoFilters())
  const [planoViewer, setPlanoViewer] = useState(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await listProyectosOptimizacion()
      let board = []
      try {
        board = await listSeguimientoProyectosBoard()
      } catch {
        board = []
      }
      const merged = mergeProjectsWithBoard(Array.isArray(list) ? list : [], board)
      setProjects(await fillMissingOrdenes(merged))
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
        <Link to={`/app/planilla-corte/${project.id}`} className="btn btn--primary btn--sm">
          Ver detalle
        </Link>
        {canDownloadCotizacion(project) ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={busyId === project.id}
            onClick={() => void handleDownloadCotizacion(project)}
          >
            {busyId === project.id ? 'Descargando…' : 'Cotización'}
          </button>
        ) : null}
        {canViewPlano(project) ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPlanoViewer({ id: project.id, nombre: project.nombre })}
          >
            Planos
          </button>
        ) : null}
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
    const total = project.totalOrdenes ?? project.cantidadOrdenes ?? 0
    const estadoProyecto = normalizeEstadoCodigo(project.estado) || project.estado
    return (
      <article key={project.id} className="project-card project-card--seguimiento">
        <div className="project-card__head">
          <div className="project-card__title-wrap">
            <h2 className="project-card__title">{project.nombre}</h2>
            <p className="project-card__meta muted small">
              {total} orden{total === 1 ? '' : 'es'} · {formatProyectoDate(project.fechaCreacion)}
            </p>
          </div>
          <EstadoTag estado={estadoProyecto} />
        </div>

        <div className="project-card__section">
          <p className="project-card__section-label">Estado del proyecto</p>
          {!isProyectoCancelado(project) ? (
            <ProyectoFlujoBar estado={estadoProyecto} compact />
          ) : (
            <p className="muted small mb-0">Proyecto cancelado</p>
          )}
        </div>

        {project.descripcion ? (
          <p className="project-card__desc line-clamp-2">{project.descripcion}</p>
        ) : null}

        {!isProyectoCancelado(project) ? (
          <div className="project-card__section">
            <OrdenesDelProyecto project={{ ...project, estado: estadoProyecto }} />
          </div>
        ) : null}

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
              Estado por orden, agrupado por proyecto. El proyecto avanza solo cuando{' '}
              <strong>todas</strong> las órdenes llegan.
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
          <button
            type="button"
            className="btn btn--ghost"
            disabled={loading}
            onClick={() => void loadProjects()}
          >
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
        <div className="project-grid project-grid--seguimiento">
          {filtered.map((p) => renderProyectoCard(p))}
        </div>
      )}

      <PlanoViewerModal
        open={Boolean(planoViewer)}
        proyectoId={planoViewer?.id}
        proyectoNombre={planoViewer?.nombre}
        onClose={() => setPlanoViewer(null)}
      />
    </div>
  )
}
