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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyecto…</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4">
              <Link to="/app/proyectos" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver a proyectos
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {editingId ? 'Editar planilla de corte' : 'Nuevo proyecto'}
            </h1>
            <p className="text-gray-600">
              Defina el proyecto, agregue órdenes y capture el detalle de piezas. El cliente se asigna automáticamente con su sesión.
            </p>
          </div>

          {/* Paso 1: Proyecto */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Paso 1 · Proyecto</h2>

            {catalogLoading && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-700">Cargando catálogo…</p>
                </div>
            )}

            {catalogError && (
                <div className="mb-4 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">{catalogError}</p>
                </div>
            )}

            {!catalogLoading && !tableros.length && (
                <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-700">No hay tableros en catálogo (Inventario → Tableros en empleados).</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del proyecto
                </label>
                <input
                    type="text"
                    value={projectDraft.nombre}
                    onChange={(e) => updateProjectDraft('nombre', e.target.value)}
                    placeholder="Cocina Integral #204"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                    type="text"
                    value={projectDraft.descripcion}
                    onChange={(e) => updateProjectDraft('descripcion', e.target.value)}
                    placeholder="Notas generales"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
                type="button"
                onClick={createProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {project ? 'Actualizar borrador' : 'Activar proyecto'}
            </button>

            {project && (
                <p className="mt-3 text-sm text-gray-600">
                  Proyecto activo: <strong className="text-gray-900">{project.nombre}</strong>
                </p>
            )}

            {saveError && (
                <div className="mt-3 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
            )}

            {saveOk && (
                <div className="mt-3 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-700">{saveOk}</p>
                </div>
            )}
          </div>

          {/* Paso 2: Órdenes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Paso 2 · Órdenes</h2>

            {!project ? (
                <div className="p-4 bg-yellow-50 rounded-md">
                  <p className="text-yellow-700">Active el proyecto para registrar órdenes.</p>
                </div>
            ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Código de orden
                      </label>
                      <input
                          type="text"
                          value={orderDraft.codigo}
                          onChange={(e) => updateOrderDraft('codigo', e.target.value)}
                          placeholder="ORD-001"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <input
                          type="text"
                          value={orderDraft.descripcion}
                          onChange={(e) => updateOrderDraft('descripcion', e.target.value)}
                          placeholder="Descripción de la orden"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                      type="button"
                      onClick={createOrder}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors mb-6"
                  >
                    + Agregar orden
                  </button>

                  {!orders.length ? (
                      <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-md">
                        <p className="text-gray-500">Aún no hay órdenes.</p>
                      </div>
                  ) : (
                      /* Tabla de órdenes - siempre visible */
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piezas</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                          </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order) => {
                            const piezas = order.detalles.reduce((sum, d) => {
                              const qty = Number(d.cantidad || 0)
                              return Number.isFinite(qty) ? sum + qty : sum
                            }, 0)
                            return (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.codigo}</td>
                                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{order.descripcion || '—'}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.detalles.length}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{piezas}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex gap-2">
                                      <button
                                          type="button"
                                          onClick={() => openDetalleModal(order)}
                                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                      >
                                        Ver detalle
                                      </button>
                                      <button
                                          type="button"
                                          onClick={() => removeOrder(order.id)}
                                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                      >
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
                  )}
                </>
            )}
          </div>

          {/* Modal de Detalle */}
          {activeOrder && (
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
          )}

          {/* Resumen y guardado */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">Órdenes</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrdenes}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Detalles</p>
                <p className="text-2xl font-bold text-gray-900">{totalDetalles}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Piezas</p>
                <p className="text-2xl font-bold text-gray-900">{totalPiezas}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                  type="button"
                  onClick={() => void saveAllToDatabase()}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar en servidor'}
              </button>
              {isPersistedProjectId(project?.id) && (
                  <Link to="/app/proyectos" className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                    Volver a proyectos
                  </Link>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}