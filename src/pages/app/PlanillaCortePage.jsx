import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { downloadProyectoCotizacion, cancelProyectoOptimizacion, findProyectoByNombre } from '../../api/orderApi'
import { canDownloadCotizacion, canViewPlano, isProyectoCancelado } from '../../planilla/proyectoListUtils'
import { PlanillaOrdenDetallePanel } from '../../components/planilla/PlanillaOrdenDetallePanel'
import { PlanoViewerModal } from '../../components/planilla/PlanoViewerModal'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { isPersistedProjectId, planillaOrderDetallePath } from '../../planilla/helpers'
import { EstadoTag } from '../../components/EstadoTag'

function StepBadge({ step, label, active, done }) {
  return (
    <div
      className={`planilla-step ${active ? 'planilla-step--active' : ''} ${done ? 'planilla-step--done' : ''}`}
    >
      <span className="planilla-step__num">{step}</span>
      <span className="planilla-step__label">{label}</span>
    </div>
  )
}

function orderPiezas(order) {
  return order.detalles.reduce((sum, d) => {
    const qty = Number(d.cantidad || 0)
    return Number.isFinite(qty) ? sum + qty : sum
  }, 0)
}

export default function PlanillaCortePage() {
  const { projectId, orderId } = useParams()
  const navigate = useNavigate()
  const editingId = projectId && projectId !== 'nuevo' ? Number(projectId) : null
  const [busyCotizacion, setBusyCotizacion] = useState(false)
  const [cotizacionError, setCotizacionError] = useState('')
  const [busyCancel, setBusyCancel] = useState(false)
  const [activating, setActivating] = useState(false)
  const [duplicateProject, setDuplicateProject] = useState(null)
  const [planoViewerOpen, setPlanoViewerOpen] = useState(false)

  const {
    project,
    projectDraft,
    orderDraft,
    orders,
    loadingProject,
    saving,
    saveError,
    saveOk,
    catalogLoading,
    catalogError,
    tableros,
    projectEditable,
    projectEstado,
    setSaveError,
    updateProjectDraft,
    activateProject,
    updateOrderDraft,
    addOrder,
    removeOrder,
    updateOrderMeta,
    saveAllToDatabase,
    maquinas,
    maquinaId,
    updateMaquinaSelection,
  } = usePlanillaDraft()

  const totalDetalles = useMemo(
    () => orders.reduce((sum, order) => sum + order.detalles.length, 0),
    [orders],
  )
  const totalPiezas = useMemo(
    () => orders.reduce((sum, order) => sum + orderPiezas(order), 0),
    [orders],
  )

  const readOnly =
    Boolean(editingId) ||
    (project && isPersistedProjectId(project.id)) ||
    !projectEditable ||
    isProyectoCancelado(projectEstado)
  const modalOpen = Boolean(orderId)
  const canSave = projectEditable && !readOnly && Boolean(project)

  async function handleActivateProject() {
    if (!projectDraft.nombre.trim()) return
    setSaveError('')
    setActivating(true)
    try {
      const currentId = project?.id && isPersistedProjectId(project.id) ? project.id : null
      let existing = null
      try {
        existing = await findProyectoByNombre(projectDraft.nombre)
      } catch (err) {
        setSaveError(err.message || 'No se pudo verificar el nombre del proyecto.')
        return
      }
      if (existing?.id && existing.id !== currentId) {
        setDuplicateProject(existing)
        return
      }
      activateProject()
    } catch (err) {
      setSaveError(err.message || 'No se pudo verificar el nombre del proyecto.')
    } finally {
      setActivating(false)
    }
  }

  function handleUseOtherName() {
    setDuplicateProject(null)
    updateProjectDraft('nombre', '')
  }

  function handleViewExistingProject() {
    if (!duplicateProject?.id) return
    setDuplicateProject(null)
    navigate(`/app/planilla-corte/${duplicateProject.id}`)
  }

  function handleAddOrder() {
    if (readOnly) return
    addOrder()
  }

  function openDetalle(order) {
    if (!project) return
    navigate(planillaOrderDetallePath(project, order.id))
  }

  if (loadingProject) {
    return (
      <div className="card pad flex items-center gap-4">
        <div className="app-loading__spinner h-8 w-8" aria-hidden />
        <p className="muted">Cargando proyecto…</p>
      </div>
    )
  }

  const canCancelProject =
    project?.id &&
    (projectEstado === 'ENVIADO' || projectEstado === 'EN_ATENCION')

  async function handleCancelProject() {
    if (!project?.id) return
    const nombre = project.nombre || `proyecto ${project.id}`
    if (!window.confirm(`¿Cancelar el proyecto «${nombre}»?`)) return
    setSaveError('')
    setBusyCancel(true)
    try {
      await cancelProyectoOptimizacion(project.id)
      navigate('/app/proyectos')
    } catch (err) {
      setSaveError(err.message || 'No se pudo cancelar el proyecto.')
    } finally {
      setBusyCancel(false)
    }
  }

  const step1Done = Boolean(project)

  return (
    <>
      <div className="page-stack">
        <header className="page__head">
          <div className="page__head-row">
            <div>
              <p className="small mb-2">
                <Link to="/app/proyectos" className="breadcrumb-link">
                  ← Proyectos
                </Link>
              </p>
              <h1>{readOnly ? 'Consultar proyecto' : editingId ? 'Planilla de corte' : 'Nuevo proyecto'}</h1>
              <p className="page__lead">
                {isProyectoCancelado(projectEstado)
                  ? 'Proyecto cancelado. Solo puede consultar el detalle.'
                  : readOnly
                  ? 'Proyecto enviado a ventas. Puede revisar el detalle pero no modificarlo.'
                  : 'Configure el proyecto y las órdenes; abra el detalle de cada orden para capturar piezas.'}
              </p>
              {projectEstado ? (
                <p className="small mt-2 flex flex-wrap items-center gap-2">
                  <span>Estado:</span> <EstadoTag estado={projectEstado} />
                  {readOnly && canDownloadCotizacion({ estado: projectEstado, cotizacionArchivo: project?.cotizacionArchivo }) && project?.id ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={busyCotizacion}
                      onClick={async () => {
                        setBusyCotizacion(true)
                        setCotizacionError('')
                        try {
                          const safe = (project.nombre || 'proyecto').replace(/[^\w.-]+/g, '_')
                          await downloadProyectoCotizacion(project.id, safe)
                        } catch (err) {
                          setCotizacionError(err.message || 'No se pudo descargar la cotización.')
                        } finally {
                          setBusyCotizacion(false)
                        }
                      }}
                    >
                      Descargar cotización
                    </button>
                  ) : null}
                  {readOnly &&
                  canViewPlano({
                    tienePlano: project?.tienePlano,
                    planoArchivo: project?.planoArchivo,
                  }) &&
                  project?.id ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setPlanoViewerOpen(true)}
                    >
                      Ver planos
                    </button>
                  ) : null}
                  {cotizacionError ? (
                    <span className="small form-error">{cotizacionError}</span>
                  ) : null}
                  {canCancelProject ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={busyCancel}
                      style={{ color: 'var(--danger, #b00020)' }}
                      onClick={() => void handleCancelProject()}
                    >
                      Cancelar proyecto
                    </button>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>

          {!readOnly ? (
            <div className="planilla-steps" aria-label="Pasos del flujo">
              <StepBadge step={1} label="Proyecto" active={!step1Done} done={step1Done} />
              <span className="planilla-steps__line" aria-hidden />
              <StepBadge step={2} label="Órdenes" active={step1Done && !orders.length} done={orders.length > 0} />
              <span className="planilla-steps__line" aria-hidden />
              <StepBadge step={3} label="Enviar" active={false} done={Boolean(saveOk) || readOnly} />
            </div>
          ) : null}
        </header>

        {!readOnly ? (
          <section className="card pad">
            <h2 className="card__title mb-4">Paso 1 · Proyecto</h2>
            {catalogLoading ? <p className="muted small mb-3">Cargando catálogo…</p> : null}
            {catalogError ? <p className="form-error small mb-3">{catalogError}</p> : null}
            <div className="form-row-2">
              <label className="field">
                <span>Nombre del proyecto</span>
                <input
                  value={projectDraft.nombre}
                  onChange={(e) => updateProjectDraft('nombre', e.target.value)}
                  placeholder="Cocina Integral #204"
                />
              </label>
              <label className="field">
                <span>Descripción</span>
                <input
                  value={projectDraft.descripcion}
                  onChange={(e) => updateProjectDraft('descripcion', e.target.value)}
                  placeholder="Notas generales"
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={activating}
                onClick={() => void handleActivateProject()}
              >
                {activating ? 'Verificando…' : project ? 'Actualizar borrador' : 'Activar proyecto'}
              </button>
            </div>
          </section>
        ) : null}

        <section className="card pad">
          <h2 className="card__title mb-4">{readOnly ? 'Órdenes' : 'Paso 2 · Órdenes'}</h2>
          {!project ? (
            <p className="muted">Active el proyecto para registrar órdenes.</p>
          ) : (
            <>
              {!readOnly ? (
                <>
                  <div className="form-row-2">
                    <label className="field">
                      <span>Código de orden</span>
                      <input
                        value={orderDraft.codigo}
                        onChange={(e) => updateOrderDraft('codigo', e.target.value)}
                        placeholder="ORD-001"
                      />
                    </label>
                    <label className="field">
                      <span>Descripción</span>
                      <input
                        value={orderDraft.descripcion}
                        onChange={(e) => updateOrderDraft('descripcion', e.target.value)}
                        placeholder="Descripción de la orden"
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={handleAddOrder}
                      disabled={!orderDraft.codigo.trim()}
                    >
                      Agregar orden
                    </button>
                  </div>
                </>
              ) : null}

              {!orders.length ? (
                <p className="muted mt-4">Aún no hay órdenes.</p>
              ) : (
                <div className="order-list mt-4">
                  {orders.map((order) => (
                    <article
                      key={order.id}
                      className={`order-card${String(order.id) === String(orderId) ? ' order-card--active' : ''}`}
                    >
                      <div className="order-card__head">
                        {!readOnly ? (
                          <input
                            className="planilla-input planilla-input--order-name"
                            value={order.codigo}
                            aria-label="Nombre de la orden"
                            onChange={(e) => updateOrderMeta(order.id, { codigo: e.target.value })}
                            onBlur={(e) => {
                              const codigo = e.target.value.trim()
                              if (!codigo) {
                                updateOrderMeta(order.id, { codigo: order.codigo?.trim() || 'ORD' })
                              } else {
                                updateOrderMeta(order.id, { codigo })
                              }
                            }}
                          />
                        ) : (
                          <strong>{order.codigo}</strong>
                        )}
                        <span className="tag">
                          {order.detalles.length} filas · {orderPiezas(order)} pzas
                        </span>
                      </div>
                      <div className="order-card__actions">
                        <button
                          type="button"
                          className={`btn btn--sm ${String(order.id) === String(orderId) ? 'btn--primary' : 'btn--ghost'}`}
                          onClick={() => openDetalle(order)}
                        >
                          {String(order.id) === String(orderId)
                            ? 'Editando…'
                            : readOnly || isProyectoCancelado(projectEstado)
                              ? 'Ver detalle'
                              : order.detalles.length
                                ? 'Editar detalle'
                                : 'Agregar detalle'}
                        </button>
                        {!readOnly ? (
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeOrder(order.id)}>
                            Quitar
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {!readOnly ? (
          <section className="card pad">
            <div className="planilla-summary-grid mb-4">
              <div className="planilla-summary-stat">
                <span className="planilla-summary-stat__label">Órdenes</span>
                <strong className="planilla-summary-stat__value">{orders.length}</strong>
              </div>
              <div className="planilla-summary-stat">
                <span className="planilla-summary-stat__label">Detalles</span>
                <strong className="planilla-summary-stat__value">{totalDetalles}</strong>
              </div>
              <div className="planilla-summary-stat">
                <span className="planilla-summary-stat__label">Piezas</span>
                <strong className="planilla-summary-stat__value">{totalPiezas}</strong>
              </div>
            </div>
            {saveError ? <p className="form-error mb-3">{saveError}</p> : null}
            {saveOk ? <p className="form-ok mb-3">{saveOk}</p> : null}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void saveAllToDatabase()}
                disabled={saving || !canSave || !orders.length}
              >
                {saving ? 'Enviando…' : 'Enviar a ventas'}
              </button>
            </div>
          </section>
        ) : null}

      </div>

      {modalOpen ? <PlanillaOrdenDetallePanel orderId={orderId} readOnly={readOnly} /> : null}

      <PlanoViewerModal
        open={planoViewerOpen}
        proyectoId={project?.id}
        proyectoNombre={project?.nombre || projectDraft?.nombre}
        onClose={() => setPlanoViewerOpen(false)}
      />

      {duplicateProject ? (
        <div className="planilla-modal-backdrop" role="presentation" onClick={() => setDuplicateProject(null)}>
          <div
            className="planilla-modal card pad"
            role="dialog"
            aria-labelledby="dup-project-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dup-project-title" className="card__title mb-3">
              Proyecto con el mismo nombre
            </h2>
            <p className="mb-4">
              Ya tiene un proyecto llamado «{duplicateProject.nombre}»
              {duplicateProject.estado ? ` (${duplicateProject.estado})` : ''}. Elija otro nombre o consulte el
              proyecto existente (solo lectura).
            </p>
            <div className="form-actions">
              <button type="button" className="btn btn--primary" onClick={handleViewExistingProject}>
                Ver proyecto existente
              </button>
              <button type="button" className="btn btn--ghost" onClick={handleUseOtherName}>
                Usar otro nombre
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setDuplicateProject(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
