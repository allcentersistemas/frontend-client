import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlanillaDetalleEditor } from '../../components/planilla/PlanillaDetalleEditor'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { newDetalle } from '../../planilla/helpers'
import { normalizeMeasureRow, validateAllBoardMeasures, validateBoardMeasureValue } from '../../planilla/measureInput'

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
  } = usePlanillaDraft()

  const order = useMemo(
    () => orders.find((item) => String(item.id) === String(orderId)) || null,
    [orders, orderId],
  )

  const [rows, setRows] = useState([newDetalle()])
  const [measureError, setMeasureError] = useState('')

  useEffect(() => {
    if (!order) return
    setRows(order.detalles.length ? order.detalles.map((d) => ({ ...d })) : [newDetalle()])
  }, [order])

  useEffect(() => {
    if (loadingProject) return
    if (!order) {
      navigate(basePath, { replace: true })
    }
  }, [order, loadingProject, navigate, basePath])

  const handleBack = useCallback(() => {
    navigate(basePath)
  }, [navigate, basePath])

  const handleSave = useCallback(() => {
    if (!order) return
    const validationError = validateAllBoardMeasures(rows)
    if (validationError) {
      setMeasureError(validationError)
      return
    }
    setMeasureError('')
    updateOrderDetalles(order.id, rows.map(normalizeMeasureRow))
    navigate(basePath)
  }, [order, rows, updateOrderDetalles, navigate, basePath])

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

  const handleUpdateRow = useCallback((index, key, value) => {
    setMeasureError('')
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }, [])

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, newDetalle()])
  }, [])

  const removeRow = useCallback((index) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateRow = useCallback((index, key, value) => {
    handleUpdateRow(index, key, value)
  }, [handleUpdateRow])

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
      backHref={basePath}
      rows={rows}
      tableros={tableros}
      cantoOptions={cantoOptions}
      onBack={handleBack}
      onSave={handleSave}
      onAddRow={addRow}
      onUpdateRow={updateRow}
      onPatchRow={patchRow}
      onRemoveRow={removeRow}
      measureError={measureError}
      onBoardMeasureBlur={handleBoardMeasureBlur}
    />
  )
}
