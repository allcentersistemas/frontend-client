import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlanillaCatalogos, fetchMaquinas, getProyectoOptimizacion, saveProyectoCompleto, updateProyectoMaquina } from '../api/orderApi'
import {
  collectCantoCatalogErrors,
  formatCantoCatalogErrors,
} from '../planilla/cantoImportValidation'
import { collectRanuraImportErrors, formatRanuraImportErrors } from '../planilla/ranuraImportValidation'
import {
  isPersistedProjectId,
  mapDetalleToApiPayload,
  mapOrdersFromApi,
  mergeCantoOptions,
  newOrderDraft,
  newProjectDraft,
  planillaBasePath,
} from '../planilla/helpers'

const PlanillaDraftContext = createContext(null)

const DRAFT_STORAGE_KEY = 'planilla-client-draft'

function readStoredDraft(projectKey) {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.projectKey !== projectKey) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredDraft(projectKey, payload) {
  try {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        projectKey,
        ...payload,
        savedAt: Date.now(),
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

/**
 * @param {{ projectKey: string, children: import('react').ReactNode }} props
 */
export function PlanillaDraftProvider({ projectKey, children }) {
  const navigate = useNavigate()
  const persistedId =
    projectKey && projectKey !== 'nuevo' && Number.isFinite(Number(projectKey)) ? Number(projectKey) : null

  const [projectDraft, setProjectDraft] = useState(newProjectDraft())
  const [project, setProject] = useState(null)
  const [orderDraft, setOrderDraft] = useState(newOrderDraft())
  const [orders, setOrders] = useState([])
  const [loadingProject, setLoadingProject] = useState(Boolean(persistedId))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveOk, setSaveOk] = useState('')
  const [tableros, setTableros] = useState([])
  const [cantos, setCantos] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [projectEditable, setProjectEditable] = useState(true)
  const [projectEstado, setProjectEstado] = useState('')
  const [maquinas, setMaquinas] = useState([])
  const [maquinaId, setMaquinaId] = useState('')
  const [maquinaParametros, setMaquinaParametros] = useState('')

  const cantoOptions = useMemo(() => mergeCantoOptions(cantos), [cantos])
  const basePath = useMemo(() => planillaBasePath(project), [project])
  const selectedMaquina = useMemo(
    () => maquinas.find((m) => String(m.id) === String(maquinaId)) || null,
    [maquinas, maquinaId],
  )

  const persistDraft = useCallback(
    (nextProject, nextProjectDraft, nextOrders) => {
      writeStoredDraft(projectKey, {
        project: nextProject,
        projectDraft: nextProjectDraft,
        orders: nextOrders,
      })
    },
    [projectKey],
  )

  const loadProject = useCallback(
    async (id) => {
      setLoadingProject(true)
      setSaveError('')
      try {
        const response = await getProyectoOptimizacion(id)
        const savedProject = response?.project
        if (!savedProject) {
          setSaveError('No se pudo cargar el proyecto.')
          return
        }
        const nextProject = {
          id: savedProject.id,
          nombre: savedProject.nombre || '',
          descripcion: savedProject.descripcion || '',
          creadoEn: savedProject.fechaCreacion,
          estado: savedProject.estado || 'ENVIADO',
          cotizacionArchivo: savedProject.cotizacionArchivo || '',
        }
        const editable = savedProject.editable !== false
        setProjectEditable(editable)
        setProjectEstado(savedProject.estado || 'ENVIADO')
        if (savedProject.maquinaId) {
          setMaquinaId(String(savedProject.maquinaId))
          setMaquinaParametros(savedProject.maquinaParametros || '')
        }
        const nextDraft = {
          nombre: savedProject.nombre || '',
          descripcion: savedProject.descripcion || '',
        }
        const nextOrders = mapOrdersFromApi(response.orders)
        setProject(nextProject)
        setProjectDraft(nextDraft)
        setOrders(nextOrders)
        persistDraft(nextProject, nextDraft, nextOrders)
      } catch (err) {
        setSaveError(err.message || 'No se pudo cargar el proyecto.')
      } finally {
        setLoadingProject(false)
      }
    },
    [persistDraft],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCatalogLoading(true)
      setCatalogError('')
      try {
        const [catalog, maquinasList] = await Promise.all([
          fetchPlanillaCatalogos(),
          fetchMaquinas().catch(() => []),
        ])
        if (!cancelled) {
          setTableros(Array.isArray(catalog?.tableros) ? catalog.tableros : [])
          setCantos(Array.isArray(catalog?.cantos) ? catalog.cantos : [])
          setMaquinas(Array.isArray(maquinasList) ? maquinasList : [])
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
    if (persistedId) {
      void loadProject(persistedId)
      return
    }

    const stored = readStoredDraft(projectKey)
    if (stored?.project) {
      setProject(stored.project)
      setProjectDraft(stored.projectDraft || newProjectDraft())
      setOrders(Array.isArray(stored.orders) ? stored.orders : [])
    } else {
      setProject(null)
      setProjectDraft(newProjectDraft())
      setOrders([])
    }
    setLoadingProject(false)
  }, [persistedId, projectKey, loadProject])

  useEffect(() => {
    if (loadingProject || !projectEditable) return
    persistDraft(project, projectDraft, orders)
  }, [project, projectDraft, orders, loadingProject, projectEditable, persistDraft])

  const updateProjectDraft = useCallback((key, value) => {
    setProjectDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const activateProject = useCallback(() => {
    if (!projectDraft.nombre.trim()) return false
    const persistedProjectId =
      project?.id && isPersistedProjectId(project.id) ? project.id : Date.now()
    setProject({
      ...projectDraft,
      id: persistedProjectId,
      creadoEn: project?.creadoEn || new Date().toISOString(),
    })
    setSaveError('')
    setSaveOk('')
    return true
  }, [project, projectDraft])

  const updateOrderDraft = useCallback((key, value) => {
    setOrderDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addOrder = useCallback(() => {
    if (!project || !orderDraft.codigo.trim()) return null
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
    return order
  }, [project, orderDraft])

  const removeOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
  }, [])

  const updateOrderDetalles = useCallback((orderId, detalles) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, detalles } : order)),
    )
    setSaveOk('Detalle de orden actualizado.')
  }, [])

  const updateOrderMeta = useCallback((orderId, patch) => {
    if (!orderId || !patch || typeof patch !== 'object') return
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order
        const next = { ...order }
        if (patch.codigo != null) {
          next.codigo = String(patch.codigo)
        }
        if (patch.descripcion != null) {
          next.descripcion = String(patch.descripcion)
        }
        return next
      }),
    )
    setSaveOk('')
  }, [])

  const updateMaquinaSelection = useCallback(
    async (nextMaquinaId) => {
      setMaquinaId(nextMaquinaId)
      const machine = maquinas.find((m) => String(m.id) === String(nextMaquinaId))
      setMaquinaParametros(machine?.codigo || '')
      if (project && isPersistedProjectId(project.id) && nextMaquinaId) {
        try {
          await updateProyectoMaquina(project.id, Number(nextMaquinaId))
        } catch {
          /* draft local sigue válido para export */
        }
      }
    },
    [maquinas, project],
  )

  const saveAllToDatabase = useCallback(async () => {
    if (!project) {
      setSaveError('Primero debe crear el proyecto.')
      return false
    }
    if (!orders.length) {
      setSaveError('Debe agregar al menos una orden.')
      return false
    }
    for (const order of orders) {
      if (!String(order.codigo || '').trim()) {
        setSaveError('Todas las órdenes deben tener código / nombre.')
        return false
      }
    }
    if ((persistedId && !projectEditable) || (project && isPersistedProjectId(project.id) && !projectEditable)) {
      setSaveError('Este proyecto ya fue enviado y no puede modificarse.')
      return false
    }
    for (const order of orders) {
      const cantoErrors = collectCantoCatalogErrors(order.detalles, cantoOptions)
      if (cantoErrors.length) {
        setSaveError(
          formatCantoCatalogErrors(
            cantoErrors,
            `Orden «${order.codigo}»: corrija los cantos antes de enviar el proyecto.`,
          ),
        )
        return false
      }
      const ranuraErrors = collectRanuraImportErrors(order.detalles)
      if (ranuraErrors.length) {
        setSaveError(
          formatRanuraImportErrors(
            ranuraErrors,
            `Orden «${order.codigo}»: corrija perforación y ranuras antes de enviar el proyecto.`,
          ),
        )
        return false
      }
    }
    setSaveError('')
    setSaveOk('')
    setSaving(true)
    try {
      const nombreEnvio = (projectDraft.nombre || project.nombre || '').trim()
      const descripcionEnvio = (projectDraft.descripcion ?? project.descripcion ?? '').trim()
      if (!nombreEnvio) {
        setSaveError('El nombre del proyecto es obligatorio.')
        setSaving(false)
        return false
      }
      const response = await saveProyectoCompleto({
        projectId: null,
        project: {
          nombre: nombreEnvio,
          descripcion: descripcionEnvio,
          maquinaId: maquinaId ? Number(maquinaId) : null,
        },
        orders: orders.map((order) => ({
          codigo: String(order.codigo || '').trim(),
          descripcion: String(order.descripcion || '').trim(),
          detalles: order.detalles.map(mapDetalleToApiPayload),
        })),
      })
      const savedProject = response?.project
      const nextOrders = mapOrdersFromApi(response?.orders)
      if (savedProject) {
        const nextProject = {
          id: savedProject.id,
          nombre: savedProject.nombre || nombreEnvio,
          descripcion: savedProject.descripcion || descripcionEnvio,
          creadoEn: savedProject.fechaCreacion || project.creadoEn,
          estado: savedProject.estado || 'ENVIADO',
        }
        setProject(nextProject)
        setProjectEditable(false)
        setProjectEstado(savedProject.estado || 'ENVIADO')
        if (savedProject.maquinaId) {
          setMaquinaId(String(savedProject.maquinaId))
          setMaquinaParametros(savedProject.maquinaParametros || '')
        }
        setOrders(nextOrders)
        persistDraft(nextProject, projectDraft, nextOrders)
        sessionStorage.removeItem(DRAFT_STORAGE_KEY)
        if (savedProject.id) {
          navigate(`/app/planilla-corte/${savedProject.id}`, { replace: true })
        }
      } else {
        setOrders(nextOrders)
      }
      setSaveOk('Proyecto enviado correctamente. Ventas lo revisará pronto.')
      return true
    } catch (err) {
      setSaveError(err.message || 'No se pudo guardar.')
      return false
    } finally {
      setSaving(false)
    }
  }, [navigate, orders, cantoOptions, persistDraft, project, projectDraft, maquinaId, persistedId, projectEditable])

  const value = useMemo(
    () => ({
      projectKey,
      project,
      projectDraft,
      orderDraft,
      orders,
      loadingProject,
      saving,
      saveError,
      saveOk,
      tableros,
      cantos,
      cantoOptions,
      catalogLoading,
      catalogError,
      projectEditable,
      projectEstado,
      maquinas,
      maquinaId,
      maquinaParametros,
      selectedMaquina,
      basePath,
      setSaveError,
      setSaveOk,
      updateProjectDraft,
      activateProject,
      updateOrderDraft,
      addOrder,
      removeOrder,
      updateOrderDetalles,
      updateOrderMeta,
      updateMaquinaSelection,
      saveAllToDatabase,
    }),
    [
      projectKey,
      project,
      projectDraft,
      orderDraft,
      orders,
      loadingProject,
      saving,
      saveError,
      saveOk,
      tableros,
      cantos,
      cantoOptions,
      catalogLoading,
      catalogError,
      projectEditable,
      projectEstado,
      maquinas,
      maquinaId,
      maquinaParametros,
      selectedMaquina,
      basePath,
      updateProjectDraft,
      activateProject,
      updateOrderDraft,
      addOrder,
      removeOrder,
      updateOrderDetalles,
      updateOrderMeta,
      updateMaquinaSelection,
      saveAllToDatabase,
    ],
  )

  return <PlanillaDraftContext.Provider value={value}>{children}</PlanillaDraftContext.Provider>
}

export function usePlanillaDraft() {
  const ctx = useContext(PlanillaDraftContext)
  if (!ctx) {
    throw new Error('usePlanillaDraft debe usarse dentro de PlanillaDraftProvider')
  }
  return ctx
}
