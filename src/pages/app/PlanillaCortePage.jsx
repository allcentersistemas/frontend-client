import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  getProyectoOptimizacion,
  listProyectosOptimizacion,
  saveProyectoCompleto,
} from '../../api/orderApi'

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
    cliente: '',
    referencia: '',
    descripcion: '',
  }
}

function newOrderDraft() {
  return {
    codigo: '',
    descripcion: '',
  }
}

function clientDisplayName(user) {
  if (!user) return ''
  if (user.razonSocial?.trim()) return user.razonSocial.trim()
  if (user.displayName?.trim()) return user.displayName.trim()
  if (user.nombre?.trim()) return user.nombre.trim()
  return user.email || ''
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
  const { user } = useOutletContext()
  const clientName = clientDisplayName(user)
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
    setProjectDraft((prev) =>
      prev.cliente
        ? prev
        : {
            ...prev,
            cliente: clientName,
          },
    )
  }, [clientName])

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
        cliente: savedProject.cliente || clientName,
        referencia: savedProject.referencia || '',
        descripcion: savedProject.descripcion || '',
        creadoEn: savedProject.fechaCreacion,
      })
      setProjectDraft({
        nombre: savedProject.nombre || '',
        cliente: savedProject.cliente || clientName,
        referencia: savedProject.referencia || '',
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
          cliente: project.cliente || clientName,
          referencia: project.referencia,
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
          cliente: savedProject.cliente || project.cliente,
          referencia: savedProject.referencia || project.referencia,
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
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Referencia</th>
                  <th>Ordenes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {savedProjects.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nombre}</td>
                    <td>{item.referencia || '-'}</td>
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
        <div className="material-grid">
          <label className="field">
            Nombre del proyecto
            <input
              value={projectDraft.nombre}
              onChange={(e) => updateProjectDraft('nombre', e.target.value)}
              placeholder="Cocina Integral #204"
            />
          </label>
          <label className="field">
            Cliente
            <input
              value={projectDraft.cliente}
              readOnly
              placeholder="Cliente autocompletado"
            />
          </label>
          <label className="field">
            Referencia
            <input
              value={projectDraft.referencia}
              onChange={(e) => updateProjectDraft('referencia', e.target.value)}
              placeholder="OT-2026-05"
            />
          </label>
          <label className="field span-2">
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
            <div className="material-grid">
              <label className="field">
                Codigo de orden
                <input
                  value={orderDraft.codigo}
                  onChange={(e) => updateOrderDraft('codigo', e.target.value)}
                  placeholder="ORD-001"
                />
              </label>
              <label className="field span-2">
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
                            <div className="planilla-inline-actions">
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
            <div className="planilla-actions">
              <h2>Detalle de orden: {activeOrder.codigo}</h2>
              <button type="button" className="btn secondary" onClick={closeDetalleModal}>
                Cerrar
              </button>
            </div>
            <div className="planilla-actions">
              <button type="button" className="btn primary" onClick={addModalRow}>
                Agregar fila
              </button>
              <span className="muted">Filas: {modalRows.length}</span>
            </div>
            <div className="table-wrap planilla-wrap">
              <table className="data-table planilla-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Index</th>
                    <th rowSpan={2}>Tablero</th>
                    <th colSpan={3}>Piezas a cortar</th>
                    <th colSpan={4}>Canto</th>
                    <th colSpan={2}>Perforacion</th>
                    <th colSpan={4}>Ranuras</th>
                    {/*<th rowSpan={2}>OK</th>*/}
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
                      <td>
                        <input
                            value={row.tablero}
                            onChange={(e) => updateModalRow(index, 'tablero', e.target.value)}
                            placeholder="MDF 18mm"
                        />
                      </td>
                      <td>
                        <input
                            value={row.cantidad}
                            onChange={(e) => updateModalRow(index, 'cantidad', e.target.value)}
                            inputMode="numeric"
                            placeholder="1"
                        />
                      </td>
                      <td>
                        <input
                            value={row.largoVeta}
                            onChange={(e) => updateModalRow(index, 'largoVeta', e.target.value)}
                            placeholder="2000"
                        />
                      </td>
                      <td>
                        <input
                            value={row.ancho}
                            onChange={(e) => updateModalRow(index, 'ancho', e.target.value)}
                            placeholder="300"
                        />
                      </td>

                      {/* Canto: L1, L2, A1, A2 con opciones según imagen */}
                      <td>
                        <select
                            value={row.l1 || 'L1'}
                            onChange={(e) => updateModalRow(index, 'l1', e.target.value)}
                        >
                          <option value="DELGADO">DELGADO</option>
                          <option value="GRUESO">GRUESO</option>
                        </select>
                      </td>
                      <td>
                        <select
                            value={row.l2 || 'L2'}
                            onChange={(e) => updateModalRow(index, 'l2', e.target.value)}
                        >
                          <option value="DELGADO">DELGADO</option>
                        <option value="GRUESO">GRUESO</option>
                        </select>
                      </td>
                      <td>
                        <select
                            value={row.a1 || 'a1'}
                            onChange={(e) => updateModalRow(index, 'a1', e.target.value)}
                        >
                          <option value="DELGADO">DELGADO</option>
                          <option value="GRUESO">GRUESO</option>
                        </select>
                      </td>
                      <td>
                        <select
                            value={row.a2 || 'a2'}
                            onChange={(e) => updateModalRow(index, 'a2', e.target.value)}
                        >
                          <option value="DELGADO">DELGADO</option>
                          <option value="GRUESO">GRUESO</option>
                        </select>
                      </td>

                      {/* Perforación: Cantidad (input), Lado1 y Lado2 con opciones L1/L2/a1/a2 */}
                      <td>
                        <input
                            value={row.perforacionCantidad}
                            onChange={(e) => updateModalRow(index, 'perforacionCantidad', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                            value={row.perforacionLado1 || 'L1'}
                            onChange={(e) => updateModalRow(index, 'perforacionLado1', e.target.value)}
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
                        >
                          <option value="L1">L1</option>
                          <option value="L2">L2</option>
                          <option value="a1">a1</option>
                          <option value="a2">a2</option>
                        </select>
                      </td>

                      {/* Ranuras: Dist. (10/15/18), Prof. (6/8/10), Es. (4/7) */}
                      <td>
                        <select
                            value={row.ranuraDist || '10'}
                            onChange={(e) => updateModalRow(index, 'ranuraDist', e.target.value)}
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
                        >
                          <option value="4">4</option>
                          <option value="7">7</option>
                        </select>
                      </td>

                      {/*<td className="planilla-check">*/}
                      {/*  <input*/}
                      {/*      type="checkbox"*/}
                      {/*      checked={row.observado}*/}
                      {/*      onChange={(e) => updateModalRow(index, 'observado', e.target.checked)}*/}
                      {/*  />*/}
                      {/*</td>*/}
                      <td>
                        <input
                            value={row.observacion}
                            onChange={(e) => updateModalRow(index, 'observacion', e.target.value)}
                            placeholder="Notas..."
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
            <div className="planilla-actions">
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
