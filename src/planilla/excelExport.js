import * as XLSX from 'xlsx'
import { EXCEL_EXPORT_COLUMNS } from './detalleColumns'
import { vetaToPayload } from './helpers'
import {
  exportCantoValue,
  formatObservacionForExport,
  formatPerforacionRanuraForExport,
} from './exportDescHelpers'
import { formatMeasureForOptimizer } from './measureExport'

function formatInt(value) {
  if (value === '' || value == null) return ''
  const n = parseInt(String(value).replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? String(n) : ''
}

function withTrailingSpace(value) {
  return exportCantoValue(value)
}

function blankOrString(value) {
  if (value == null) return ''
  return String(value).trim()
}

function rowToExcelCells(row, { pParams }) {
  return {
    pCodeMat: withTrailingSpace(row.tablero),
    pParams: pParams || '',
    pMinq: formatInt(row.cantidad),
    pLength: formatMeasureForOptimizer(row.largoVeta),
    pWidth: formatMeasureForOptimizer(row.ancho),
    pGrain: vetaToPayload(Boolean(row.vetaLongitud)).toLowerCase(),
    pEdgeMaSup: withTrailingSpace(row.l1),
    pEdgeMaInf: withTrailingSpace(row.l2),
    pEdgeMaIzq: withTrailingSpace(row.a1),
    pEdgeMaDer: withTrailingSpace(row.a2),
    pIdesc: formatPerforacionRanuraForExport(row),
    pIidesc: formatObservacionForExport(row),
  }
}

/**
 * Genera y descarga un .xlsx de una sola orden.
 */
export function downloadOrderExcel(filename, order, { maquinaParametros = '' } = {}) {
  const technicalRow = EXCEL_EXPORT_COLUMNS.map((c) => c.technical)
  const labelRow = EXCEL_EXPORT_COLUMNS.map((c) => c.label)
  const dataRows = (order.detalles || []).map((detalle) => {
    const cells = rowToExcelCells(detalle, { pParams: maquinaParametros })
    return EXCEL_EXPORT_COLUMNS.map((col) => cells[col.key] ?? '')
  })

  const sheetData = [technicalRow, labelRow, ...dataRows]
  const ws = XLSX.utils.aoa_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Planilla')
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

export function orderExcelFilename(order, projectName = 'proyecto') {
  const projectSlug = String(projectName || 'proyecto').replace(/[^\w.-]+/g, '_')
  const orderSlug = String(order.codigo || `orden-${order.id}`).replace(/[^\w.-]+/g, '_')
  return `${projectSlug}_${orderSlug}.xlsx`
}
