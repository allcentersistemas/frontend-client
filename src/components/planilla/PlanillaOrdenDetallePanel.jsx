import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlanillaDetalleEditor } from '../../components/planilla/PlanillaDetalleEditor'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { newDetalle, planillaOrderDetallePath } from '../../planilla/helpers'

export function PlanillaOrdenDetallePanel({ orderId, readOnly = false }) {
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

  useEffect(() => {
    if (!order) return
    setRows(order.detalles.length ? order.detalles.map((d) => ({ ...d })) : [newDetalle()])
  }, [order])

  const closePanel = useCallback(() => {
    navigate(basePath)
  }, [navigate, basePath])

  const handleSave = useCallback(() => {
    if (readOnly || !order) return
    updateOrderDetalles(order.id, rows)
    navigate(basePath)
  }, [readOnly, order, rows, updateOrderDetalles, navigate, basePath])

  if (loadingProject || !order) {
    return (
      <aside className="planilla-split__panel">
        <div className="card pad flex items-center gap-4">
          <div className="app-loading__spinner h-8 w-8" aria-hidden />
          <p className="muted">{loadingProject ? 'Cargando…' : 'Orden no encontrada'}</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="planilla-split__panel">
      <PlanillaDetalleEditor
        order={order}
        projectName={project?.nombre}
        backHref={basePath}
        rows={rows}
        tableros={tableros}
        cantoOptions={cantoOptions}
        readOnly={readOnly}
        onBack={closePanel}
        onSave={handleSave}
        onAddRow={readOnly ? undefined : () => setRows((prev) => [...prev, newDetalle()])}
        onUpdateRow={
          readOnly
            ? undefined
            : (index, key, value) =>
                setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
        }
        onRemoveRow={
          readOnly
            ? undefined
            : (index) => setRows((prev) => prev.filter((_, i) => i !== index))
        }
      />
    </aside>
  )
}

export function openPlanillaDetalle(navigate, project, orderId) {
  navigate(planillaOrderDetallePath(project, orderId))
}
