import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PlanillaOrdenDetallePanel } from '../../components/planilla/PlanillaOrdenDetallePanel'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { formatEstado, isPersistedProjectId, planillaOrderDetallePath } from '../../planilla/helpers'

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
    updateProjectDraft,
    activateProject,
    updateOrderDraft,
    addOrder,
    removeOrder,
    saveAllToDatabase,
  } = usePlanillaDraft()

  const totalDetalles = useMemo(
    () => orders.reduce((sum, order) => sum + order.detalles.length, 0),
    [orders],
  )
  const totalPiezas = useMemo(
    () => orders.reduce((sum, order) => sum + orderPiezas(order), 0),
    [orders],
  )

  const readOnly = !projectEditable && Boolean(editingId)
  const modalOpen = Boolean(orderId)

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

  const step1Done = Boolean(project)
  const canSave = projectEditable && !readOnly && !isPersistedProjectId(project?.id)

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
                {readOnly
                  ? 'Proyecto enviado a ventas. Puede revisar el detalle pero no modificarlo.'
                  : 'Configure el proyecto y las órdenes; abra el detalle de cada orden para capturar piezas.'}
              </p>
              {projectEstado ? (
                <p className="small mt-2">
                  Estado: <span className="tag">{formatEstado(projectEstado)}</span>
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
              <button type="button" className="btn btn--primary" onClick={activateProject}>
                {project ? 'Actualizar borrador' : 'Activar proyecto'}
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
                        <strong>{order.codigo}</strong>
                        <span className="tag">
                          {order.detalles.length} filas · {orderPiezas(order)} pzas
                        </span>
                      </div>
                      <p className="small muted">{order.descripcion || 'Sin descripción'}</p>
                      <div className="order-card__actions">
                        <button
                          type="button"
                          className={`btn btn--sm ${String(order.id) === String(orderId) ? 'btn--primary' : 'btn--ghost'}`}
                          onClick={() => openDetalle(order)}
                        >
                          {String(order.id) === String(orderId)
                            ? 'Editando…'
                            : readOnly
                              ? 'Ver detalle'
                              : order.detalles.length
                                ? 'Editar detalle'
                                : 'Capturar detalle'}
                        </button>
                        {!readOnly ? (
                          <button type="button" className="btn btn--ghost" onClick={() => removeOrder(order.id)}>
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
            <h2 className="card__title mb-3">Resumen y envío</h2>
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
    </>
  )
}
