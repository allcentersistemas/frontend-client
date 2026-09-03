import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlanillaDetalleEditor } from '../../components/planilla/PlanillaDetalleEditor'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { newDetalle } from '../../planilla/helpers'
import { validateCantoCatalogInRows } from '../../planilla/cantoImportValidation'
import { validateRanuraOptionsInRows } from '../../planilla/ranuraImportValidation'
import {
  normalizeMeasureRow,
  validateAllBoardMeasures,
  validateBoardMeasureValue,
  validateRowsHaveMaterial,
} from '../../planilla/measureInput'

export default function PlanillaOrdenDetallePage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const {
    project,
    orders,
    basePath,
    tableros,
    cantoOptions,
    loadingProject,
    updateOrderDetalles,
    updateOrderMeta,
  } = usePlanillaDraft()

  const order = useMemo(
    () => orders.find((item) => String(item.id) === String(orderId)) || null,
    [orders, orderId],
  )

  const [rows, setRows] = useState([newDetalle()])
  const [measureError, setMeasureError] = useState('')
  const hydratedOrderIdRef = useRef(null)
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  useEffect(() => {
    if (!order) return
    const idKey = String(order.id)
    if (hydratedOrderIdRef.current === idKey) return
    hydratedOrderIdRef.current = idKey
    setRows(order.detalles.length ? order.detalles.map((d) => ({ ...d })) : [newDetalle()])
    setMeasureError('')
  }, [order])

  useEffect(() => {
    if (loadingProject) return
    if (!order) {
      navigate(basePath, { replace: true })
    }
  }, [order, loadingProject, navigate, basePath])

  const persistDraft = useCallback(
    (nextRows = rowsRef.current) => {
      if (!order) return
      updateOrderDetalles(order.id, nextRows.map(normalizeMeasureRow), { silent: true })
    },
    [order, updateOrderDetalles],
  )

  useEffect(() => {
    if (!order) return
    if (hydratedOrderIdRef.current !== String(order.id)) return
    const t = window.setTimeout(() => persistDraft(rows), 400)
    return () => window.clearTimeout(t)
  }, [rows, order, persistDraft])

  useEffect(() => {
    return () => {
      if (hydratedOrderIdRef.current != null && hydratedOrderIdRef.current === String(orderId)) {
        persistDraft(rowsRef.current)
      }
    }
  }, [persistDraft, orderId])

  const handleBack = useCallback(() => {
    persistDraft()
    navigate(basePath)
  }, [persistDraft, navigate, basePath])

  const handleSave = useCallback(() => {
    if (!order) return
    const materialError = validateRowsHaveMaterial(rows)
    if (materialError) {
      setMeasureError(materialError)
      return
    }
    const cantoError = validateCantoCatalogInRows(rows, cantoOptions)
    if (cantoError) {
      setMeasureError(cantoError)
      return
    }
    const ranuraError = validateRanuraOptionsInRows(rows)
    if (ranuraError) {
      setMeasureError(ranuraError)
      return
    }
    const validationError = validateAllBoardMeasures(rows)
    if (validationError) {
      setMeasureError(validationError)
      return
    }
    setMeasureError('')
    updateOrderDetalles(order.id, rows.map(normalizeMeasureRow))
    navigate(basePath)
  }, [order, rows, cantoOptions, updateOrderDetalles, navigate, basePath])

  const handleBoardMeasureBlur = useCallback((rowIndex, key, value) => {
    const message = validateBoardMeasureValue(key, value, rowIndex)
    if (!message) {
      setMeasureError('')
      return
    }
    setMeasureError(message)
    setRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [key]: '' } : row)),
    )
  }, [])

  const addRow = useCallback((patch) => {
    setRows((prev) => [...prev, { ...newDetalle(), ...(patch || {}) }])
  }, [])

  const removeRow = useCallback((index) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateRow = useCallback((index, key, value) => {
    setMeasureError('')
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }, [])

  const bulkUpdateColumn = useCallback((key, value) => {
    setMeasureError('')
    setRows((prev) => prev.map((row) => ({ ...row, [key]: value })))
  }, [])

  const patchRow = useCallback((index, patch) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }, [])

  if (loadingProject || !order) {
    return (
      <div className="card pad flex items-center gap-4">
        <div className="app-loading__spinner h-8 w-8" aria-hidden />
        <p className="muted">{loadingProject ? 'Cargando…' : 'Redirigiendo…'}</p>
      </div>
    )
  }

  return (
    <PlanillaDetalleEditor
      order={order}
      projectName={project?.nombre}
      rows={rows}
      tableros={tableros}
      cantoOptions={cantoOptions}
      onClose={handleBack}
      onSave={handleSave}
      onUpdateOrderMeta={(patch) => updateOrderMeta(order.id, patch)}
      onAddRow={addRow}
      onUpdateRow={updateRow}
      onBulkUpdateColumn={bulkUpdateColumn}
      onPatchRow={patchRow}
      onRemoveRow={removeRow}
      measureError={measureError}
      onBoardMeasureBlur={handleBoardMeasureBlur}
    />
  )
}
