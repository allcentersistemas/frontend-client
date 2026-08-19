import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { PlanillaDetalleEditor } from '../../components/planilla/PlanillaDetalleEditor'
import { usePlanillaDraft } from '../../context/PlanillaDraftContext'
import { newDetalle, planillaOrderDetallePath } from '../../planilla/helpers'
import { normalizeMeasureRow, validateAllBoardMeasures, validateBoardMeasureValue } from '../../planilla/measureInput'
import { validateCantoCatalogInRows } from '../../planilla/cantoImportValidation'
import { formatDetalleImportErrors } from '../../planilla/detalleImportErrors'
import { validateRanuraOptionsInRows } from '../../planilla/ranuraImportValidation'
import { parsePlanillaDetalleExcel } from '../../planilla/excelImport'
import { mapAiExtractToDetalleRows } from '../../planilla/aiImport'
import { downloadPlanillaTemplateExcel } from '../../planilla/excelTemplate'
import {
  downloadPlantillaPlanillaFromServer,
  extractMedidasFromImage,
  fetchOptimizacionFeatures,
} from '../../api/orderApi'
import { resizePlanillaAiImage } from '../../utils/resizePlanillaAiImage'

function confirmPhotoImportChecklist() {
  return window.confirm(
    [
      'Antes de subir la foto, confirme:',
      '',
      '• La hoja muestra Cantidad, Largo y Ancho (mm).',
      '• La foto está nítida, completa y bien iluminada.',
      '• No es una selfie, factura ni captura sin medidas de corte.',
      '',
      '¿Continuar con la importación por foto?',
    ].join('\n'),
  )
}

function PlanillaOrdenDetalleModal({ orderId, readOnly, onClose }) {
  const {
    project,
    orders,
    tableros,
    cantoOptions,
    loadingProject,
    updateOrderDetalles,
    updateOrderMeta,
    maquinaParametros,
  } = usePlanillaDraft()

  const order = useMemo(
    () => orders.find((item) => String(item.id) === String(orderId)) || null,
    [orders, orderId],
  )

  const [rows, setRows] = useState([newDetalle()])
  const [sharedTablero, setSharedTablero] = useState('')
  const [measureError, setMeasureError] = useState('')
  const [aiVisionEnabled, setAiVisionEnabled] = useState(false)

  useEffect(() => {
    if (!order) return
    const detalles = order.detalles.length ? order.detalles.map((d) => ({ ...d })) : [newDetalle()]
    setRows(detalles)
    setSharedTablero(detalles.find((d) => d.tablero)?.tablero || '')
  }, [order])

  useEffect(() => {
    if (readOnly) {
      setAiVisionEnabled(false)
      return
    }
    let cancelled = false
    fetchOptimizacionFeatures()
      .then((features) => {
        if (!cancelled) setAiVisionEnabled(Boolean(features?.aiVisionEnabled))
      })
      .catch(() => {
        if (!cancelled) setAiVisionEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [readOnly])

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
      if (!sharedTablero?.trim()) {
        window.alert('Seleccione el material (tablero) en el desplegable antes de importar el Excel.')
        return
      }
      const hasData = rows.some((row) => row.cantidad || row.largoVeta || row.ancho)
      if (
        hasData &&
        !window.confirm(
          '¿Reemplazar las filas actuales con los datos del Excel? Se importan cantidad, largo, ancho, cantos (L1–A2), perforación y ranuras. El material será el del desplegable.',
        )
      ) {
        return
      }
      try {
        const { rows: imported, cantoErrors, ranuraErrors } = await parsePlanillaDetalleExcel(file, {
          cantoOptions,
        })
        setRows(imported.map((row) => ({ ...row, tablero: sharedTablero })))
        const importMsg = formatDetalleImportErrors(cantoErrors, ranuraErrors)
        setMeasureError(importMsg)
      } catch (e) {
        setMeasureError(e instanceof Error ? e.message : 'No se pudo leer el Excel.')
        throw e
      }
    },
    [readOnly, order, rows, sharedTablero, cantoOptions],
  )

  const handleImportPhoto = useCallback(
    async (file) => {
      if (readOnly || !order) return
      if (!sharedTablero?.trim()) {
        window.alert('Seleccione el material (tablero) en el desplegable antes de importar desde la foto.')
        return
      }
      if (!confirmPhotoImportChecklist()) {
        return
      }
      const hasData = rows.some((row) => row.cantidad || row.largoVeta || row.ancho)
      if (
        hasData &&
        !window.confirm(
          '¿Reemplazar las filas actuales con las medidas leídas de la foto? Se importan Cant./Largo/Ancho, cantos y ranuras. Revise siempre los valores.',
        )
      ) {
        return
      }
      try {
        setMeasureError('')
        const resized = await resizePlanillaAiImage(file, { maxSide: 1600, quality: 0.82 })
        const result = await extractMedidasFromImage(resized)
        const { rows: imported, cantoErrors, ranuraErrors } = mapAiExtractToDetalleRows(result?.filas, {
          cantoOptions,
        })
        if (!imported.length) {
          setMeasureError('No se detectaron filas de corte en la imagen. Pruebe con otra foto más nítida.')
          return
        }
        setRows(imported.map((row) => ({ ...row, tablero: sharedTablero })))
        const importMsg = formatDetalleImportErrors(cantoErrors, ranuraErrors)
        setMeasureError(
          importMsg ||
            `Se importaron ${imported.length} fila(s) desde la foto. Revise Cant./Largo/Ancho, cantos y ranuras antes de guardar.`,
        )
      } catch (e) {
        setMeasureError(e instanceof Error ? e.message : 'No se pudo leer la foto con IA.')
        throw e
      }
    },
    [readOnly, order, rows, sharedTablero, cantoOptions],
  )

  const handleSave = useCallback(() => {
    if (readOnly || !order) return
    const withMaterial = rows.map((row) => ({ ...row, tablero: sharedTablero }))
    const cantoError = validateCantoCatalogInRows(withMaterial, cantoOptions)
    if (cantoError) {
      setMeasureError(cantoError)
      return
    }
    const ranuraError = validateRanuraOptionsInRows(withMaterial)
    if (ranuraError) {
      setMeasureError(ranuraError)
      return
    }
    const validationError = validateAllBoardMeasures(withMaterial)
    if (validationError) {
      setMeasureError(validationError)
      return
    }
    setMeasureError('')
    updateOrderDetalles(order.id, withMaterial.map(normalizeMeasureRow))
    onClose()
  }, [readOnly, order, rows, sharedTablero, cantoOptions, updateOrderDetalles, onClose])

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
      onDownloadTemplate={async () => {
        try {
          await downloadPlantillaPlanillaFromServer()
        } catch (err) {
          if (String(err?.message || '') === 'NO_SERVER_TEMPLATE') {
            downloadPlanillaTemplateExcel()
            return
          }
          window.alert(err?.message || 'No se pudo descargar la plantilla.')
        }
      }}
      onImportExcel={readOnly ? undefined : handleImportExcel}
      onImportPhoto={readOnly || !aiVisionEnabled ? undefined : handleImportPhoto}
      onUpdateOrderMeta={
        readOnly
          ? undefined
          : (patch) => {
              updateOrderMeta(order.id, patch)
            }
      }
      onAddRow={
        readOnly
          ? undefined
          : (patch) => setRows((prev) => [...prev, { ...newDetalle(), ...(patch || {}) }])
      }
      onUpdateRow={
        readOnly
          ? undefined
          : (index, key, value) => {
              setMeasureError('')
              setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
            }
      }
      onBulkUpdateColumn={
        readOnly
          ? undefined
          : (key, value) => {
              setMeasureError('')
              setRows((prev) => prev.map((row) => ({ ...row, [key]: value })))
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
