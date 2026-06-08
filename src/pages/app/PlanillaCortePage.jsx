import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchPlanillaCatalogos, getProyectoOptimizacion, saveProyectoCompleto } from '../../api/orderApi'
import {
  isPersistedProjectId,
  mapDetalleToApiPayload,
  mapOrdersFromApi,
  mergeCantoOptions,
  newDetalle,
  newOrderDraft,
  newProjectDraft,
} from '../../planilla/helpers'

// Componente Modal mejorado integrado directamente
function PlanillaDetalleModal({
                                order,
                                rows,
                                tableros,
                                cantoOptions,
                                onClose,
                                onSave,
                                onAddRow,
                                onUpdateRow,
                                onRemoveRow,
                              }) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay oscuro */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        {/* Modal - más ancho para tabla completa */}
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Detalle de orden</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Orden: <span className="font-medium text-blue-600">{order?.codigo}</span>
                  {order?.descripcion && (
                      <span className="ml-2 text-gray-500">- {order.descripcion}</span>
                  )}
                </p>
              </div>
              <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo del modal con scroll */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">

              {/* Botón agregar pieza */}
              <div className="mb-6">
                <button
                    onClick={onAddRow}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar pieza
                </button>
              </div>

              {/* Tabla de piezas - VERSIÓN COMPLETA Y LEGIBLE */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tablero
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cant.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Largo (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ancho (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Veta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L1 (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L2 (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      A1 (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      A2 (cm)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Canto Lado 1
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Canto Lado 2
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {rows.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          No hay piezas agregadas. Haga clic en "Agregar pieza" para comenzar.
                        </td>
                      </tr>
                  ) : (
                      rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            {/* Tablero */}
                            <td className="px-4 py-3">
                              <input
                                  type="text"
                                  value={row.tablero || ''}
                                  onChange={(e) => onUpdateRow(idx, 'tablero', e.target.value)}
                                  placeholder="Buscar tablero..."
                                  className="w-40 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  list={`tableros-${idx}`}
                              />
                              <datalist id={`tableros-${idx}`}>
                                {tableros.map(t => (
                                    <option key={t.id} value={t.nombre} />
                                ))}
                              </datalist>
                            </td>

                            {/* Cantidad */}
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.cantidad || ''}
                                  onChange={(e) => onUpdateRow(idx, 'cantidad', e.target.value)}
                                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min="1"
                                  step="1"
                              />
                            </td>

                            {/* Largo */}
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.largo || ''}
                                  onChange={(e) => onUpdateRow(idx, 'largo', e.target.value)}
                                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  placeholder="cm"
                              />
                            </td>

                            {/* Ancho */}
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.ancho || ''}
                                  onChange={(e) => onUpdateRow(idx, 'ancho', e.target.value)}
                                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  placeholder="cm"
                              />
                            </td>

                            {/* Veta */}
                            <td className="px-4 py-3">
                              <select
                                  value={row.veta || ''}
                                  onChange={(e) => onUpdateRow(idx, 'veta', e.target.value)}
                                  className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Seleccionar</option>
                                <option value="horizontal">Horizontal</option>
                                <option value="vertical">Vertical</option>
                              </select>
                            </td>

                            {/* Medidas L1, L2, A1, A2 */}
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.l1 || ''}
                                  onChange={(e) => onUpdateRow(idx, 'l1', e.target.value)}
                                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  placeholder="cm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.l2 || ''}
                                  onChange={(e) => onUpdateRow(idx, 'l2', e.target.value)}
                                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  placeholder="cm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.a1 || ''}
                                  onChange={(e) => onUpdateRow(idx, 'a1', e.target.value)}
                                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  placeholder="cm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                  type="number"
                                  value={row.a2 || ''}
                                  onChange={(e) => onUpdateRow(idx, 'a2', e.target.value)}
                                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  step="0.1"
                                  placeholder="cm"
                              />
                            </td>

                            {/* Cantidad de cantos */}
                            <td className="px-4 py-3">
                              <select
                                  value={row.cantidadLado1 || ''}
                                  onChange={(e) => onUpdateRow(idx, 'cantidadLado1', e.target.value)}
                                  className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Seleccionar canto</option>
                                {cantoOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                  value={row.cantidadLado2 || ''}
                                  onChange={(e) => onUpdateRow(idx, 'cantidadLado2', e.target.value)}
                                  className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Seleccionar canto</option>
                                {cantoOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                ))}
                              </select>
                            </td>

                            {/* Acciones */}
                            <td className="px-4 py-3 text-center">
                              <button
                                  onClick={() => onRemoveRow(idx)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Eliminar pieza"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                      ))
                  )}
                  </tbody>
                </table>
              </div>

              {/* Nota informativa */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Los cambios se aplican a la orden al guardar el detalle. Complete toda la información necesaria antes de guardar.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white">
              <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                  onClick={onSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Guardar detalle
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}

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
    setSaveOk('Guardado localmente. Recuerde guardar en servidor.')
    setTimeout(() => setSaveOk(''), 3000)
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
      setSaveOk('Proyecto guardado correctamente en el servidor.')
      setTimeout(() => setSaveOk(''), 3000)
    } catch (err) {
      setSaveError(err.message || 'No se pudo guardar.')
      setTimeout(() => setSaveError(''), 5000)
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