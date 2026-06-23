import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { PlanillaDetalleEditor } from '../../components/planilla/PlanillaDetalleEditor'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { newDetalle, planillaOrderDetallePath } from '../../planilla/helpers'
import { normalizeMeasureRow } from '../../planilla/measureInput'
import { downloadOrderExcel, orderExcelFilename } from '../../planilla/excelExport'

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

  useEffect(() => {
    if (!order) return
    setRows(order.detalles.length ? order.detalles.map((d) => ({ ...d })) : [newDetalle()])
  }, [order])

  const handleSave = useCallback(() => {
    if (readOnly || !order) return
    updateOrderDetalles(order.id, rows.map(normalizeMeasureRow))
    onClose()
  }, [readOnly, order, rows, updateOrderDetalles, onClose])

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
      tableros={tableros}
      cantoOptions={cantoOptions}
      readOnly={readOnly}
      onClose={onClose}
      onSave={handleSave}
      maquinaParametros={maquinaParametros}
      onDownloadExcel={() => {
        downloadOrderExcel(orderExcelFilename(order, project?.nombre), { ...order, detalles: rows }, {
          maquinaParametros,
        })
      }}
      onAddRow={readOnly ? undefined : () => setRows((prev) => [...prev, newDetalle()])}
      onUpdateRow={
        readOnly
          ? undefined
          : (index, key, value) =>
              setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
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
        className="planilla-modal planilla-modal--detalle"
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
