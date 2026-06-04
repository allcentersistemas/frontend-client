import { useEffect, useMemo, useState } from 'react'
import {
  fetchPlanillaCatalogos,
  getProyectoOptimizacion,
  listProyectosOptimizacion,
  saveProyectoCompleto,
} from '../../api/orderApi'

// ----------------------------------------------
// SELECT CON BÚSQUEDA (reemplaza a KardexMaterialSelect)
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
      <div className="searchable-select" style={{ position: 'relative', minWidth: '120px' }}>
        <div
            className="select-trigger"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '6px 8px',
              cursor: 'pointer',
              backgroundColor: 'white',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
        >
          {selectedLabel}
        </div>
        {isOpen && (
            <div
                className="select-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  maxHeight: '250px',
                  overflowY: 'auto'
                }}
            >
              <input
                  type="text"
                  className="select-search"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    outline: 'none'
                  }}
                  autoFocus
              />
              {filteredOptions.length === 0 ? (
                  <div style={{ padding: '8px', color: '#999' }}>Sin resultados</div>
              ) : (
                  filteredOptions.map(opt => (
                      <div
                          key={opt.id || opt.name}
                          className="select-option"
                          onClick={() => {
                            onChange(opt.id || opt.name)
                            setIsOpen(false)
                            setSearch('')
                          }}
                          style={{
                            padding: '8px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
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
// FUNCIONES AUXILIARES (igual que antes)
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
  return {
    nombre: '',
    descripcion: '',
  }
}

const CANTO_FALLBACK = [
  { id: 'delgado', name: 'DELGADO', sku: '' },
  { id: 'grueso', name: 'GRUESO', sku: '' },
]

function newOrderDraft() {
  return {
    codigo: '',
    descripcion: '',
  }
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
// COMPONENTE PRINCIPAL
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
          setCatalogError(err.message || 'No se pudo cargar el catálogo de tableros y cantos.')
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
    return () => {
      cancelled = true
    }
  }, [])

  async function loadSavedProject(proyectoId) {
    setSaveError('')
    setSaveOk('')
    setLoadingProjectId(proyectoId)
    try {
      const response = await getProyectoOptimizacion(proyectoId)
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
      setSaveOk('Proyecto cargado desde el servidor.')
    } catch (err) {
      setSaveError(err.message || 'No se pudo cargar el proyecto.')
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
      try {
        const list = await listProyectosOptimizacion()
        setSavedProjects(Array.isArray(list) ? list : [])
      } catch {
        /* list refresh opcional */
      }
      setSaveOk(
          isPersistedProjectId(project.id)
              ? 'Proyecto actualizado correctamente en base de datos.'
              : 'Proyecto, ordenes y detalles guardados correctamente en base de datos.',
      )
    } catch (err) {
      setSaveError(err.message || 'No se pudo guardar la información en base de datos.')
    } finally {
      setSaving(false)
    }
  }

  return (
      <div className="space-y-6">
        <div className="page__head">
          <h1>Proyecto de corte</h1>
          <p className="page__lead">
            Flujo sugerido: primero crea el proyecto, luego agrega una o varias ordenes, y finalmente
            captura sus detalles en la ventana emergente usando el formato de planilla de corte.
          </p>
        </div>

        <div className="card pad">
          <h2 className="card__title mb-4">Mis proyectos guardados</h2>
          {loadingProjects ? (
              <p className="muted">Cargando proyectos…</p>
          ) : !savedProjects.length ? (
              <p className="muted">Aun no tiene proyectos guardados en el servidor.</p>
          ) : (
              <div className="table-wrap" style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: '500px' }}>
                  <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripcion</th>
                    <th>Ordenes</th>
                    <th>Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {savedProjects.map((item) => (
                      <tr key={item.id}>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.nombre}
                        </td>
                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.descripcion || '-'}
                        </td>
                        <td>{item.cantidadOrdenes ?? 0}</td>
                        <td>
                          <button
                              type="button"
                              className="btn secondary"
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

        <div className="card pad">
          <h2 className="card__title mb-4">Paso 1: Proyecto</h2>
          <p className="muted small" style={{ marginBottom: '0.75rem' }}>
            El cliente se asigna automaticamente con su sesion. Tableros y cantos se cargan del catalogo
            registrado en Inventario.
          </p>
          {catalogLoading ? <p className="muted small">Cargando catálogo…</p> : null}
          {catalogError ? <p className="form-error small">{catalogError}</p> : null}
          {!catalogLoading && !tablerosKardex.length ? (
              <p className="muted small">
                No hay tableros registrados. En el portal de empleados: Inventario → Tableros.
              </p>
          ) : null}
          {!catalogLoading && !cantosKardex.length ? (
              <p className="muted small">
                No hay cantos registrados; en el detalle se usan <strong>DELGADO</strong> y{' '}
                <strong>GRUESO</strong> por defecto. En empleados: Inventario → Cantos.
              </p>
          ) : null}
          <div className="material-grid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label className="field" style={{ flex: '1', minWidth: '200px' }}>
              Nombre del proyecto
              <input
                  value={projectDraft.nombre}
                  onChange={(e) => updateProjectDraft('nombre', e.target.value)}
                  placeholder="Cocina Integral #204"
              />
            </label>
            <label className="field span-2" style={{ flex: '2', minWidth: '250px' }}>
              Descripcion
              <input
                  value={projectDraft.descripcion}
                  onChange={(e) => updateProjectDraft('descripcion', e.target.value)}
                  placeholder="Notas generales del proyecto"
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn primary" onClick={createProject}>
              {project ? 'Actualizar proyecto' : 'Crear proyecto'}
            </button>
          </div>
          {project ? (
              <span className="muted">
            Proyecto activo: <strong>{project.nombre}</strong>
          </span>
          ) : null}
          {saveError ? <p className="form-error">{saveError}</p> : null}
          {saveOk ? <p className="form-ok">{saveOk}</p> : null}
        </div>

        <div className="card planilla-preview-card">
          <h2>Paso 2: Ordenes</h2>
          {!project ? (
              <p className="muted">Crea el proyecto para poder registrar ordenes.</p>
          ) : (
              <>
                <div className="material-grid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <label className="field" style={{ flex: '1', minWidth: '200px' }}>
                    Codigo de orden
                    <input
                        value={orderDraft.codigo}
                        onChange={(e) => updateOrderDraft('codigo', e.target.value)}
                        placeholder="ORD-001"
                    />
                  </label>
                  <label className="field span-2" style={{ flex: '2', minWidth: '250px' }}>
                    Descripcion
                    <input
                        value={orderDraft.descripcion}
                        onChange={(e) => updateOrderDraft('descripcion', e.target.value)}
                        placeholder="Descripcion de la orden"
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn primary" onClick={createOrder}>
                    Agregar orden
                  </button>
                </div>
                {!orders.length ? (
                    <p className="muted">Aun no hay ordenes registradas.</p>
                ) : (
                    <div className="table-wrap" style={{ overflowX: 'auto' }}>
                      <table className="data-table" style={{ minWidth: '600px' }}>
                        <thead>
                        <tr>
                          <th>Orden</th>
                          <th>Descripcion</th>
                          <th>Detalles</th>
                          <th>Piezas</th>
                          <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.map((order) => {
                          const piezasOrden = order.detalles.reduce((sum, detalle) => {
                            const qty = Number(detalle.cantidad || 0)
                            return Number.isFinite(qty) ? sum + qty : sum
                          }, 0)
                          return (
                              <tr key={order.id}>
                                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {order.codigo}
                                </td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {order.descripcion || '-'}
                                </td>
                                <td>{order.detalles.length}</td>
                                <td>{piezasOrden}</td>
                                <td>
                                  <div className="planilla-inline-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        className="btn secondary"
                                        onClick={() => openDetalleModal(order)}
                                    >
                                      Gestionar detalle
                                    </button>
                                    <button
                                        type="button"
                                        className="btn secondary"
                                        onClick={() => removeOrder(order.id)}
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

        {activeOrder ? (
            <div className="planilla-modal-backdrop" role="presentation" onClick={closeDetalleModal}>
              <div className="planilla-modal card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ width: '95%', maxWidth: '1400px', maxHeight: '90vh', overflow: 'auto' }}>
                <div className="planilla-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2>Detalle de orden: {activeOrder.codigo}</h2>
                  <button type="button" className="btn secondary" onClick={closeDetalleModal}>
                    Cerrar
                  </button>
                </div>
                <div className="planilla-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <button type="button" className="btn primary" onClick={addModalRow}>
                    Agregar fila
                  </button>
                  <span className="muted">Filas: {modalRows.length}</span>
                </div>

                <div className="table-wrap planilla-wrap" style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  <table className="data-table planilla-table" style={{ minWidth: '1400px' }}>
                    <thead>
                    <tr>
                      <th rowSpan={2}>Index</th>
                      <th rowSpan={2}>Tablero</th>
                      <th colSpan={3}>Piezas a cortar</th>
                      <th colSpan={4}>Canto</th>
                      <th colSpan={2}>Perforacion</th>
                      <th colSpan={4}>Ranuras</th>
                      <th rowSpan={2}>Observacion</th>
                      <th rowSpan={2}>Acciones</th>
                    </tr>
                    <tr>
                      <th>Cant.</th>
                      <th>Largo (veta)</th>
                      <th>Ancho</th>
                      <th>L1</th>
                      <th>L2</th>
                      <th>A1</th>
                      <th>A2</th>
                      <th>Cant.</th>
                      <th>Lado</th>
                      <th>Lado</th>
                      <th>Dist.</th>
                      <th>Prof.</th>
                      <th>Es.</th>
                    </tr>
                    </thead>
                    <tbody>
                    {modalRows.map((row, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td style={{ minWidth: '150px' }}>
                            <SearchableSelect
                                value={row.tablero}
                                onChange={(v) => updateModalRow(index, 'tablero', v)}
                                options={tablerosKardex}
                                placeholder="Tablero"
                            />
                          </td>
                          <td>
                            <input
                                value={row.cantidad}
                                onChange={(e) => updateModalRow(index, 'cantidad', e.target.value)}
                                inputMode="numeric"
                                placeholder="1"
                                style={{ width: '80px' }}
                            />
                          </td>
                          <td>
                            <input
                                value={row.largoVeta}
                                onChange={(e) => updateModalRow(index, 'largoVeta', e.target.value)}
                                placeholder="2000"
                                style={{ width: '100px' }}
                            />
                          </td>
                          <td>
                            <input
                                value={row.ancho}
                                onChange={(e) => updateModalRow(index, 'ancho', e.target.value)}
                                placeholder="300"
                                style={{ width: '100px' }}
                            />
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <SearchableSelect
                                value={row.l1}
                                onChange={(v) => updateModalRow(index, 'l1', v)}
                                options={cantoOptions}
                                placeholder="L1"
                            />
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <SearchableSelect
                                value={row.l2}
                                onChange={(v) => updateModalRow(index, 'l2', v)}
                                options={cantoOptions}
                                placeholder="L2"
                            />
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <SearchableSelect
                                value={row.a1}
                                onChange={(v) => updateModalRow(index, 'a1', v)}
                                options={cantoOptions}
                                placeholder="A1"
                            />
                          </td>
                          <td style={{ minWidth: '130px' }}>
                            <SearchableSelect
                                value={row.a2}
                                onChange={(v) => updateModalRow(index, 'a2', v)}
                                options={cantoOptions}
                                placeholder="A2"
                            />
                          </td>
                          <td>
                            <input
                                value={row.perforacionCantidad}
                                onChange={(e) => updateModalRow(index, 'perforacionCantidad', e.target.value)}
                                style={{ width: '70px' }}
                            />
                          </td>
                          <td>
                            <select
                                value={row.perforacionLado1 || 'L1'}
                                onChange={(e) => updateModalRow(index, 'perforacionLado1', e.target.value)}
                                style={{ width: '70px' }}
                            >
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="A1">a1</option>
                              <option value="A2">a2</option>
                            </select>
                          </td>
                          <td>
                            <select
                                value={row.perforacionLado2 || 'L1'}
                                onChange={(e) => updateModalRow(index, 'perforacionLado2', e.target.value)}
                                style={{ width: '70px' }}
                            >
                              <option value="L1">L1</option>
                              <option value="L2">L2</option>
                              <option value="a1">a1</option>
                              <option value="a2">a2</option>
                            </select>
                          </td>
                          <td>
                            <select
                                value={row.ranuraDist || '10'}
                                onChange={(e) => updateModalRow(index, 'ranuraDist', e.target.value)}
                                style={{ width: '70px' }}
                            >
                              <option value="10">10</option>
                              <option value="15">15</option>
                              <option value="18">18</option>
                            </select>
                          </td>
                          <td>
                            <select
                                value={row.ranuraProf || '6'}
                                onChange={(e) => updateModalRow(index, 'ranuraProf', e.target.value)}
                                style={{ width: '70px' }}
                            >
                              <option value="6">6</option>
                              <option value="8">8</option>
                              <option value="10">10</option>
                            </select>
                          </td>
                          <td>
                            <select
                                value={row.ranuraEs || '4'}
                                onChange={(e) => updateModalRow(index, 'ranuraEs', e.target.value)}
                                style={{ width: '70px' }}
                            >
                              <option value="4">4</option>
                              <option value="7">7</option>
                            </select>
                          </td>
                          <td>
                            <input
                                value={row.observacion}
                                onChange={(e) => updateModalRow(index, 'observacion', e.target.value)}
                                placeholder="Notas..."
                                style={{ width: '120px' }}
                            />
                          </td>
                          <td>
                            <button
                                type="button"
                                className="btn secondary planilla-remove"
                                onClick={() => removeModalRow(index)}
                                disabled={modalRows.length === 1}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
                <div className="planilla-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                  <span className="muted">Guarda para actualizar el detalle de la orden.</span>
                  <button type="button" className="btn primary" onClick={saveDetalles}>
                    Guardar detalle
                  </button>
                </div>
              </div>
            </div>
        ) : null}

        <div className="card planilla-preview-card">
          <h2>Resumen del flujo</h2>
          <p className="muted">
            Ordenes: <strong>{totalOrdenes}</strong> | Detalles: <strong>{totalDetalles}</strong> |
            Piezas: <strong>{totalPiezas}</strong>
          </p>
          <div className="form-actions">
            <button type="button" className="btn primary" onClick={saveAllToDatabase} disabled={saving}>
              {saving ? 'Guardando en BD…' : 'Guardar todo en base de datos'}
            </button>
          </div>
        </div>
      </div>
  )
}