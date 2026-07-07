import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { PlanillaDetalleEditor } from '../../components/planilla/PlanillaDetalleEditor'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { newDetalle, planillaOrderDetallePath } from '../../planilla/helpers'
import { normalizeMeasureRow, validateAllBoardMeasures, validateBoardMeasureValue } from '../../planilla/measureInput'
import { downloadOrderExcel, orderExcelFilename } from '../../planilla/excelExport'
import { parsePlanillaDetalleExcel } from '../../planilla/excelImport'
import { downloadPlanillaTemplateExcel } from '../../planilla/excelTemplate'

function PlanillaOrdenDetalleModal({ orderId, readOnly, onClose }) {
  const {
    project,
    orders,
    tableros,
    cantoOptions,
    loadingProject,
    updateOrderDetalles,
    maquinaParametros,
  } = usePlanillaDraft()

  const order = useMemo(
    () => orders.find((item) => String(item.id) === String(orderId)) || null,
    [orders, orderId],
  )

  const [rows, setRows] = useState([newDetalle()])
  const [sharedTablero, setSharedTablero] = useState('')
  const [measureError, setMeasureError] = useState('')

  useEffect(() => {
    if (!order) return
    const detalles = order.detalles.length ? order.detalles.map((d) => ({ ...d })) : [newDetalle()]
    setRows(detalles)
    setSharedTablero(detalles.find((d) => d.tablero)?.tablero || '')
  }, [order])

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

  const handleImportExcel = useCallback(
    async (file) => {
      if (readOnly || !order) return
      const hasData = rows.some((row) => row.cantidad || row.largoVeta || row.ancho)
      if (
        hasData &&
        !window.confirm(
          '¿Reemplazar las filas actuales con los datos del Excel? Se importan medidas, cantos, perforación, ranuras y material.',
        )
      ) {
        return
      }
      try {
        const { rows: imported, sharedTablero: importedTablero } = await parsePlanillaDetalleExcel(file)
        setMeasureError('')
        if (importedTablero) setSharedTablero(importedTablero)
        setRows(imported)
      } catch (e) {
        setMeasureError(e instanceof Error ? e.message : 'No se pudo leer el Excel.')
        throw e
      }
    },
    [readOnly, order, rows],
  )

  const handleSave = useCallback(() => {
    if (readOnly || !order) return
    const withMaterial = rows.map((row) => ({ ...row, tablero: sharedTablero }))
    const validationError = validateAllBoardMeasures(withMaterial)
    if (validationError) {
      setMeasureError(validationError)
      return
    }
    setMeasureError('')
    updateOrderDetalles(order.id, withMaterial.map(normalizeMeasureRow))
    onClose()
  }, [readOnly, order, rows, sharedTablero, updateOrderDetalles, onClose])

  if (loadingProject || !order) {
    return (
      <div className="planilla-modal__body flex items-center gap-4 p-8">
        <div className="app-loading__spinner h-8 w-8" aria-hidden />
        <p className="muted">{loadingProject ? 'Cargando…' : 'Orden no encontrada'}</p>
      </div>
    )
  }

  return (
    <PlanillaDetalleEditor
      order={order}
      projectName={project?.nombre}
      rows={rows}
      sharedTablero={sharedTablero}
      onSharedTableroChange={readOnly ? undefined : setSharedTablero}
      tableros={tableros}
      cantoOptions={cantoOptions}
      readOnly={readOnly}
      onClose={onClose}
      onSave={handleSave}
      maquinaParametros={maquinaParametros}
      onDownloadExcel={() => {
        const detalles = rows.map((row) => ({ ...row, tablero: sharedTablero }))
        downloadOrderExcel(orderExcelFilename(order, project?.nombre), { ...order, detalles }, {
          maquinaParametros,
        })
      }}
      onDownloadTemplate={() => downloadPlanillaTemplateExcel()}
      onImportExcel={readOnly ? undefined : handleImportExcel}
      onAddRow={readOnly ? undefined : () => setRows((prev) => [...prev, newDetalle()])}
      onUpdateRow={
        readOnly
          ? undefined
          : (index, key, value) => {
              setMeasureError('')
              setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
            }
      }
      onPatchRow={
        readOnly
          ? undefined
          : (index, patch) =>
              setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
      }
      onRemoveRow={
        readOnly ? undefined : (index) => setRows((prev) => prev.filter((_, i) => i !== index))
      }
      measureError={measureError}
      onBoardMeasureBlur={readOnly ? undefined : handleBoardMeasureBlur}
    />
  )
}

export function PlanillaOrdenDetallePanel({ orderId, readOnly = false }) {
  const navigate = useNavigate()
  const { basePath } = usePlanillaDraft()

  const closeModal = useCallback(() => {
    navigate(basePath)
  }, [navigate, basePath])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [closeModal])

  return createPortal(
    <div
      className="planilla-modal-backdrop"
      onClick={closeModal}
      role="presentation"
    >
      <div
        className="planilla-modal planilla-modal--detalle flex min-h-0 flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planilla-orden-title"
        onClick={(event) => event.stopPropagation()}
      >
        <PlanillaOrdenDetalleModal orderId={orderId} readOnly={readOnly} onClose={closeModal} />
      </div>
    </div>,
    document.body,
  )
}

export function openPlanillaDetalle(navigate, project, orderId) {
  navigate(planillaOrderDetallePath(project, orderId))
}
