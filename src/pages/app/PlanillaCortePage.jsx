import { useEffect, useMemo, useState } from 'react'
import {
  fetchPlanillaCatalogos,
  getProyectoOptimizacion,
  listProyectosOptimizacion,
  saveProyectoCompleto,
} from '../../api/orderApi'
import { KardexMaterialSelect } from '../../components/planilla/KardexMaterialSelect'

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

  // Estados para los buscadores
  const [tableroSearchTerm, setTableroSearchTerm] = useState('')
  const [cantoSearchTerm, setCantoSearchTerm] = useState('')

  // Filtrar tableros según búsqueda
  const filteredTableros = useMemo(() => {
    if (!tableroSearchTerm.trim()) return tablerosKardex
    return tablerosKardex.filter(tablero =>
        tablero.name?.toLowerCase().includes(tableroSearchTerm.toLowerCase()) ||
        tablero.sku?.toLowerCase().includes(tableroSearchTerm.toLowerCase())
    )
  }, [tablerosKardex, tableroSearchTerm])

  const cantoOptions = useMemo(() => {
    let merged = [...cantosKardex]

    // Filtrar cantos según búsqueda
    if (cantoSearchTerm.trim()) {
      merged = merged.filter(canto =>
          String(canto.name || canto.sku || '').toLowerCase().includes(cantoSearchTerm.toLowerCase())
      )
    }

    for (const fb of CANTO_FALLBACK) {
      const key = fb.name.toUpperCase()
      if (!merged.some((o) => String(o.name || o.sku || '').toUpperCase() === key)) {
        merged.push(fb)
      }
    }
    return merged
  }, [cantosKardex, cantoSearchTerm])

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
      <div className="planilla-container">
        <style jsx>{`
        .planilla-container {
          max-width: 100%;
          overflow-x: auto;
          padding: 1rem;
        }
        
        @media (min-width: 768px) {
          .planilla-container {
            padding: 1.5rem;
          }
        }
        
        @media (min-width: 1024px) {
          .planilla-container {
            padding: 2rem;
          }
        }
        
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        @media (min-width: 768px) {
          .responsive-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
        }
        
        .search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        @media (max-width: 768px) {
          .planilla-table {
            font-size: 0.75rem;
          }
          
          .planilla-table input,
          .planilla-table select {
            font-size: 0.75rem;
            padding: 0.25rem;
          }
          
          .btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }
        }
        
        @media (max-width: 640px) {
          .planilla-table th,
          .planilla-table td {
            padding: 0.5rem;
          }
          
          .card {
            padding: 1rem;
          }
          
          .card__title {
            font-size: 1.25rem;
          }
        }
      `}</style>

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
                <div className="table-wrap">
                  <table className="data-table">
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
                          <td>{item.nombre}</td>
                          <td>{item.descripcion || '-'}</td>
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

            <div className="responsive-grid">
              <label className="field">
                Nombre del proyecto
                <input
                    value={projectDraft.nombre}
                    onChange={(e) => updateProjectDraft('nombre', e.target.value)}
                    placeholder="Cocina Integral #204"
                />
              </label>
              <label className="field">
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
                  <div className="responsive-grid">
                    <label className="field">
                      Codigo de orden
                      <input
                          value={orderDraft.codigo}
                          onChange={(e) => updateOrderDraft('codigo', e.target.value)}
                          placeholder="ORD-001"
                      />
                    </label>
                    <label className="field">
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
                      <div className="table-wrap">
                        <table className="data-table">
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
                                  <td>{order.codigo}</td>
                                  <td>{order.descripcion || '-'}</td>
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
                <div className="planilla-modal card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                  <div className="planilla-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Detalle de orden: {activeOrder.codigo}</h2>
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

                  <div className="table-wrap planilla-wrap" style={{ overflowX: 'auto' }}>
                    <table className="data-table planilla-table" style={{ minWidth: '1200px' }}>
                      <thead>
                      <tr>
                        <th rowSpan={2}>Index</th>
                        <th rowSpan={2}>Tablero</th>
                        <th colSpan={3}>Piezas a cortar</th>
                        <th colSpan={4}>Canto</th>
                        <th colSpan={2}>Perforacion</th>
                        <th colSpan={3}>Ranuras</th>
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
                        <th>Dist.</th>
                        <th>Prof.</th>
                        <th>Es.</th>
                      </tr>
                      </thead>
                      <tbody>
                      {modalRows.map((row, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td style={{ minWidth: '200px' }}>
                              <input
                                  type="text"
                                  placeholder="Buscar tablero..."
                                  value={tableroSearchTerm}
                                  onChange={(e) => setTableroSearchTerm(e.target.value)}
                                  className="search-input"
                              />
                              <KardexMaterialSelect
                                  value={row.tablero}
                                  onChange={(v) => updateModalRow(index, 'tablero', v)}
                                  options={filteredTableros}
                                  placeholder="Seleccionar tablero"
                              />
                            </td>
                            <td>
                              <input
                                  value={row.cantidad}
                                  onChange={(e) => updateModalRow(index, 'cantidad', e.target.value)}
                                  inputMode="numeric"
                                  placeholder="1"
                                  style={{ width: '70px' }}
                              />
                            </td>
                            <td>
                              <input
                                  value={row.largoVeta}
                                  onChange={(e) => updateModalRow(index, 'largoVeta', e.target.value)}
                                  placeholder="2000"
                                  style={{ width: '80px' }}
                              />
                            </td>
                            <td>
                              <input
                                  value={row.ancho}
                                  onChange={(e) => updateModalRow(index, 'ancho', e.target.value)}
                                  placeholder="300"
                                  style={{ width: '80px' }}
                              />
                            </td>
                            <td style={{ minWidth: '180px' }}>
                              <input
                                  type="text"
                                  placeholder="Buscar canto..."
                                  value={cantoSearchTerm}
                                  onChange={(e) => setCantoSearchTerm(e.target.value)}
                                  className="search-input"
                              />
                              <KardexMaterialSelect
                                  value={row.l1}
                                  onChange={(v) => updateModalRow(index, 'l1', v)}
                                  options={cantoOptions}
                                  placeholder="L1"
                              />
                            </td>
                            <td>
                              <KardexMaterialSelect
                                  value={row.l2}
                                  onChange={(v) => updateModalRow(index, 'l2', v)}
                                  options={cantoOptions}
                                  placeholder="L2"
                              />
                            </td>
                            <td>
                              <KardexMaterialSelect
                                  value={row.a1}
                                  onChange={(v) => updateModalRow(index, 'a1', v)}
                                  options={cantoOptions}
                                  placeholder="A1"
                              />
                            </td>
                            <td>
                              <KardexMaterialSelect
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
                                  placeholder="Cant"
                                  style={{ width: '60px' }}
                              />
                            </td>
                            <td>
                              <select
                                  value={row.perforacionLado1 || 'L1'}
                                  onChange={(e) => updateModalRow(index, 'perforacionLado1', e.target.value)}
                                  style={{ width: '60px' }}
                              >
                                <option value="L1">L1</option>
                                <option value="L2">L2</option>
                                <option value="A1">a1</option>
                                <option value="A2">a2</option>
                              </select>
                            </td>
                            <td>
                              <select
                                  value={row.ranuraDist || '10'}
                                  onChange={(e) => updateModalRow(index, 'ranuraDist', e.target.value)}
                                  style={{ width: '60px' }}
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
                                  style={{ width: '60px' }}
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
                                  style={{ width: '60px' }}
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
                                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="planilla-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
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
            <div className="responsive-grid" style={{ marginBottom: '1rem' }}>
              <p className="muted">
                <strong>Ordenes:</strong> {totalOrdenes}
              </p>
              <p className="muted">
                <strong>Detalles:</strong> {totalDetalles}
              </p>
              <p className="muted">
                <strong>Piezas:</strong> {totalPiezas}
              </p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn primary" onClick={saveAllToDatabase} disabled={saving}>
                {saving ? 'Guardando en BD…' : 'Guardar todo en base de datos'}
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}