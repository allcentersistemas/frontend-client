import * as XLSX from 'xlsx'
import { EXCEL_EXPORT_COLUMNS } from './detalleColumns'
import { vetaToPayload } from './helpers'

function formatDecimal(value) {
  if (value === '' || value == null) return ''
  const n = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n)) return String(value)
  return n.toFixed(1).replace('.', ',')
}

function formatInt(value) {
  if (value === '' || value == null) return ''
  const n = parseInt(String(value).replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : ''
}

function rowToExcelCells(row, { pParams, pIdesc }) {
  return {
    pCodeMat: row.tablero || '',
    pParams: pParams || '',
    pMinq: formatInt(row.cantidad),
    pLength: formatDecimal(row.largoVeta),
    pWidth: formatDecimal(row.ancho),
    pGrain: vetaToPayload(Boolean(row.vetaLongitud)),
    pEdgeMaSup: row.l1 || '',
    pEdgeMaInf: row.l2 || '',
    pEdgeMaIzq: row.a1 || '',
    pEdgeMaDer: row.a2 || '',
    pIdesc: pIdesc || row.observacion || '',
    pIidesc: '',
  }
}

/**
 * Genera y descarga un .xlsx de una sola orden.
 */
export function downloadOrderExcel(filename, order, { maquinaParametros = '', projectName = '' } = {}) {
  const technicalRow = EXCEL_EXPORT_COLUMNS.map((c) => c.technical)
  const labelRow = EXCEL_EXPORT_COLUMNS.map((c) => c.label)
  const pIdesc = order.descripcion || projectName || ''
  const dataRows = (order.detalles || []).map((detalle) => {
    const cells = rowToExcelCells(detalle, { pParams: maquinaParametros, pIdesc })
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
