import { DETALLE_TABLE_COLUMNS } from './detalleColumns'

export const DETALLE_COLUMN_KEYS = DETALLE_TABLE_COLUMNS.map((c) => c.key)

export function detalleCellSelector(rowIndex, colKey) {
  return `[data-detalle-row="${rowIndex}"][data-detalle-col="${colKey}"]`
}

export function focusDetalleCell(rowIndex, colKey) {
  const el = document.querySelector(detalleCellSelector(rowIndex, colKey))
  if (!el) return false
  el.focus()
  if (el.select && typeof el.select === 'function' && el.tagName === 'INPUT') {
    el.select()
  }
  return true
}

export function handleDetalleCellTab(e, rowIndex, colKey, { onEndOfRow }) {
  if (e.key !== 'Tab' || e.shiftKey) return

  const colIndex = DETALLE_COLUMN_KEYS.indexOf(colKey)
  if (colIndex < 0) return

  if (colIndex < DETALLE_COLUMN_KEYS.length - 1) {
    e.preventDefault()
    focusDetalleCell(rowIndex, DETALLE_COLUMN_KEYS[colIndex + 1])
    return
  }

  e.preventDefault()
  onEndOfRow?.(rowIndex)
}

export function cellNavProps(rowIndex, colKey, tabHandlers) {
  return {
    'data-detalle-row': rowIndex,
    'data-detalle-col': colKey,
    onKeyDown: (e) => handleDetalleCellTab(e, rowIndex, colKey, tabHandlers),
  }
}
