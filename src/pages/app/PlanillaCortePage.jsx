import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchPlanillaCatalogos, getProyectoOptimizacion, saveProyectoCompleto } from '../../api/orderApi'
import { PlanillaDetalleModal } from '../../components/planilla/PlanillaDetalleModal'
import {
  isPersistedProjectId,
  mapDetalleToApiPayload,
  mapOrdersFromApi,
  mergeCantoOptions,
  newDetalle,
  newOrderDraft,
  newProjectDraft,
} from '../../planilla/helpers'

export default function PlanillaCortePage() {
  const { projectId: projectIdParam } = useParams()
  const navigate = useNavigate()
  const editingId = projectIdParam && projectIdParam !== 'nuevo' ? Number(projectIdParam) : null

  const [projectDraft, setProjectDraft] = useState(newProjectDraft())
  const [project, setProject] = useState(null)
  const [orderDraft, setOrderDraft] = useState(newOrderDraft())
  const [orders, setOrders] = useState([])
  const [loadingProject, setLoadingProject] = useState(Boolean(editingId))
  const [activeOrderId, setActiveOrderId] = useState(null)
  const [modalRows, setModalRows] = useState([newDetalle()])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState('')
  const [tableros, setTableros] = useState([])
  const [cantos, setCantos] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  const cantoOptions = useMemo(() => mergeCantoOptions(cantos), [cantos])

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) || null,
    [orders, activeOrderId],
  )

  const totalOrdenes = orders.length
  const totalDetalles = useMemo(
    () => orders.reduce((sum, order) => sum + order.detalles.length, 0),
    [orders],
  )
  const totalPiezas = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum +
          order.detalles.reduce((inner, detalle) => {
            const qty = Number(detalle.cantidad || 0)
            return Number.isFinite(qty) ? inner + qty : inner
          }, 0),
        0,
      ),
    [orders],
  )

  const loadProject = useCallback(async (id) => {
    setLoadingProject(true)
    setSaveError('')
    try {
      const response = await getProyectoOptimizacion(id)
      const savedProject = response?.project
      if (!savedProject) {
        setSaveError('No se pudo cargar el proyecto.')
        return
      }
      setProject({
        id: savedProject.id,
        nombre: savedProject.nombre || '',
        descripcion: savedProject.descripcion || '',
        creadoEn: savedProject.fechaCreacion,
      })
      setProjectDraft({
        nombre: savedProject.nombre || '',
        descripcion: savedProject.descripcion || '',
      })
      setOrders(mapOrdersFromApi(response.orders))
    } catch (err) {
      setSaveError(err.message || 'No se pudo cargar el proyecto.')
    } finally {
      setLoadingProject(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCatalogLoading(true)
      setCatalogError('')
      try {
        const catalog = await fetchPlanillaCatalogos()
        if (!cancelled) {
          setTableros(Array.isArray(catalog?.tableros) ? catalog.tableros : [])
          setCantos(Array.isArray(catalog?.cantos) ? catalog.cantos : [])
        }
      } catch (err) {
        if (!cancelled) {
          setTableros([])
          setCantos([])
          setCatalogError(err.message || 'No se pudo cargar el catálogo.')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (editingId && Number.isFinite(editingId)) {
      void loadProject(editingId)
      return
    }
    setProject(null)
    setProjectDraft(newProjectDraft())
    setOrders([])
    setLoadingProject(false)
  }, [editingId, loadProject])

  function updateProjectDraft(key, value) {
    setProjectDraft((prev) => ({ ...prev, [key]: value }))
  }

  function createProject() {
    if (!projectDraft.nombre.trim()) return
    const persistedId = project?.id && isPersistedProjectId(project.id) ? project.id : Date.now()
    setProject({
      ...projectDraft,
      id: persistedId,
      creadoEn: project?.creadoEn || new Date().toISOString(),
    })
    setSaveError('')
    setSaveOk('')
  }

  function updateOrderDraft(key, value) {
    setOrderDraft((prev) => ({ ...prev, [key]: value }))
  }

  function createOrder() {
    if (!project || !orderDraft.codigo.trim()) return
    setOrders((prev) => [
      ...prev,
      {
        id: Date.now(),
        codigo: orderDraft.codigo.trim(),
        descripcion: orderDraft.descripcion.trim(),
        detalles: [],
      },
    ])
    setOrderDraft(newOrderDraft())
    setSaveError('')
    setSaveOk('')
  }

  function removeOrder(orderId) {
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
    if (activeOrderId === orderId) {
      setActiveOrderId(null)
      setModalRows([newDetalle()])
    }
  }

  function openDetalleModal(order) {
    setActiveOrderId(order.id)
    setModalRows(order.detalles.length ? order.detalles : [newDetalle()])
  }

  function closeDetalleModal() {
    setActiveOrderId(null)
    setModalRows([newDetalle()])
  }

  function addModalRow() {
    setModalRows((prev) => [...prev, newDetalle()])
  }

  function removeModalRow(index) {
    setModalRows((prev) => prev.filter((_, i) => i !== index))
  }

  function updateModalRow(index, key, value) {
    setModalRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }

  function saveDetalles() {
    if (!activeOrder) return
    setOrders((prev) =>
      prev.map((order) => (order.id === activeOrder.id ? { ...order, detalles: modalRows } : order)),
    )
    closeDetalleModal()
    setSaveError('')
    setSaveOk('')
  }

  async function saveAllToDatabase() {
    if (!project) {
      setSaveError('Primero debe crear el proyecto.')
      return
    }
    if (!orders.length) {
      setSaveError('Debe agregar al menos una orden.')
      return
    }
    setSaveError('')
    setSaveOk('')
    setSaving(true)
    try {
      const response = await saveProyectoCompleto({
        projectId: isPersistedProjectId(project.id) ? project.id : null,
        project: {
          nombre: project.nombre,
          descripcion: project.descripcion,
        },
        orders: orders.map((order) => ({
          codigo: order.codigo,
          descripcion: order.descripcion,
          detalles: order.detalles.map(mapDetalleToApiPayload),
        })),
      })
      const savedProject = response?.project
      if (savedProject) {
        setProject({
          id: savedProject.id,
          nombre: savedProject.nombre || project.nombre,
          descripcion: savedProject.descripcion || project.descripcion,
          creadoEn: savedProject.fechaCreacion || project.creadoEn,
        })
        if (!isPersistedProjectId(project.id) && savedProject.id) {
          navigate(`/app/planilla-corte/${savedProject.id}`, { replace: true })
        }
      }
      setOrders(mapOrdersFromApi(response?.orders))
      setSaveOk('Proyecto guardado correctamente.')
    } catch (err) {
      setSaveError(err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loadingProject) {
    return (
      <div className="card pad">
        <p className="muted">Cargando proyecto…</p>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <header className="page__head">
        <div className="page__head-row">
          <div>
            <p className="small mb-2">
              <Link to="/app/proyectos" className="breadcrumb-link">
                ← Proyectos
              </Link>
            </p>
            <h1>{editingId ? 'Editar planilla de corte' : 'Nuevo proyecto'}</h1>
            <p className="page__lead">
              Defina el proyecto, agregue órdenes y capture el detalle de piezas. El cliente se asigna
              automáticamente con su sesión.
            </p>
          </div>
        </div>
      </header>

      <section className="card pad">
        <h2 className="card__title mb-4">Paso 1 · Proyecto</h2>
        {catalogLoading ? <p className="muted small mb-3">Cargando catálogo…</p> : null}
        {catalogError ? <p className="form-error small mb-3">{catalogError}</p> : null}
        {!catalogLoading && !tableros.length ? (
          <p className="muted small mb-3">
            No hay tableros en catálogo (Inventario → Tableros en empleados).
          </p>
        ) : null}
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
          <button type="button" className="btn primary" onClick={createProject}>
            {project ? 'Actualizar borrador' : 'Activar proyecto'}
          </button>
        </div>
        {project ? (
          <p className="muted small mt-2">
            Proyecto activo: <strong>{project.nombre}</strong>
          </p>
        ) : null}
        {saveError ? <p className="form-error mt-2">{saveError}</p> : null}
        {saveOk ? <p className="form-ok mt-2">{saveOk}</p> : null}
      </section>

      <section className="card pad">
        <h2 className="card__title mb-4">Paso 2 · Órdenes</h2>
        {!project ? (
          <p className="muted">Active el proyecto para registrar órdenes.</p>
        ) : (
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
              <button type="button" className="btn primary" onClick={createOrder}>
                Agregar orden
              </button>
            </div>

            {!orders.length ? (
              <p className="muted mt-4">Aún no hay órdenes.</p>
            ) : (
              <>
                <div className="order-list md:hidden">
                  {orders.map((order) => {
                    const piezas = order.detalles.reduce((sum, d) => {
                      const qty = Number(d.cantidad || 0)
                      return Number.isFinite(qty) ? sum + qty : sum
                    }, 0)
                    return (
                      <article key={order.id} className="order-card">
                        <div className="order-card__head">
                          <strong>{order.codigo}</strong>
                          <span className="tag">{order.detalles.length} filas · {piezas} pzas</span>
                        </div>
                        <p className="small muted">{order.descripcion || 'Sin descripción'}</p>
                        <div className="order-card__actions">
                          <button type="button" className="btn secondary" onClick={() => openDetalleModal(order)}>
                            Detalle
                          </button>
                          <button type="button" className="btn secondary" onClick={() => removeOrder(order.id)}>
                            Quitar
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>

                <div className="card card--table hidden md:block mt-4">
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Orden</th>
                          <th>Descripción</th>
                          <th>Detalles</th>
                          <th>Piezas</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => {
                          const piezas = order.detalles.reduce((sum, d) => {
                            const qty = Number(d.cantidad || 0)
                            return Number.isFinite(qty) ? sum + qty : sum
                          }, 0)
                          return (
                            <tr key={order.id}>
                              <td>{order.codigo}</td>
                              <td className="max-w-xs truncate">{order.descripcion || '—'}</td>
                              <td>{order.detalles.length}</td>
                              <td>{piezas}</td>
                              <td>
                                <div className="planilla-inline-actions">
                                  <button type="button" className="btn secondary" onClick={() => openDetalleModal(order)}>
                                    Detalle
                                  </button>
                                  <button type="button" className="btn secondary" onClick={() => removeOrder(order.id)}>
                                    Quitar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {activeOrder ? (
        <PlanillaDetalleModal
          order={activeOrder}
          rows={modalRows}
          tableros={tableros}
          cantoOptions={cantoOptions}
          onClose={closeDetalleModal}
          onSave={saveDetalles}
          onAddRow={addModalRow}
          onUpdateRow={updateModalRow}
          onRemoveRow={removeModalRow}
        />
      ) : null}

      <section className="card pad">
        <h2 className="card__title mb-3">Resumen</h2>
        <p className="muted">
          Órdenes: <strong>{totalOrdenes}</strong> · Detalles: <strong>{totalDetalles}</strong> · Piezas:{' '}
          <strong>{totalPiezas}</strong>
        </p>
        <div className="form-actions">
          <button type="button" className="btn primary" onClick={() => void saveAllToDatabase()} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar en servidor'}
          </button>
          {isPersistedProjectId(project?.id) ? (
            <Link to="/app/proyectos" className="btn secondary">
              Volver a proyectos
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  )
}
