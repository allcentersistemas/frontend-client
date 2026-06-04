import { useEffect, useMemo, useState } from 'react'
import {
  fetchPlanillaCatalogos,
  getProyectoOptimizacion,
  listProyectosOptimizacion,
  saveProyectoCompleto,
} from '../../api/orderApi'

// ----------------------------------------------
// 1. COMPONENTE DE SELECT CON BÚSQUEDA
// ----------------------------------------------
function SearchableSelect({ value, onChange, options, placeholder }) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    return options.filter(opt =>
        (opt.name || opt.sku || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  const selectedLabel = useMemo(() => {
    const selected = options.find(opt => opt.id === value || opt.name === value)
    return selected ? (selected.name || selected.sku || value) : placeholder || 'Seleccionar'
  }, [options, value, placeholder])

  return (
      <div className="relative w-full min-w-[120px]">
        <div
            className="border rounded px-2 py-1 cursor-pointer bg-white truncate"
            onClick={() => setIsOpen(!isOpen)}
        >
          {selectedLabel}
        </div>
        {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
              <input
                  type="text"
                  className="w-full p-1 border-b outline-none"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
              />
              {filteredOptions.length === 0 ? (
                  <div className="p-2 text-gray-400">Sin resultados</div>
              ) : (
                  filteredOptions.map(opt => (
                      <div
                          key={opt.id || opt.name}
                          className="p-2 hover:bg-gray-100 cursor-pointer truncate"
                          onClick={() => {
                            onChange(opt.id || opt.name)
                            setIsOpen(false)
                            setSearch('')
                          }}
                      >
                        {opt.name || opt.sku}
                      </div>
                  ))
              )}
            </div>
        )}
      </div>
  )
}

// ----------------------------------------------
// 2. FUNCIONES AUXILIARES
// ----------------------------------------------
function newDetalle() {
  return {
    tablero: '',
    cantidad: '',
    largoVeta: '',
    ancho: '',
    l1: '',
    l2: '',
    a1: '',
    a2: '',
    perforacionCantidad: '',
    perforacionLado1: '',
    perforacionLado2: '',
    ranuraDist: '',
    ranuraProf: '',
    ranuraEs: '',
    observado: false,
    observacion: '',
  }
}

function newProjectDraft() {
  return { nombre: '', descripcion: '' }
}

const CANTO_FALLBACK = [
  { id: 'delgado', name: 'DELGADO', sku: '' },
  { id: 'grueso', name: 'GRUESO', sku: '' },
]

function newOrderDraft() {
  return { codigo: '', descripcion: '' }
}

function isPersistedProjectId(id) {
  const n = Number(id)
  return Number.isFinite(n) && n > 0 && n < 1_000_000_000_000
}

function mapDetalleFromApi(detalle) {
  return {
    tablero: detalle.tablero || '',
    cantidad: detalle.cantidad || '',
    largoVeta: detalle.largoVeta || '',
    ancho: detalle.ancho || '',
    l1: detalle.l1 || '',
    l2: detalle.l2 || '',
    a1: detalle.a1 || '',
    a2: detalle.a2 || '',
    perforacionCantidad: detalle.perforacionCantidad || '',
    perforacionLado1: detalle.perforacionLado1 || '',
    perforacionLado2: detalle.perforacionLado2 || '',
    ranuraDist: detalle.ranuraDist || '',
    ranuraProf: detalle.ranuraProf || '',
    ranuraEs: detalle.ranuraEs || '',
    observado: Boolean(detalle.observado),
    observacion: detalle.observacion || '',
  }
}

function mapOrdersFromApi(savedOrders) {
  return (savedOrders || []).map((order) => ({
    id: order.id,
    codigo: order.codigo || '',
    descripcion: order.descripcion || '',
    detalles: (order.detalles || []).map(mapDetalleFromApi),
  }))
}

// ----------------------------------------------
// 3. COMPONENTE PRINCIPAL
// ----------------------------------------------
export default function PlanillaCortePage() {
  const [projectDraft, setProjectDraft] = useState(newProjectDraft())
  const [project, setProject] = useState(null)
  const [orderDraft, setOrderDraft] = useState(newOrderDraft())
  const [orders, setOrders] = useState([])
  const [savedProjects, setSavedProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingProjectId, setLoadingProjectId] = useState(null)
  const [activeOrderId, setActiveOrderId] = useState(null)
  const [modalRows, setModalRows] = useState([newDetalle()])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState('')
  const [tablerosKardex, setTablerosKardex] = useState([])
  const [cantosKardex, setCantosKardex] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  const cantoOptions = useMemo(() => {
    const merged = [...cantosKardex]
    for (const fb of CANTO_FALLBACK) {
      const key = fb.name.toUpperCase()
      if (!merged.some((o) => String(o.name || o.sku || '').toUpperCase() === key)) {
        merged.push(fb)
      }
    }
    return merged
  }, [cantosKardex])

  const activeOrder = useMemo(
      () => orders.find((order) => order.id === activeOrderId) || null,
      [orders, activeOrderId]
  )

  const totalOrdenes = orders.length
  const totalDetalles = useMemo(
      () => orders.reduce((sum, order) => sum + order.detalles.length, 0),
      [orders]
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
              0
          ),
      [orders]
  )

  // Cargar catálogos
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCatalogLoading(true)
      setCatalogError('')
      try {
        const catalog = await fetchPlanillaCatalogos()
        if (!cancelled) {
          setTablerosKardex(Array.isArray(catalog?.tableros) ? catalog.tableros : [])
          setCantosKardex(Array.isArray(catalog?.cantos) ? catalog.cantos : [])
        }
      } catch (err) {
        if (!cancelled) {
          setTablerosKardex([])
          setCantosKardex([])
          setCatalogError(err.message || 'No se pudo cargar el catálogo.')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Cargar proyectos guardados
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingProjects(true)
      try {
        const list = await listProyectosOptimizacion()
        if (!cancelled) setSavedProjects(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setSavedProjects([])
      } finally {
        if (!cancelled) setLoadingProjects(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function loadSavedProject(proyectoId) {
    setSaveError('')
    setSaveOk('')
    setLoadingProjectId(proyectoId)
    try {
      const response = await getProyectoOptimizacion(proyectoId)
      const savedProject = response?.project
      if (!savedProject) throw new Error('No se pudo cargar el proyecto.')
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
      setSaveOk('Proyecto cargado correctamente.')
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setLoadingProjectId(null)
    }
  }

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
    if (!project) return
    if (!orderDraft.codigo.trim()) return
    const order = {
      id: Date.now(),
      codigo: orderDraft.codigo.trim(),
      descripcion: orderDraft.descripcion.trim(),
      detalles: [],
    }
    setOrders((prev) => [...prev, order])
    setOrderDraft(newOrderDraft())
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
        prev.map((order) => (order.id === activeOrder.id ? { ...order, detalles: modalRows } : order))
    )
    closeDetalleModal()
    setSaveOk('Detalles guardados.')
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
          detalles: order.detalles,
        })),
      })
      const savedProject = response?.project
      const savedOrders = response?.orders || []
      if (savedProject) {
        setProject({
          id: savedProject.id,
          nombre: savedProject.nombre || project.nombre,
          descripcion: savedProject.descripcion || project.descripcion,
          creadoEn: savedProject.fechaCreacion || project.creadoEn,
        })
      }
      setOrders(mapOrdersFromApi(savedOrders))
      // Refrescar lista de proyectos
      const list = await listProyectosOptimizacion()
      setSavedProjects(Array.isArray(list) ? list : [])
      setSaveOk('Proyecto guardado correctamente.')
    } catch (err) {
      setSaveError(err.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  // ------------------------------------------------------------
  // RENDER PRINCIPAL (Responsive con Tailwind)
  // ------------------------------------------------------------
  return (
      <div className="p-4 md:p-6 space-y-6 max-w-full overflow-x-auto">
        {/* Encabezado */}
        <div className="border-b pb-2">
          <h1 className="text-2xl font-bold">Proyecto de corte</h1>
          <p className="text-gray-500 text-sm">
            Flujo sugerido: primero crea el proyecto, luego agrega órdenes y sus detalles.
          </p>
        </div>

        {/* Proyectos guardados */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Mis proyectos guardados</h2>
          {loadingProjects ? (
              <p className="text-gray-400">Cargando...</p>
          ) : !savedProjects.length ? (
              <p className="text-gray-400">No hay proyectos guardados.</p>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-left">Órdenes</th>
                    <th className="p-2 text-left">Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {savedProjects.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 truncate max-w-[150px]">{item.nombre}</td>
                        <td className="p-2 truncate max-w-[200px]">{item.descripcion || '-'}</td>
                        <td className="p-2">{item.cantidadOrdenes ?? 0}</td>
                        <td className="p-2">
                          <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                              disabled={loadingProjectId === item.id}
                              onClick={() => loadSavedProject(item.id)}
                          >
                            {loadingProjectId === item.id ? 'Cargando…' : 'Abrir'}
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>

        {/* Paso 1: Proyecto */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Paso 1: Proyecto</h2>
          {catalogLoading && <p className="text-gray-400 text-sm">Cargando catálogo...</p>}
          {catalogError && <p className="text-red-500 text-sm">{catalogError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
                className="border rounded p-2"
                value={projectDraft.nombre}
                onChange={(e) => updateProjectDraft('nombre', e.target.value)}
                placeholder="Nombre del proyecto"
            />
            <input
                className="border rounded p-2"
                value={projectDraft.descripcion}
                onChange={(e) => updateProjectDraft('descripcion', e.target.value)}
                placeholder="Descripción"
            />
          </div>
          <div className="mt-3">
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={createProject}>
              {project ? 'Actualizar proyecto' : 'Crear proyecto'}
            </button>
            {project && <span className="ml-3 text-sm text-gray-500">Activo: <strong>{project.nombre}</strong></span>}
          </div>
          {saveError && <p className="text-red-500 mt-2">{saveError}</p>}
          {saveOk && <p className="text-green-600 mt-2">{saveOk}</p>}
        </div>

        {/* Paso 2: Órdenes */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Paso 2: Órdenes</h2>
          {!project ? (
              <p className="text-gray-400">Crea el proyecto primero.</p>
          ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <input
                      className="border rounded p-2"
                      value={orderDraft.codigo}
                      onChange={(e) => updateOrderDraft('codigo', e.target.value)}
                      placeholder="Código de orden"
                  />
                  <input
                      className="border rounded p-2"
                      value={orderDraft.descripcion}
                      onChange={(e) => updateOrderDraft('descripcion', e.target.value)}
                      placeholder="Descripción"
                  />
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={createOrder}>
                  Agregar orden
                </button>
                {orders.length === 0 ? (
                    <p className="text-gray-400 mt-3">No hay órdenes aún.</p>
                ) : (
                    <div className="overflow-x-auto mt-3">
                      <table className="min-w-full border text-sm">
                        <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Orden</th>
                          <th className="p-2 text-left">Descripción</th>
                          <th className="p-2 text-left">Detalles</th>
                          <th className="p-2 text-left">Piezas</th>
                          <th className="p-2 text-left">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => {
                          const piezas = order.detalles.reduce((sum, d) => sum + (Number(d.cantidad) || 0), 0)
                          return (
                              <tr key={order.id} className="border-t">
                                <td className="p-2 truncate max-w-[120px]">{order.codigo}</td>
                                <td className="p-2 truncate max-w-[150px]">{order.descripcion || '-'}</td>
                                <td className="p-2">{order.detalles.length}</td>
                                <td className="p-2">{piezas}</td>
                                <td className="p-2 space-x-2">
                                  <button className="px-2 py-1 bg-yellow-500 text-white rounded text-xs" onClick={() => openDetalleModal(order)}>
                                    Detalle
                                  </button>
                                  <button className="px-2 py-1 bg-red-500 text-white rounded text-xs" onClick={() => removeOrder(order.id)}>
                                    Quitar
                                  </button>
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

        {/* Modal de detalles (con SearchableSelect) */}
        {activeOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
              <div className="bg-white rounded shadow-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold">Detalle de orden: {activeOrder.codigo}</h2>
                  <button className="px-3 py-1 bg-gray-300 rounded" onClick={closeDetalleModal}>Cerrar</button>
                </div>
                <div className="mb-3">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm" onClick={addModalRow}>+ Agregar fila</button>
                  <span className="ml-2 text-gray-500 text-sm">Filas: {modalRows.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[1200px] border text-sm">
                    <thead className="bg-gray-100 text-xs">
                    <tr>
                      <th className="p-1">#</th>
                      <th className="p-1">Tablero</th>
                      <th className="p-1">Cant.</th>
                      <th className="p-1">Largo</th>
                      <th className="p-1">Ancho</th>
                      <th className="p-1">L1</th><th className="p-1">L2</th><th className="p-1">A1</th><th className="p-1">A2</th>
                      <th className="p-1">Perf.Cant</th><th className="p-1">Perf.L1</th><th className="p-1">Perf.L2</th>
                      <th className="p-1">Ran.Dist</th><th className="p-1">Ran.Prof</th><th className="p-1">Ran.Es</th>
                      <th className="p-1">Observación</th>
                      <th className="p-1">Acción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {modalRows.map((row, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-1 text-center">{idx+1}</td>
                          <td className="p-1 min-w-[130px]"><SearchableSelect value={row.tablero} onChange={(v) => updateModalRow(idx, 'tablero', v)} options={tablerosKardex} placeholder="Tablero" /></td>
                          <td className="p-1"><input className="w-16 border rounded p-1" value={row.cantidad} onChange={(e) => updateModalRow(idx, 'cantidad', e.target.value)} placeholder="1" /></td>
                          <td className="p-1"><input className="w-20 border rounded p-1" value={row.largoVeta} onChange={(e) => updateModalRow(idx, 'largoVeta', e.target.value)} placeholder="Largo" /></td>
                          <td className="p-1"><input className="w-20 border rounded p-1" value={row.ancho} onChange={(e) => updateModalRow(idx, 'ancho', e.target.value)} placeholder="Ancho" /></td>
                          <td className="p-1 min-w-[100px]"><SearchableSelect value={row.l1} onChange={(v) => updateModalRow(idx, 'l1', v)} options={cantoOptions} placeholder="L1" /></td>
                          <td className="p-1 min-w-[100px]"><SearchableSelect value={row.l2} onChange={(v) => updateModalRow(idx, 'l2', v)} options={cantoOptions} placeholder="L2" /></td>
                          <td className="p-1 min-w-[100px]"><SearchableSelect value={row.a1} onChange={(v) => updateModalRow(idx, 'a1', v)} options={cantoOptions} placeholder="A1" /></td>
                          <td className="p-1 min-w-[100px]"><SearchableSelect value={row.a2} onChange={(v) => updateModalRow(idx, 'a2', v)} options={cantoOptions} placeholder="A2" /></td>
                          <td className="p-1"><input className="w-16 border rounded p-1" value={row.perforacionCantidad} onChange={(e) => updateModalRow(idx, 'perforacionCantidad', e.target.value)} /></td>
                          <td className="p-1"><select className="border rounded p-1" value={row.perforacionLado1} onChange={(e) => updateModalRow(idx, 'perforacionLado1', e.target.value)}><option>L1</option><option>L2</option><option>A1</option><option>A2</option></select></td>
                          <td className="p-1"><select className="border rounded p-1" value={row.perforacionLado2} onChange={(e) => updateModalRow(idx, 'perforacionLado2', e.target.value)}><option>L1</option><option>L2</option><option>A1</option><option>A2</option></select></td>
                          <td className="p-1"><select className="border rounded p-1" value={row.ranuraDist} onChange={(e) => updateModalRow(idx, 'ranuraDist', e.target.value)}><option>10</option><option>15</option><option>18</option></select></td>
                          <td className="p-1"><select className="border rounded p-1" value={row.ranuraProf} onChange={(e) => updateModalRow(idx, 'ranuraProf', e.target.value)}><option>6</option><option>8</option><option>10</option></select></td>
                          <td className="p-1"><select className="border rounded p-1" value={row.ranuraEs} onChange={(e) => updateModalRow(idx, 'ranuraEs', e.target.value)}><option>4</option><option>7</option></select></td>
                          <td className="p-1"><input className="w-32 border rounded p-1" value={row.observacion} onChange={(e) => updateModalRow(idx, 'observacion', e.target.value)} placeholder="Nota" /></td>
                          <td className="p-1"><button className="px-2 py-1 bg-red-400 text-white rounded text-xs" onClick={() => removeModalRow(idx)} disabled={modalRows.length===1}>Quitar</button></td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-right">
                  <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={saveDetalles}>Guardar detalle</button>
                </div>
              </div>
            </div>
        )}

        {/* Resumen y guardado final */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold">Resumen</h2>
          <p className="text-sm text-gray-600">
            Órdenes: {totalOrdenes} | Detalles: {totalDetalles} | Piezas: {totalPiezas}
          </p>
          <button className="mt-3 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50" onClick={saveAllToDatabase} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar todo en BD'}
          </button>
        </div>
      </div>
  )
}